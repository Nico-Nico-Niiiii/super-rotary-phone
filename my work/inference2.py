import os
import numpy as np
import cv2
import tensorflow as tf
from tensorflow.keras.preprocessing.image import img_to_array
from tensorflow.keras.applications.resnet50 import preprocess_input

# Load the trained model
model_path = '/home/pavan/Toyota/model_checkpoint_epoch_05_val_loss_0.0960.h5'
model = tf.keras.models.load_model(model_path)

# Define the target size used during training
target_size = (640, 360)

# Open a video capture object
video_path = '/home/pavan/Toyota/denso/tts_1.mp4'
cap = cv2.VideoCapture(video_path)

if not cap.isOpened():
    print("Error opening video file")
    exit()

# Create folders for each class
output_folder = '/home/pavan/Toyota/predicted_frames/'
class_labels = ['Clear', 'Rain']  # have 2 classes

for label in class_labels:
    class_folder = os.path.join(output_folder, label)
    os.makedirs(class_folder, exist_ok=True)

frame_count = 0

while True:
    # Read a frame from the video
    ret, frame = cap.read()

    if not ret:
        print("End of video")
        break

    # Resize the frame to the target size
    frame = cv2.resize(frame, target_size)

    # Preprocess the frame for the model
    img_array = img_to_array(frame)
    img_array = np.expand_dims(img_array, axis=0)
    img_array = preprocess_input(img_array)

    # Make a prediction
    predictions = model.predict(img_array)

    # Get the predicted class label
    predicted_class = np.argmax(predictions)

    # Save the frame to the corresponding class folder
    class_label = 'Rain' if predicted_class == 1 else 'Clear'
    class_folder = os.path.join(output_folder, class_label)

    frame_filename = f'frame_{frame_count}.jpg'  # You may want to use a timestamp or frame count
    frame_path = os.path.join(class_folder, frame_filename)

    cv2.imwrite(frame_path, frame)

    frame_count += 1

# Release the video capture object and close all windows
cap.release()
cv2.destroyAllWindows()
