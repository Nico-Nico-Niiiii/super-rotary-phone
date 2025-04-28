import numpy as np
import matplotlib.pyplot as plt

# Constants
NUM_IMAGES = 100
LUMINANCE_RANGE = (0, 100)  # Luminance values range from 0 to 1
WINDOW_SIZE = 10  # Size of the sliding window
STEP_SIZE = 5  # Step size for the sliding window
 
# Generate random luminance values
luminance_values = np.random.uniform(LUMINANCE_RANGE[0], LUMINANCE_RANGE[1], NUM_IMAGES)

# Generate random classification results (1 for rain detected, 0 for not detected)
ground_truth = np.random.randint(0, 2, NUM_IMAGES)
predictions = np.random.randint(0, 2, NUM_IMAGES)

# Determine correct and incorrect classifications
correct = predictions == ground_truth
incorrect = predictions != ground_truth

# Sliding window analysis
window_start = LUMINANCE_RANGE[0]
window_end = window_start + WINDOW_SIZE
misclassification_rates = []
window_centers = []
ranges = []
correct_counts = []
incorrect_counts = []

while window_end <= LUMINANCE_RANGE[1]:
    in_window = (luminance_values >= window_start) & (luminance_values < window_end)
    correct_count = np.sum(in_window & correct)
    incorrect_count = np.sum(in_window & incorrect)
    total_count = correct_count + incorrect_count
    
    if total_count > 0:
        misclassification_rate = incorrect_count / total_count
    else:
        misclassification_rate = 0  # Handle cases where no samples fall in the window
    
    misclassification_rates.append(misclassification_rate)
    window_centers.append((window_start + window_end) / 2)
    ranges.append((window_start, window_end))
    correct_counts.append(correct_count)
    incorrect_counts.append(incorrect_count)
    
    window_start += STEP_SIZE
    window_end += STEP_SIZE

# Print ranges and associated counts
print(f"{'Range':<20} {'Correct':<10} {'Incorrect':<10} {'Misclassification Rate':<10}")
for i in range(len(ranges)):
    print(f"{ranges[i][0]:.2f} - {ranges[i][1]:.2f}    {correct_counts[i]:<10} {incorrect_counts[i]:<10} {misclassification_rates[i]:.2f}")

# Plotting the sliding window misclassification rates
plt.figure(figsize=(12, 6))
plt.plot(window_centers, misclassification_rates, marker='o', linestyle='-', color='b', label='Misclassification Rate')
plt.xlabel('Luminance')
plt.ylabel('Misclassification Rate')
plt.title('Sliding Window Analysis of Misclassification Rates')
plt.grid(True)
plt.xlim(LUMINANCE_RANGE)
plt.ylim(0, 1)

# Highlighting regions with high misclassification rates
high_misclassification_threshold = 0.5  # Define a threshold for high misclassification rate
high_misclassification_regions = np.array(misclassification_rates) > high_misclassification_threshold

for i, is_high in enumerate(high_misclassification_regions):
    if is_high:
        plt.axvspan(window_centers[i] - (WINDOW_SIZE / 2), window_centers[i] + (WINDOW_SIZE / 2), color='red', alpha=0.3)

# Add data points to the plot with larger size
plt.scatter(luminance_values[correct], np.zeros_like(luminance_values[correct]), color='green', label='Correctly Classified', marker='o', s=200)
plt.scatter(luminance_values[incorrect], np.zeros_like(luminance_values[incorrect]), color='red', label='Misclassified', marker='x', s=200)

# Add legend
plt.legend(loc='upper right')

plt.show()
