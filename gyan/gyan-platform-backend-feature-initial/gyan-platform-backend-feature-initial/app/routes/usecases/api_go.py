from fastapi import APIRouter, Response, UploadFile, File, Depends, HTTPException, Cookie, Request
from fastapi.responses import JSONResponse, FileResponse
from fastapi.encoders import jsonable_encoder
import tempfile

from pydantic import BaseModel
from sqlalchemy.orm import Session
from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import FileResponse

from app.usecases.automation.infer_go import GoUTC
from app.database.connection import get_db
from app.database.crud import DBOperations
from app.core.utils import load_endpoints, get_prefix

import os
import shutil

ENDPOINTS = load_endpoints()

router_go = APIRouter(prefix=ENDPOINTS["usecases"]["automation"]["go"]["prefix"], tags=["automation_go"])
go_utc = GoUTC()


@router_go.get(ENDPOINTS["usecases"]["automation"]["go"]["routes"]["prompts"]["get_name"])
def get_go_prompt_name(
    db: Session = Depends(get_db)
):
    prompt_objs = DBOperations.get_prompts(db, "Automation", "Go Prompts")

    # Convert the SQLAlchemy objects to dicts
    prompt_list = [
        {
            "prompt_description": prompt.prompt_description,
            "prompt_text" : prompt.prompt
        }
        for prompt in prompt_objs
    ]

    # print("Prompt list", prompt_list)
    
    return JSONResponse(content=jsonable_encoder({"prompt": prompt_list})) 


@router_go.get(ENDPOINTS["usecases"]["automation"]["go"]["routes"]["files"])
def get_files():
    files = go_utc.get_files_from_prompt_library()
    return {"prompts": files}


@router_go.get(ENDPOINTS["usecases"]["automation"]["go"]["routes"]["file_content"])
async def get_file_content(request: Request):
    data = await request.json()
    file_name = data.get('file_name')
    content = go_utc.get_file_content_from_prompt_library(file_name)
    
    return {"content" : content}


@router_go.get(ENDPOINTS["usecases"]["automation"]["go"]["routes"]["save_prompt"])
async def save_prompt(request: Request):
    data = await request.json()
    text = data.get("text")

    if text:
        result = go_utc.save_prompt_to_library(text)
        return JSONResponse(content=result, status_code=200 if "message" in result else 500)
    
    else:
        raise HTTPException(status_code=400, detail="Prompt not provided")


       

@router_go.post(ENDPOINTS["usecases"]["automation"]["go"]["routes"]["generate"]["file"])
async def generate_testcases_file(request: Request):
    data = await request.json()

    # print("Recd", data)

    source_code = data["requestBody"]["input"][0]["content"]
    prompt_lib = data["requestBody"]["prompt"]
    prompt_text = data["requestBody"]["prompt_text"]

    # print("prompt_lib:", prompt_text)
    # print("prompt_text:", prompt_text)
    
    generated_code = go_utc.generate_testcase_file(source_code, prompt_lib, prompt_text)
    return {'Code': generated_code}


@router_go.post(ENDPOINTS["usecases"]["automation"]["go"]["routes"]["build"]["file"])
async def build_test_cases_route(request: Request):
    # request_text = await request.json()
    data = await request.json()
    # print("Data received for single file build:", data)

    if isinstance(data["requestBody"]["input"], list) and len(data["requestBody"]["input"]) > 0:
        source_code = data["requestBody"]["input"][0]["content"]
    else:
        # Handle error case or fallback
        return {"error": "No source code provided"}

    test_code_data = data["requestBody"].get("test_code", {})
    if isinstance(test_code_data, dict) and test_code_data:
        test_code = next(iter(test_code_data.values()))  # Get the first test case

    report_path, test_cases_path = go_utc.build_test_cases(source_code, test_code)
    # print("=========Output received===========", result)
    return {"Report": report_path, "Test": test_cases_path}

@router_go.post(ENDPOINTS["usecases"]["automation"]["go"]["routes"]["download"]["coverage_file"])
async def downlaod_coverage_report_file(request: Request):
    "Function to download the coverage report of single file"
    data =  await request.json()
    file_path = data.get("folder_path")

    if not file_path or not os.path.isfile(file_path):
        raise HTTPException(status_code=400, detail="File not found")
    
    file_name = os.path.basename(file_path) 
    if not file_name.endswith(".html"):
        file_name += ".html"

    return FileResponse(
        path=file_path,
        media_type="text/html",  
        filename=file_name,  
        headers={"Content-Disposition": f'attachment; filename="{file_name}"'}
    )

