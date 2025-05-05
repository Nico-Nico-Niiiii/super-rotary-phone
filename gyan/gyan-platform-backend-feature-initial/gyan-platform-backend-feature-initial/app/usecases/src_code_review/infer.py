from transformers import AutoTokenizer, AutoModelForCausalLM
from transformers import pipeline
import json
import torch

class SrcCode_Review:
    def __init__(self):
        self.model_id = "meta-llama/Meta-Llama-3-8B-Instruct"

        self.generation_kwargs = {
            "max_new_tokens" : 1024,
            "do_sample" : True,
            "temperature" : 0.1,
            "top_k" : 40,
            "top_p" : 0.8,
            "repetition_penalty" : 1.3
        }

    def load_model_pipeline(self):
        torch.cuda.empty_cache()
        tokenizer = AutoTokenizer.from_pretrained(
            self.model_id,
            trust_remote_code = True,
            token='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'
        )

        model = AutoModelForCausalLM.from_pretrained(
            self.model_id,
            torch_dtype = "auto",
            device_map = {"":0},
            trust_remote_code = True,
            token='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'
        )

        self.tiny_pipeline = pipeline(
            "text-generation",
            model=model,
            tokenizer=tokenizer
        )


    def infer(self, text, language):
        # Load peft config for pre-trained checkpoint etc.
        #instruction = f"""### Instruction
        #You are a source code reviewer for """ +language+ f"""programming langugages, your job is to give the feedback comments pointwise on provided source code.

        ### Text
        #Provide your feedback in a numbered list for each category in a tabular format. 
        #At the end of your answer, summarize the recommended changes with respect to coding standard, naming convension, programing logic, optimization, following oops concepts & code comments to improve the quality of the code provided in a tabular format.
            
        #{text}
        ### Response
        #"""

        self.load_model_pipeline()

        instruction = f"""### Instruction
        You are an powerfull source code reviewer for {language} programming langugages, your job is to give the line by line code review comments with line number with corrected source code source code.

        ### Text
        {text}

        ### Response
        """
        output = self.tiny_pipeline(instruction, return_full_text=False, **self.generation_kwargs)
        return_text = output[0]['generated_text']

        self.tiny_pipeline = None
        torch.cuda.empty_cache()

        # return_text = return_text.replace('\n', '<br>')
        return return_text
    
