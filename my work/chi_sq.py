import numpy as np
import matplotlib.pyplot as plt
from scipy.stats import chi2_contingency

# Constants
NUM_IMAGES = 100
NUM_BINS = 10  # Number of bins to divide the luminance values
LUMINANCE_RANGE = (0, 100)  # Luminance values range from 0 to 100

# Generate random luminance values
luminance_values = np.random.uniform(LUMINANCE_RANGE[0], LUMINANCE_RANGE[1], NUM_IMAGES)

# Generate random classification results (1 for correct, 0 for incorrect)
ground_truth = np.random.randint(0, 2, NUM_IMAGES)
predictions = np.random.randint(0, 2, NUM_IMAGES)

# Determine correct and incorrect classifications
correct = predictions == ground_truth
incorrect = predictions != ground_truth

# Create bins
bins = np.linspace(LUMINANCE_RANGE[0], LUMINANCE_RANGE[1], NUM_BINS + 1)
bin_indices = np.digitize(luminance_values, bins) - 1

# Initialize lists for storing results
chi_square_stats = []
p_values = []
misclassification_rates = []
correct_counts = []
incorrect_counts = []

# Compute chi-square for each bin
for i in range(NUM_BINS):
    correct_count = np.sum((bin_indices == i) & correct)
    incorrect_count = np.sum((bin_indices == i) & incorrect)
    
    total_count = correct_count + incorrect_count
    if total_count > 0:
        observed = np.array([correct_count, incorrect_count])
        expected = np.array([np.mean(observed)] * 2)  # Assume equal expected frequency for correct and incorrect
        
        # Calculate Chi-Square and p-value
        chi2_stat, p_val, _, _ = chi2_contingency([observed, expected], correction=False)
        misclassification_rate = incorrect_count / total_count
    else:
        chi2_stat = 0
        p_val = 1  # No data in this bin
        misclassification_rate = 0  # No misclassification rate can be calculated
    
    chi_square_stats.append(chi2_stat)
    p_values.append(p_val)
    misclassification_rates.append(misclassification_rate)
    correct_counts.append(correct_count)
    incorrect_counts.append(incorrect_count)

# Plot the results
plt.figure(figsize=(12, 8))
plt.bar(bins[:-1], chi_square_stats, width=(bins[1] - bins[0]), align='edge', color='skyblue', label='Chi-Square')
plt.xlabel('Luminance Bins')
plt.ylabel('Chi-Square Statistic')
plt.title('Chi-Square Statistics and Misclassification Rates for Each Luminance Bin')
plt.grid(True)

# Annotate Chi-Square, p-values, and misclassification rates
for i in range(NUM_BINS):
    plt.text(bins[i], chi_square_stats[i] + 0.1, 
             f'χ²={chi_square_stats[i]:.2f}\np={p_values[i]:.2f}\nMR={misclassification_rates[i]:.2f}', 
             ha='center')

# Plot the correct and incorrect counts
for i in range(NUM_IMAGES):
    color = 'green' if correct[i] else 'red'
    plt.plot(luminance_values[i], 0, 'o', color=color)

# Highlight bins with high Chi-Square values
high_chi_square_threshold = 1 # Typically for p < 0.05 in a 1 degree of freedom test
for i, chi2_stat in enumerate(chi_square_stats):
    if chi2_stat > high_chi_square_threshold:
        plt.axvspan(bins[i], bins[i+1], color='red', alpha=0.3)

plt.legend(['Correct Classification', 'Incorrect Classification', 'High Chi-Square (> 1)'])
plt.show()