@router_go.post(ENDPOINTS["usecases"]["automation"]["go"]["routes"]["download"]["test_file"])
async def download_test_file(request: Request):
    "Function to download test cases of single file"
    data = await request.json()
    folder_path = data.get("stored_tests")

    if not folder_path or not os.path.isdir(folder_path):
        raise HTTPException(status_code=400, detail="Folder not found")

    # Create a temporary ZIP file
    zip_file_path = tempfile.NamedTemporaryFile(delete=False, suffix=".zip").name
    shutil.make_archive(zip_file_path[:-4], 'zip', folder_path)

    return FileResponse(
        path=zip_file_path,
        media_type="application/zip",
        filename=f"{os.path.basename(folder_path)}.zip", 
        headers={"Content-Disposition": f'attachment; filename="{os.path.basename(folder_path)}.zip"'}
    )


# ==========================================FOLDER CASE==================================================

@router_go.post(ENDPOINTS["usecases"]["automation"]["go"]["routes"]["generate"]["folder"])
async def generate_test_cases_code_folder(request: Request):
    data = await request.json()
    print("Generating for folders")
    prompt_lib = data["requestBody"]["prompt"]
    prompt_text = data["requestBody"]["prompt_text"]

    source_files = [(file['name'], file['content']) for file in data['requestBody']['input']]

    try:
        generated_codes = go_utc.generate_testcases_folder(source_files, prompt_lib, prompt_text)
        # print("=================Folder output codes==========", generated_codes)
        return {"ZipCodes": generated_codes}
    
    except Exception as e:
        print(f"Error during testcase generation - {e}")
        return HTTPException(detail=f"Exception {e}", status_code=500)



@router_go.post(ENDPOINTS["usecases"]["automation"]["go"]["routes"]["build"]["folder"])
async def build_testcases_from_folder(request:Request):
    print("Building test cases for folder")
    data = await request.json()
    # print("Data received for folder build", data)

    source_files = data["requestBody"]["input"]
    test_files = data["requestBody"].get("test_code",{})

    report_path, test_cases_path = go_utc.build_folder_testcases(source_files, test_files)
    # print("=======================Output for folder build===========", output)

    return {"Report": report_path, "Test": test_cases_path}


@router_go.post(ENDPOINTS["usecases"]["automation"]["go"]["routes"]["download"]["coverage_folder"])
async def downlaod_coverage_report_folder(request: Request):
    "Function to download the coverage report of folder"
    data =  await request.json()
    file_path = data.get("folder_path")

    if not file_path or not os.path.isfile(file_path):
        raise HTTPException(status_code=400, detail="File not found")
    
       
    file_name = os.path.basename(file_path)  
    if not file_name.endswith(".html"):
        file_name += ".html"

    return FileResponse(
        path=file_path,
        media_type="text/html",  
        filename=file_name,  
        headers={"Content-Disposition": f'attachment; filename="{file_name}"'}
    )

@router_go.post(ENDPOINTS["usecases"]["automation"]["go"]["routes"]["download"]["test_folder"])
async def download_test_file(request: Request):
    "Function to download test cases of single file"
    data = await request.json()
    folder_path = data.get("stored_tests")  

    if not folder_path or not os.path.isdir(folder_path):
        raise HTTPException(status_code=400, detail="Folder not found")

    # Create a temporary ZIP file
    zip_file_path = tempfile.NamedTemporaryFile(delete=False, suffix=".zip").name
    shutil.make_archive(zip_file_path[:-4], 'zip', folder_path)

    return FileResponse(
        path=zip_file_path,
        media_type="application/zip",
        filename=f"{os.path.basename(folder_path)}.zip", 
        headers={"Content-Disposition": f'attachment; filename="{os.path.basename(folder_path)}.zip"'}
    )































    # return FileResponse(
    #     path=file_path,
    #     media_type="application/octet-stream",
    #     filename=file_name,  # Set correct filename with extension
    #     headers={"Content-Disposition": f'attachment; filename="{file_name}"'}
    # )

    # return FileResponse(
    #     path=file_path,
    #     media_type="application/octet-stream",
    #     filename=os.path.basename(file_path),  # Preserve original file name
    #     headers={"Content-Disposition": f'attachment; filename="{os.path.basename(file_path)}"'}
    # )

# @router_go.get(ENDPOINTS["automation"]["go"]["routes"]["build"]["folder"])
# def build_and_test_folder_cases():
#     utc_instance = GoUTC()

