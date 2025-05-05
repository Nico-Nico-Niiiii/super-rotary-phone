import os
import re
import shutil

class Automation_Utils:

    def save_file(self, folder_path, filename, content):
        try:
            os.makedirs(folder_path, exist_ok=True)
            file_path = os.path.join(folder_path, filename)

            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content.replace('\r\n', '\n'))

        except Exception as e:
            print(f"Error saving file {filename}: {e}")


    def delete_folder(self, folder_path):
        if os.path.exists(folder_path) and os.path.isdir(folder_path):
            shutil.rmtree(folder_path)

        
