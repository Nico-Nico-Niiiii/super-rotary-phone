from optimum.intel import OVModelForCausalLM, OVModelForSeq2SeqLM
from transformers import AutoTokenizer

import os

class Inference:
    def __init__(self, model_path, model_name):
        self.tokenizer = AutoTokenizer.from_pretrained(model_path)

        if model_name == "ID_GYAN_T5":
            self.model = OVModelForSeq2SeqLM.from_pretrained(model_path)
        else:
            self.model = OVModelForCausalLM.from_pretrained(model_path)

        print("Model Loaded!!")

        
    def infer(self, input):
        tokens = self.tokenizer(input, max_length=128, return_tensors="pt", truncation=True)

        results = self.model.generate(**tokens, max_new_tokens=128)
        decoded_text = self.tokenizer.decode(results[0], skip_special_tokens=True)

        return decoded_text


if __name__ == "__main__":
    base_dir = "openvino_model"
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