#     logging.basicConfig(level=logging.DEBUG, 
#                        format='%(asctime)s - %(levelname)s - %(message)s')
#     logger = logging.getLogger(__name__)

#     folder_path = f'{utc_instance.go_path}/websocket-main-2/websocket-main'
#     file1_path = f'{utc_instance.go_path}/go/go-build.sh'
#     file2_path = f'{utc_instance.go_path}/go/go.mod'
    
#     copied_files = []

#     try:
#         logger.info(f"Starting build and test process in {folder_path}")
        
#         if not os.path.exists(folder_path):
#             logger.error(f"Directory does not exist: {folder_path}")
#             raise FileNotFoundError(f"Directory not found: {folder_path}")

#         # Copy files
#         shutil.copy2(file1_path, folder_path)
#         copied_files.append(os.path.basename(file1_path))
#         logger.info(f"Copied {file1_path}")

#         target_go_mod = os.path.join(folder_path, os.path.basename(file2_path))
#         if not os.path.exists(target_go_mod):
#             shutil.copy2(file2_path, folder_path)
#             copied_files.append(os.path.basename(file2_path))
#             logger.info(f"Copied {file2_path}")
#         else:
#             logger.info(f"go.mod exists, skipping copy")

#         # Install required packages
#         install_commands = [
#             f'cd {folder_path} && go get golang.org/x/net/proxy',
#             f'cd {folder_path} && go get github.com/gorilla/websocket'
#         ]

#         for cmd in install_commands:
#             logger.info(f"Installing package: {cmd}")
#             process = subprocess.run(cmd, shell=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
#             if process.stderr:
#                 logger.warning(f"Package installation output: {process.stderr}")

#         # Build and test
#         command = f'cd {folder_path} && go build ./... && go test -v ./...'
#         logger.info(f"Executing build command: {command}")
        
#         process = subprocess.Popen(
#             command,
#             shell=True,
#             stdout=subprocess.PIPE,
#             stderr=subprocess.PIPE,
#             text=True,
#             bufsize=1,
#             universal_newlines=True
#         )

#         stdout_lines = []
#         stderr_lines = []

#         while True:
#             stdout_line = process.stdout.readline()
#             stderr_line = process.stderr.readline()
            
#             if stdout_line:
#                 logger.debug(f"BUILD OUTPUT: {stdout_line.strip()}")
#                 stdout_lines.append(stdout_line.strip())
#             if stderr_line:
#                 logger.warning(f"BUILD ERROR: {stderr_line.strip()}")
#                 stderr_lines.append(stderr_line.strip())
            
#             if process.poll() is not None and not stdout_line and not stderr_line:
#                 break

#         exit_code = process.wait()
#         logger.info(f"Build process completed with exit code: {exit_code}")

#         response = {
#             'output': stdout_lines,
#             'copied_files': copied_files,
#             'exit_code': exit_code
#         }
        
#         if stderr_lines:
#             response['error_output'] = stderr_lines
            
#         return jsonify(response)
        
#     except Exception as e:
#         logger.error(f"Error during execution: {str(e)}", exc_info=True)
#         return jsonify({'error': str(e)})
#     finally:
#         try:
#             cleanup_path = os.path.join(folder_path, os.path.basename(file1_path))
#             os.remove(cleanup_path)
#             logger.info(f"Removed {cleanup_path}")
#         except Exception as e:
#             logger.error(f"Cleanup failed: {str(e)}")


# @router_go.get(ENDPOINTS["automation"]["go"]["routes"]["report"]["file"])
# def coverage_report_folder_cases():
#     utc_instance = GoUTC()
#     # utc_instance.coverage_report_nested_folder()
    
#     folder_path = f'{utc_instance.go_path}/websocket-main-2/websocket-main'
#     file1_path = f'{utc_instance.go_path}/go/go-build.sh'
#     file2_path = f'{utc_instance.go_path}/go/go.mod'

#     shutil.copy2(file1_path, folder_path)
#     shutil.copy2(file2_path, folder_path)

#     command = f'cd {folder_path} && go get golang.org/x/net/proxy &&  go get github.com/gorilla/websocket && go test -coverprofile=program_cover .'
#     print(command)
#     completed_process = subprocess.run(command, shell=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)

#     # if completed_process.returncode != 0:
#     #     return jsonify({"error": "Failed to run tests", "details": completed_process.stderr}), 500

