import os
import zipfile
import pandas as pd
import torch
from transformers import AutoModelForSeq2SeqLM, AutoTokenizer, BitsAndBytesConfig
from peft import PeftModel, PeftConfig
from bs4 import BeautifulSoup
import re
import time
from pygame import mixer
import json

class DataAnalyzer:
    def __init__(self):
        
        with open('/media/sahil/data1/gyan_backend/app/cfg/path/path_config.json', 'r') as file:
                self.data = json.load(file)      
        
        self.logs_path = self.data["use_case"]["data_analyser"]["logs_path"]
        self.model_path = self.data["use_case"]["data_analyser"]["model_path"]
        
        self.model, self.tokenizer, self.sum_time = self.load_data_analyser_model()
        
    
    def unzip_file(self, zip_file_path, extract_to):
        if not os.path.exists(extract_to):
            os.makedirs(extract_to)
        
        with zipfile.ZipFile(zip_file_path, 'r') as zip_ref:
            zip_ref.extractall(extract_to)


    def remove_zip_extension(self, filename):
        base, extension = os.path.splitext(filename)
        if extension.lower() == ".zip":
            return base
        else:
            return filename

    def load_data_analyser_model(self):
        torch.cuda.empty_cache()
        peft_model_id = self.model_path
        config = PeftConfig.from_pretrained(peft_model_id)

        quantization_config = BitsAndBytesConfig(
            load_in_8bit = True, 
        )

        model = AutoModelForSeq2SeqLM.from_pretrained(config.base_model_name_or_path, device_map="auto")
        tokenizer = AutoTokenizer.from_pretrained(config.base_model_name_or_path)
        model = PeftModel.from_pretrained(model, peft_model_id, device_map={"": 0})
        model.eval()

        sum_time = 0
        mixer.init()

        return model, tokenizer, sum_time

    def extract_failure_reason(self, text):
        if 'FailureStandard :' in text:
            return text.split('FailureStandard :')[1].strip()
        elif 'FailureReasonStandardCenturyDBStatus' in text:
            parts = text.split(':')
            return ''.join(parts[1:9]).split("Actual Response")[0]
        return None

    def get_hours_minutes(self, time_str):
        parts = time_str.split(':')
        if len(parts) >= 2:
            return int(parts[0]), int(parts[1])
        return None, None

    def hours_minutes_differ(self, time1, time2):
        h1, m1 = self.get_hours_minutes(time1)
        h2, m2 = self.get_hours_minutes(time2)
        return h1 != h2 or m1 != m2

    def second_code_generator(self, zip_file_path):
        with zipfile.ZipFile(zip_file_path, 'r') as zip_ref:
            extent_html_files = [file for file in zip_ref.namelist() if file.startswith('Extent') and file.endswith('.html')]
            for html_file in extent_html_files:
                with zip_ref.open(html_file) as file:
                    html_content = file.read()
                    soup = BeautifulSoup(html_content, 'html.parser')
                    event_rows = soup.find_all(class_="badge fail-bg log")
                    for row in event_rows:
                        parent_div = row.find_parent('div', class_='card')
                        card_title = parent_div.find(class_="card-title").text.strip()
                        title_part = card_title.split("-")[1]
                        if "DB" in title_part:
                            yield title_part

    def inferencing(self, prompt):
        input_ids = self.tokenizer(prompt, return_tensors="pt", truncation=True).input_ids.cuda()
        start_time = time.time()
        outputs = self.model.generate(input_ids=input_ids, max_new_tokens=500, do_sample=True, top_p=0.9)
        end_time = time.time()

        self.sum_time += (end_time - start_time)
        output = self.tokenizer.batch_decode(outputs.detach().cpu().numpy(), skip_special_tokens=True)[0]
        
        return output

    def read_from_excel_infer_data_analyser(self, excel_file, column1_index, column2_index):
        failure_list = []
        df = pd.read_excel(excel_file)

        for i in range(len(df)):
            input_data = "API is " + str(df.iloc[i, column1_index]) + ". Failure message is " + str(df.iloc[i, column2_index])
            json_input_data = json.dumps(input_data)
            text_value = self.inferencing(json_input_data)
            failure_list.append({"failure": input_data, "fix": text_value})

        return failure_list

    def extent_report(self, zip_file_path):
        second_code_output_generator = self.second_code_generator(zip_file_path)

        with zipfile.ZipFile(zip_file_path, 'r') as zip_ref:
            extent_html_files = [file for file in zip_ref.namelist() if file.startswith('Extent') and file.endswith('.html')]

            data = []
            prev_time = None
            for html_file in extent_html_files:
                with zip_ref.open(html_file) as file:
                    html_content = file.read()
                    soup = BeautifulSoup(html_content, 'html.parser')
                    rows = soup.find_all('tr')

                    for row in rows:
                        cols = row.find_all('td')
                        cols = [ele.text.strip() for ele in cols]
                        if len(cols) >= 3 and 'FailureReason' in cols[2]:
                            if prev_time is not None and self.hours_minutes_differ(prev_time, cols[1]):
                                data.append(['', ''])
                            data.append(['', cols[2]])
                            prev_time = cols[1]

            df1 = pd.DataFrame(data, columns=['API', 'Failure message'])  # Include an empty column at the beginning
            df1 = df1.dropna()
            df1 = pd.concat([df1.iloc[:0], pd.DataFrame([['', '']], columns=['API', 'Failure message']), df1.iloc[0:]]).reset_index(drop=True)


            for i, row in df1.iterrows():
                if row['Failure message'] == '':
                    api_name = next(second_code_output_generator, '')
                    api_index = i
                else:
                    if row['API'] == '':
                        df1.at[i, 'API'] = api_name
                    else:
                        api_name = row['API']

            dfs = []
            
            for html_file in extent_html_files:
                with zip_ref.open(html_file) as file:
                    html_content = file.read()

                    soup = BeautifulSoup(html_content, 'html.parser')

                    rows = soup.find_all('tr')

                    data = []
                    for row in rows:
                        cols = row.find_all('td')
                        cols = [ele.text.strip() for ele in cols]
                        data.append(cols)
                    df = pd.DataFrame(data)
                    dfs.append(df)

            combined_df1 = pd.concat(dfs, ignore_index=True)
            combined_df1 = combined_df1.dropna()

            in_fail_group = False
            include_rows = []

            for idx, row in combined_df1.iterrows():
                if row[0].startswith('Fail'):
                    in_fail_group = True
                if in_fail_group:
                    include_rows.append(row)
                if in_fail_group and (row[0].startswith('Pass') or idx == len(combined_df1) - 1):
                    in_fail_group = False

            filtered_df1 = pd.DataFrame(include_rows)
            filtered_df1 = filtered_df1[~filtered_df1[0].str.startswith('Pass')]
            filtered_df1 = filtered_df1[filtered_df1[2].str.contains('TestCase :|FailureStandard :')]
            filtered_df1['API'] = filtered_df1[2].apply(lambda x: x.split('TestCase :')[1].strip() if 'TestCase :' in x else None)
            filtered_df1['Failure message'] = filtered_df1[2].apply(lambda x: x.split('FailureStandard :')[1].strip() if 'FailureStandard :' in x else None)

            filtered_df1 = filtered_df1[['API', 'Failure message']]

            combined_rows = []
            for i in range(0, len(filtered_df1), 2):
                if i+1 < len(filtered_df1):
                    combined_row = filtered_df1.iloc[i].copy()
                    api1 = filtered_df1.iloc[i]['API'] if pd.notnull(filtered_df1.iloc[i]['API']) else ''
                    api2 = filtered_df1.iloc[i+1]['API'] if pd.notnull(filtered_df1.iloc[i+1]['API']) else ''
                    combined_row['API'] = api1 + api2
                    msg1 = filtered_df1.iloc[i]['Failure message'] if pd.notnull(filtered_df1.iloc[i]['Failure message']) else ''
                    msg2 = filtered_df1.iloc[i+1]['Failure message'] if pd.notnull(filtered_df1.iloc[i+1]['Failure message']) else ''
                    combined_row['Failure message'] = msg1 + msg2
                    combined_rows.append(combined_row)
                else:
                    combined_rows.append(filtered_df1.iloc[i])

            combined_df1 = pd.DataFrame(combined_rows)
            
            df1.dropna(how='all', inplace=True)

            grouped = df1.groupby('API')

           
            # Combine the dataframes from both codes
            final_df = pd.concat([df1, combined_df1], ignore_index=True)
            # Save the combined dataframe to Excel
            
            excel_file_path2 = f'{self.logs_path}/ExtentReports/output.xlsx'

            if not os.path.exists(f"{self.logs_path}/ExtentReports"):
                os.makedirs(f"{self.logs_path}/ExtentReports")
            
            with pd.ExcelWriter(excel_file_path2, engine='openpyxl') as writer:
                final_df.to_excel(writer, sheet_name='Sheet1', index=False)


            df = pd.read_excel(excel_file_path2)

            # Remove rows with any NaN values
            df_cleaned = df.dropna()
           

            # Write the cleaned DataFrame back to an Excel file
            df_cleaned.to_excel(excel_file_path2, index=False)

        
            scenario_name_element = soup.find('p', class_='name')  # Adjust class or tag as per your HTML structure

            if scenario_name_element:
                scenario_name = scenario_name_element.get_text()

            else:
                print("Scenario name not found in the HTML.")
        
        # For Pie chart
        soup = BeautifulSoup(html_content, 'html.parser')

        # Find all script tags containing JavaScript
        script_tags = soup.find_all('script')

        if script_tags:
            for script_tag in script_tags:
                if script_tag and script_tag.string is not None:
                # Extract the JavaScript content
                
                    js_content = script_tag.string
                
                    pattern = r'passChild:\s*\d+,\s*failChild:\s*\d+'

            # Search for the pattern within the JavaScript content
                    match = re.search(pattern, js_content)

                    if match:
                        regex = r"passChild:\s*(\d+),\s*failChild:\s*(\d+)"
                        matched_string = match.group(0)
                        matches = re.findall(regex,matched_string)
                        pass_child_digits = int(matches[0][0])
                        fail_child_digits = int(matches[0][1])
                        
                    else:
                        print("Pattern not found.")
        else:
            print("No script tags found.")
            
        column1_index = 0  # Index of the first column you want to merge
        column2_index = 1
        failure_list = self.read_from_excel_infer_data_analyser(excel_file_path2,column1_index,column2_index)
        return failure_list,scenario_name, pass_child_digits, fail_child_digits, html_file


    def extract_api_and_failure(self, data):
        api_failure_list = []
        for item in data:
            failure = item['failure']
        
            fixes=item['fix']
            
            api_start_index = failure.find("API is ") + len("API is ")
            api_end_index = failure.find(". Failure message is ")
            api = failure[api_start_index:api_end_index].strip()

            failure_message_start_index = failure.find("Failure message is ") + len("Failure message is ")
            # failure_message_end_index = failure.find(". Possible reasons are ")
            failure_message = failure[failure_message_start_index:].strip()
        
                    
            possible_reasons_start_index = fixes.find("Possible reasons are ") + len("Possible reasons are ")
            possible_reasons_end_index = fixes.find(". And its fixes are ")
            possible_reasons = fixes[possible_reasons_start_index:possible_reasons_end_index].strip()

            fixes_start_index = fixes.find("And its fixes are ") + len("And its fixes are ")
            fixes = fixes[fixes_start_index:].strip()

            api_failure_list.append({
                'api': api,
                'failure_message': failure_message,
                'possible_reasons': possible_reasons,
                'fixes': fixes.split('.')

            })
            
        return api_failure_list
    
    def unload_model(self):
        self.model = None
        torch.cuda.empty_cache()