from transformers import AutoTokenizer
from optimum.onnxruntime import ORTModelForSeq2SeqLM, ORTModelForCausalLM
import os
import torch

class Inference:
    def __init__(self, model_path, model_name):
        self.tokenizer = AutoTokenizer.from_pretrained(model_path)

        if model_name == "ID_GYAN_T5":
            self.model = ORTModelForSeq2SeqLM.from_pretrained(model_path, use_cache=False, use_io_binding=True, type=torch.float)
        else:
            self.model = ORTModelForCausalLM.from_pretrained(model_path, use_cache=False, use_io_binding=False, type=torch.float, provider="CUDAExecutionProvider")

        print("Model Loaded!!")

        
    def infer(self, input):
        inputs = self.tokenizer(input, return_tensors="pt")

        print("Tokenized input: ", inputs)

        output_tokens = self.model.generate(**inputs, max_new_tokens=128)

        print("Generated output_tokens: ", output_tokens)

        response = self.tokenizer.decode(output_tokens[0], skip_special_tokens=True)
        return response

if __name__ == "__main__":
    base_dir = "onnx_model"
    model_path = ""
    for root, dirs, files in os.walk(base_dir):
        for dir_name in dirs:
            # Construct the full directory path
            dir_path = os.path.join(root, dir_name)
            
            # Split the path into components
            path_components = dir_path.split(os.sep)
            
            # Check if the path has the required number of components
            if len(path_components) == 3:
                model_name = path_components[1]
                precision = path_components[2]

                model_path = os.path.join(base_dir, model_name, precision)

    infer_instance = Inference(model_path, model_name)
    while True:
        input_text = input("User Input: ")
        response = infer_instance.infer(input_text)
        print("Response: ", response)