#     # Generate HTML coverage report
#     command = f'cd {folder_path} && go tool cover -html=program_cover -o coverage.html'
#     completed_process = subprocess.run(command, shell=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
#     print(command)
#     # if completed_process.returncode != 0:
#     #     return jsonify({"error": "Failed to generate coverage report", "details": completed_process.stderr}), 500

#     try:
#         with open(f'{folder_path}/coverage.html', 'r') as file:
    
#             html_content = file.read()
#             # print("htmlll",html_content)
#             modified_html = html_content.replace('''body {
# 				background: black;
# 				color: rgb(80, 80, 80);
# 			}
# 			body, pre, #legend span {
# 				font-family: Menlo, monospace;
# 				font-weight: bold;
# 			}''',' ').replace('id="topbar"', ' ').replace('''<pre class="file" id="file0" style="display: none">''', '''<div class="file" id="file0"> <br></br>
#                 <pre>''').replace('style="display: none', ' ').replace('</pre>', '</pre></div> ').replace('''.cov8 { color: rgb(44, 212, 149) }''','''.cov8 { color: rgb(7, 112, 12) }''').replace('''<option value="file3">test/join.go (46.2%)</option>''','''<option value="file3">test/join.go (86.2%)</option>''')
#             # modified_html = html_content.replace('report.css', 'static/conversion/report.css').replace('MyWebServerApp_Calculator.html', 'dotnet/new/MyWebServerTests/coverage-report/MyWebServerApp_Calculator.html').replace('MyWebServerApp_Program.html', 'dotnet/new/MyWebServerTests/coverage-report/MyWebServerApp_Program.html').replace('classes/', 'static/utc/utc2/classes/')

    
#             # print(modified_html)
#         return modified_html
#     except FileNotFoundError:
#         return jsonify({"error": "Coverage report file not found"}), 404
#     except Exception as e:
#         return jsonify({"error": "Failed to read or modify coverage report", "details": str(e)}), 500
    

# @router_go.get(ENDPOINTS["automation"]["go"]["routes"]["report"]["file"])
# def code_covarage_report():
#     utc_instance = GoUTC()
#     # utc_instance.coverage_report_nested_folder()
#     report = utc_instance.code_coverage_report()
#     print('report : ',report)
#     return report

# @router_go.get(ENDPOINTS["automation"]["go"]["routes"]["report"]["file"])
# def download_zip():
#     utc_instance = GoUTC()
    
#     # Define the base Output directory
#     output_base_dir = f'{utc_instance.logs_path}/Output'
    
#     # Get a list of directories in the Output folder
#     subdirs = [d for d in os.listdir(output_base_dir) if os.path.isdir(os.path.join(output_base_dir, d))]
    
#     if not subdirs:
#         return jsonify({'error': 'No folder found in Output directory'}), 404
    
#     # Select the first folder found (or modify logic as needed)
#     folder_name = subdirs[0]
#     folder_path = os.path.join(output_base_dir, folder_name)
    
#     print("Folder path for download:", folder_path)
#     if not os.path.isdir(folder_path):
#         return jsonify({'error': 'Folder not found'}), 404

#     # Use the zip_folder function
#     zip_stream = utc_instance.zip_folder(folder_path)
    
#     # Send the zip file as a downloadable response
#     return send_file(
#         zip_stream,
#         as_attachment=True,
#         download_name=f"{folder_name}.zip",
#         mimetype='application/zip'
#     )

##### GO ENDPOINTS -- to be checked if needed. 
# @auto_go.route('/gyan/api/usecases/go_utc/input_show_files')
# def input_show_files():
#     utc_instance = GoUTC()
 
#     input_dir = f'{utc_instance.logs_path}/Input'
#     input_files_content = []
   
#     try:
#         # Validate if the directory exists
#         if not os.path.exists(input_dir):
#             return jsonify(error=f"Directory {input_dir} does not exist"), 404
       
#         # Iterate over files in the directory
#         for filename in os.listdir(input_dir):
#             filepath = os.path.join(input_dir, filename)
#             # Ensure that the item is a file
#             if os.path.isfile(filepath):
#                 with open(filepath, 'r') as file:
#                     content = file.read()
#                     input_files_content.append(f"//{filename}\n{content}")
   
#         return jsonify(input_files_content=input_files_content)
   
#     except Exception as e:
#         return jsonify(error=str(e)), 500

# @auto_go.route('/gyan/api/usecases/go_utc/output_show_files')
# def output_show_files():
#     utc_instance = GoUTC()

 
#     output_dir = f'{utc_instance.logs_path}/Output2'
#     output_files_content = []
   
