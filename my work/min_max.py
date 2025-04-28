import numpy as np
import matplotlib.pyplot as plt

# Constants
NUM_IMAGES = 100
LUMINANCE_RANGE = (0, 100)  # Luminance values range from 0 to 100
ACCURACY_RATE = 0.6  # Desired accuracy rate

# Generate random luminance values
luminance_values = np.random.uniform(LUMINANCE_RANGE[0], LUMINANCE_RANGE[1], NUM_IMAGES)

# Generate random ground truth and predictions based on accuracy rate
ground_truth = np.random.randint(0, 2, NUM_IMAGES)
correct_indices = np.random.choice(NUM_IMAGES, int(ACCURACY_RATE * NUM_IMAGES), replace=False)
predictions = np.copy(ground_truth)
predictions[np.setdiff1d(np.arange(NUM_IMAGES), correct_indices)] ^= 1  # Flip prediction for misclassification

# Identify misclassifications
misclassified = predictions != ground_truth

# Extract misclassified luminance values
misclassified_luminance = luminance_values[misclassified]
classified_luminance = luminance_values[~misclassified]

# Identify the weak point range
if len(misclassified_luminance) > 0:
    min_weak_point = np.min(misclassified_luminance)
    max_weak_point = np.max(misclassified_luminance)
    print(f"Weak Point Range: {min_weak_point:.2f} - {max_weak_point:.2f}")
    
    # Calculate the misclassification rate within the weak point range
    within_range = (luminance_values >= min_weak_point) & (luminance_values <= max_weak_point)
    num_in_range = np.sum(within_range)
    num_misclassified_in_range = np.sum(misclassified & within_range)
    
    misclassification_rate = num_misclassified_in_range / num_in_range
    print(f"Misclassification Rate in Weak Point Range: {misclassification_rate:.2f}")
else:
    print("No misclassifications found.")
    misclassification_rate = 0
misclassification_rate *= 100
# Plot the luminance values and highlight the weak point range
plt.figure(figsize=(12, 6))
plt.scatter(classified_luminance, predictions[~misclassified], color='green', label='Correctly Classified', s=100)
plt.scatter(misclassified_luminance, predictions[misclassified], color='red', label='Misclassified', s=100)

# Highlight the weak point range
if len(misclassified_luminance) > 0:
    plt.axvspan(min_weak_point, max_weak_point, color='yellow', alpha=0.3, label='Weak Point Range')
    plt.text((min_weak_point + max_weak_point) / 2, 0.5, f'Misclassification Rate: {misclassification_rate:.2f}',
             horizontalalignment='left',verticalalignment='bottom', color='black', fontsize=12, bbox=dict(facecolor='yellow', alpha=0.5))

plt.xlabel('Luminance')
plt.ylabel('Classification')
plt.title('Weak Point Range in Luminance with Misclassification Rate')
plt.xticks(np.arange(LUMINANCE_RANGE[0], LUMINANCE_RANGE[1] + 1, 10))
plt.yticks([0, 1], ['Not Detected', 'Detected'])
plt.legend()
plt.grid(True)
plt.show()
