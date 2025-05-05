import json
import os
class Config():
    def __init__(self):
        pass

    def load(self, config_path):
        if os.path.exists(config_path):
            data = json.load(open(config_path, 'r'))
            return data
        else:
            raise FileNotFoundError(config_path + " - File does not exist")

