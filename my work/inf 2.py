from PIL import Image 
import requests 
from transformers import AutoModelForCausalLM 
from transformers import AutoProcessor 
import torch

# model_id = "microsoft/Phi-3-vision-128k-instruct" 
model_id = "microsoft/Phi-3.5-vision-instruct"


model = AutoModelForCausalLM.from_pretrained(model_id, device_map="cuda", trust_remote_code=True, torch_dtype=torch.float16, _attn_implementation='flash_attention_2') # use _attn_implementation='eager' to disable flash attention

processor = AutoProcessor.from_pretrained(model_id, trust_remote_code=True) 

# messages = [ 
#     {"role": "user", "content": "<|image_1|>\nWhat is shown in this image?"}, 
#     {"role": "assistant", "content": "The chart displays the percentage of respondents who agree with various statements about their preparedness for meetings. It shows five categories: 'Having clear and pre-defined goals for meetings', 'Knowing where to find the information I need for a meeting', 'Understanding my exact role and responsibilities when I'm invited', 'Having tools to manage admin tasks like note-taking or summarization', and 'Having more focus time to sufficiently prepare for meetings'. Each category has an associated bar indicating the level of agreement, measured on a scale from 0% to 100%."}, 
#     {"role": "user", "content": "Provide insightful questions to spark discussion."} 
# ] 