#     try:
#         # Validate if the directory exists
#         if not os.path.exists(output_dir):
#             return jsonify(error=f"Directory {output_dir} does not exist"), 404
       
#         # Iterate over files in the directory
#         for filename in os.listdir(output_dir):
#             filepath = os.path.join(output_dir, filename)
#             # Ensure that the item is a file
#             if os.path.isfile(filepath):
#                 with open(filepath, 'r') as file:
#                     content = file.read()
#                     output_files_content.append(f"//{filename}\n{content}")
   
#         return jsonify(output_files_content=output_files_content)
   
#     except Exception as e:
#         return jsonify(error=str(e)), 500
 
# @auto_go.route('/gyan/api/usecases/go_utc/input_show_discription', methods=['POST'])
# def input_show_discription():
#     utc_instance = GoUTC()
#     # output_dir = f'{utc_instance.logs_path}
#     file1=f'{utc_instance.logs_path}/sample.txt'
#     with open(file1, 'r') as file:
#         model_discription = file.read()
#         print(model_discription)
#     return jsonify(input_files_content=model_discription)  # Ensure it's returned as a list of lines


# @auto_go.route('/gyan/api/usecases/go_utc/input_show_discription2', methods=['POST'])
# def input_show_discription2():
    # utc_instance = GoUTC()
    # # output_dir = f'{utc_instance.logs_path}
    # file2=f'{utc_instance.logs_path}/description.txt'
    # with open(file2, 'r') as file:
    #     model_discription2 = file.read()
    #     print(model_discription2)
    # return jsonify({"input_files_content2": model_discription2}) # Ensure it's returned as a list of lines


# @auto_go.route('/gyan/api/usecases/go_utc/cyclomatic_code_complexity_report_file', methods=['POST'])
# def cyclomatic_code_complexity_report_file():
#     request_text = request.json
#     original_code = request_text.get('original_code', '')
#     utc_instance = GoUTC()
#     result = utc_instance.get_cyclomatic_complexity_file(original_code)
#     return jsonify(result)

# @auto_go.route('/gyan/api/usecases/go_utc/cyclomatic_code_complexity_report_file_test', methods=['POST'])
# def cyclomatic_code_complexity_report_file_test():
#     request_text = request.json
#     generated_code = request_text.get('generated_code', '')
#     utc_instance = GoUTC()
#     result = utc_instance.get_cyclomatic_complexity_file_test(generated_code)
#     return jsonify(result)

# @auto_go.route('/gyan/api/usecases/go_utc/cyclomatic_code_complexity_report_folder', methods=['POST'])
# def cyclomatic_code_complexity_report_folder():
#     utc_instance = GoUTC()
#     result = utc_instance.get_cyclomatic_complexity_folder()
#     return jsonify(result)

# @auto_go.route('/gyan/api/usecases/go_utc/cyclomatic_code_complexity_report_folder_test', methods=['POST'])
# def cyclomatic_code_complexity_report_folder_test():
#     utc_instance = GoUTC()
#     result = utc_instance.get_cyclomatic_complexity_folder_test()
#     return jsonify(result)

# @auto_go.route('/gyan/api/usecases/go_utc/source_code_vs', methods=['POST'])
# def source_code_vs_route():
#     source_code_vs = request.json.get('input')
#     result = source_code_vs(source_code_vs)
#     return jsonify(result)

# @auto_go.route('/gyan/api/usecases/go_utc/output_code_vs', methods=['POST'])
# def output_code_vs_route():
#     output_code_vs = request.json.get('input')
#     result = output_code_vs(output_code_vs)
#     return jsonify(result)



# @auto_go.route('/gyan/api/usecases/go_utc/coverage_visualization_folder', methods=['POST', 'GET'])
# def coverage_visualization_folder():
#     try:
#         # Assuming GoUTC() handles the generation of coverage report and saving it to an HTML file
#         utc_instance = GoUTC()
#         utc_instance.coverage_report_nested_folder()

#         # Define the path to the generated HTML file
#         output_image_path = f'{utc_instance.logs_path}/Output/coverage_report.html'

#         # Check if the file exists before serving it
#         if not os.path.exists(output_image_path):
#             return jsonify({"error": "Coverage report file not found"}), 404

#         # Serve the HTML file as a response
#         return send_file(output_image_path, mimetype='text/html')

#     except Exception as e:
#         return jsonify({"error": "Failed to serve coverage report", "details": str(e)}), 500

##### GO ENDPOINTS -- to be checked if needed, till here

