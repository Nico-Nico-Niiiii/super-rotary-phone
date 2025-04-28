import numpy as np
import cv2
import tensorflow as tf
from tensorflow.keras.preprocessing.image import img_to_array
from tensorflow.keras.applications.resnet50 import preprocess_input


# Load the trained model
model_path = r'D:\toyota\model_from_scratch\model_tts_bmf\model_ckp_bl_05_val_loss_0.3513.h5'
model = tf.keras.models.load_model(model_path)

# Define the target size used during training
target_size = (640, 360)


# Open a video capture object
video_path = r'D:\toyota\tts_videos\tts_3.mp4'
cap = cv2.VideoCapture(video_path)

if not cap.isOpened():
    print("Error opening video file")
    exit()
# i = 0

frame_cnt = 0
frame_skip = 5

while True:
    # Read a frame from the video
    # i = i+1
    ret, frame = cap.read()
    # if i < 1000:
    #     continue
    frame_cnt += 1

    if not ret:
        print("End of video")
        break

    if frame_cnt % frame_skip != 0:
        continue

    # Resize the frame to the target size
    frame = cv2.resize(frame, target_size)
    # grayscale_image = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    # rgb_image = cv2.cvtColor(grayscale_image, cv2.COLOR_GRAY2RGB)

    # Preprocess the frame for the model
    img_array = img_to_array(frame)
    img_array = np.expand_dims(img_array, axis=0)
    img_array = preprocess_input(img_array)

    # Make a prediction
    predictions = model.predict(img_array)

    # Get the predicted class label
    # #predicted_class = np.argmax(predictions)
    predicted_class = np.argmax(predictions, axis=1)
    probabilities = predictions[0]

    # Display the predicted class on the frame
    class_label = 'Rain' if predicted_class == 1 else 'Clear'
    # #cv2.putText(frame, f'Class: {class_label}, Probability: {predictions}', (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)

    text = f'Class: {class_label}, \nClear:{probabilities[0]:.2f}, \nRain:{probabilities[1]}'
    cv2.putText(frame, text, (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
    # Display the frame
    cv2.imshow('Video', frame)

    # Break the loop if 'q' key is pressed
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

# Release the video capture object and close all windows
cap.release()
cv2.destroyAllWindows()






# #2 inference with passing image
# import numpy as np
# import cv2
# import tensorflow as tf
# from tensorflow.keras.preprocessing.image import img_to_array
# from tensorflow.keras.applications.resnet50 import preprocess_input
#
#
# # Load the trained model
# model_path = r'D:\toyota\model_ckp_epoch_05_val_loss_0.0353.h5'
# model = tf.keras.models.load_model(model_path)
#
# # Define the target size used during training
# target_size = (640, 360)
#
# image = cv2.imread(r'D:\toyota\5223_traindataset\clear\image_8.jpg')
#
# # Decrease brightness and contrast
# adjusted_image = cv2.convertScaleAbs(image, alpha=0.5, beta=50)
#
# # Apply Gaussian blur
# blurred_image = cv2.GaussianBlur(adjusted_image, (5, 5), 0)
#
# # Add Gaussian noise
# noise = np.zeros_like(image, np.uint8)
# cv2.randn(noise, 0, 20)  # Adjust the standard deviation as needed
# noisy_image = cv2.add(adjusted_image, noise)
#
#
# # Resize the frame to the target size
# frame = cv2.resize(noisy_image, target_size)
#
# # Preprocess the frame for the model
# img_array = img_to_array(frame)
# img_array = np.expand_dims(img_array, axis=0)
# img_array = preprocess_input(img_array)
#
# # Make a prediction
# predictions = model.predict(img_array)
#
# # Get the predicted class label
# # #predicted_class = np.argmax(predictions)
# predicted_class = np.argmax(predictions, axis=1)
# probabilities = predictions[0]
#
# # Display the predicted class on the frame
# class_label = 'Rain' if predicted_class == 1 else 'Clear'
# # #cv2.putText(frame, f'Class: {class_label}, Probability: {predictions}', (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
#
# text = f'Class: {class_label}, \nClear:{probabilities[0]:.2f}, \nRain:{probabilities[1]}'
# cv2.putText(frame, text, (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
# # Display the frame
# cv2.imshow('blurred image', frame)
# cv2.waitKey(0)
# cv2.destroyAllWindows()