json = """
{
  "scene_id": "[A descriptive identifier for the overall scene, based on visible features and conditions]",
  "features": {
    "on_road_objects": {
      "vehicle_count": [Number of vehicles detected, if any],
      "pedestrian_count": [Number of pedestrians detected, if any],
      "traffic_light": {
        "count": [Number of traffic lights detected, if any],
        "status": "[Status of the traffic lights, e.g., 'green', 'red', 'yellow']"
      },
      "tree_count": [Number of trees detected, if any],
      "building_count": [Number of buildings detected, if any],
      "sign_count": [Number of road signs detected, if any],
      "other_objects": [
        {
          "type": "[Type of object detected, e.g., 'bicycle', 'motorcycle']",
          "count": [Number of such objects detected]
        }
      ]
    },
    "road_conditions": {
      "road_type": "[Type of road, e.g., 'highway', 'city', 'rural']",
      "road_surface": "[Surface condition, e.g., 'dry', 'wet', 'snowy', 'icy']",
      "surface_type": "[Type of surface, e.g., 'asphalt', 'concrete', 'dirt']",
      "traffic_density": "[Traffic density, e.g., 'light', 'moderate', 'heavy']"
    },
    "environmental_conditions": {
      "time_of_day": "[Time of day, e.g., 'day', 'night', 'dusk', 'dawn']",
      "weather": "[Weather condition, e.g., 'sunny', 'rainy', 'snowy', 'foggy']",
      "visibility": "[Visibility level, e.g., 'clear', 'hazy', 'foggy', 'low']",
      "light_sources": [
        {
          "type": "[Type of light source, e.g., 'ambient', 'streetlight', 'headlight']",
          "position": "[Position of the light source, e.g., 'overhead', 'side', 'front']",
          "brightness": "[Brightness level, e.g., 'high', 'medium', 'low']"
        }
      ]
    },
    "dynamic_features": {
      "[Any dynamic feature relevant to the scene, e.g., 'rain_intensity', 'snow_coverage', 'puddle_presence']": "[Value of the dynamic feature, e.g., 'heavy', 'light', 'present']",
      "contrast": "[Contrast level, e.g., 'high', 'medium', 'low']",
      "brightness": "[Brightness level of the image, e.g., 'high', 'medium', 'low']",
      "luminescence": "[Luminescence level, e.g., 'high', 'low']",
      "reflections": "[Reflection intensity, e.g., 'strong', 'weak']",
      "model_confidence": {
        "[Feature_detection_type]": [Confidence level in detecting the feature, e.g., 0.92]
      },
      "failure_points": [
        {
          "feature": "[Feature causing potential issues, e.g., 'low visibility']",
          "impact": "[Impact of the issue, e.g., 'partial occlusion']",
          "description": "[Description of how the issue affects the scene, e.g., 'Fog reduced visibility and affected object detection accuracy.']"
        }
      ]
    }
  },
  "scene_description": {
    "environment": {
      "weather": {
        "condition": "[Weather condition, e.g., 'rainy', 'clear']",
        "intensity": "[Intensity of the weather, e.g., 'light', 'heavy']"
      },
      "time_of_day": "[Time of day, e.g., 'day', 'night']",
      "visibility": "[Visibility level, e.g., 'clear', 'hazy']"
    },
    "viewpoint": {
      "from_inside_car": [Boolean indicating if the viewpoint is from inside a vehicle],
      "elements": [
        "[List elements visible from the viewpoint, e.g., 'raindrops on windshield', 'dashboard instruments']"
      ]
    },
    "road_conditions": {
      "surface": "[Condition of the road surface, e.g., 'wet', 'dry']",
      "road_type": "[Type of road, e.g., 'city', 'highway']",
      "lighting": {
        "presence": "[Boolean indicating if artificial lighting is present]",
        "sources": [
          {
            "type": "[Type of lighting source, e.g., 'streetlight', 'ambient']",
            "description": "[Description of the lighting source, e.g., 'overcast daylight', 'bright streetlights']"
          }
        ]
      }
    },
    "traffic": {
      "vehicle_count": "[Count or description of vehicles, e.g., 'multiple', 'few']",
      "pedestrian_count": "[Count or description of pedestrians, e.g., 'none', 'several']",
      "density": "[Traffic density, e.g., 'light', 'moderate']"
    },
    "key_elements": [
      "[List key elements visible in the scene, e.g., 'wet road', 'streetlights', 'traffic signs', 'vehicles', 'pedestrians']"
    ]
  }
}
"""
messages = [ 
    # {"role": "user", "content": "<|image_1|>\nWhat is shown in this image?"}, 
    # {"role": "assistant", "content": "The chart displays the percentage of respondents who agree with various statements about their preparedness for meetings. It shows five categories: 'Having clear and pre-defined goals for meetings', 'Knowing where to find the information I need for a meeting', 'Understanding my exact role and responsibilities when I'm invited', 'Having tools to manage admin tasks like note-taking or summarization', and 'Having more focus time to sufficiently prepare for meetings'. Each category has an associated bar indicating the level of agreement, measured on a scale from 0% to 100%."}, 
    {"role": "user", "content": f"<|image_1|> Analyze the input image and generate output in JSON format that captures all realtime features of image. For example it should be contain on_road_objects including name of object and thier counts. It should be contain road_conditions including road type, road_surface, surface_type and traffic_density. It should be contain environmental_conditions including time_of_day, weather, visibility, all light_sources which impacting image features/visibility with respected name, brightness of light_sources and type of light_sources. It should be contain image related dynamic features including average contrast, average brightness, average luminescence and reflections etc. It should be contain scene related dynamic features e.g. rain_intensity, rain_density, snow_coverage, puddle_presence etc. Finally needs to give detailed scene_description. Please include all visible and analysed scene and image related features."} 
] 

url = "image.png" 
image = Image.open(url) 

prompt = processor.tokenizer.apply_chat_template(messages, tokenize=False, add_generation_prompt=True)

inputs = processor(prompt, [image], return_tensors="pt").to("cuda:0") 

generation_args = { 
    "max_new_tokens": 4000, 
    "temperature": 0.0, 
    "do_sample": False, 
} 

generate_ids = model.generate(**inputs, eos_token_id=processor.tokenizer.eos_token_id, **generation_args) 

# remove input tokens 
generate_ids = generate_ids[:, inputs['input_ids'].shape[1]:]
response = processor.batch_decode(generate_ids, skip_special_tokens=True, clean_up_tokenization_spaces=False)[0] 

print(response) 