import numpy as np
import matplotlib.pyplot as plt
from sklearn.mixture import BayesianGaussianMixture
from sklearn.preprocessing import StandardScaler

# Function to generate synthetic luminance data with clusters
def generate_synthetic_luminance_data(n_samples_per_cluster, n_clusters, cluster_std):
    np.random.seed(42)
    data = []
    for i in range(n_clusters):
        # Cluster centers distributed uniformly
        cluster_center = np.random.uniform(low=0.1, high=0.9)
        # Generate data with a normal distribution around each cluster center
        cluster_data = np.random.normal(loc=cluster_center, scale=cluster_std, size=(n_samples_per_cluster, 1))
        data.append(cluster_data)
    return np.vstack(data), np.concatenate([np.full(n_samples_per_cluster, i) for i in range(n_clusters)])

# Parameters for synthetic data generation
n_samples_per_cluster = 100
n_clusters = 5
cluster_std = 0.05  # Standard deviation of the clusters

# Generate synthetic luminance data
data, true_labels = generate_synthetic_luminance_data(n_samples_per_cluster, n_clusters, cluster_std)

# Assume these are the predicted labels for demonstration (randomly choosing wrong labels)
predicted_labels = np.random.choice(n_clusters, size=true_labels.shape, replace=True)

# Identify misclassified data
misclassified_indices = np.where(predicted_labels != true_labels)[0]
misclassified_data = data[misclassified_indices]

# Standardize the misclassified data (optional)
scaler = StandardScaler()
misclassified_data_scaled = scaler.fit_transform(misclassified_data)

# Fit BGMM to misclassified data
bgmm = BayesianGaussianMixture(n_components=n_clusters, covariance_type='full', random_state=42)
bgmm.fit(misclassified_data_scaled)
cluster_labels = bgmm.predict(misclassified_data_scaled)

# Determine luminance ranges for each cluster in the original scale
luminance_ranges = []
for cluster in range(n_clusters):
    cluster_data = misclassified_data[cluster_labels == cluster]
    if len(cluster_data) > 0:  # Ensure the cluster is not empty
        min_luminance = np.min(cluster_data)
        max_luminance = np.max(cluster_data)
        avg_luminance = np.mean(cluster_data)
        num_points = len(cluster_data)
        luminance_ranges.append((cluster, min_luminance, max_luminance, avg_luminance, num_points))

# Print luminance ranges and number of points for each cluster
for cluster, min_luminance, max_luminance, avg_luminance, num_points in luminance_ranges:
    print(f'Cluster {cluster}:')
    print(f'  Number of Points: {num_points}')
    print(f'  Average Luminance: {avg_luminance:.4f}')
    print(f'  Luminance Range: [{min_luminance:.4f}, {max_luminance:.4f}]\n')

# Plot histogram of luminance values for misclassified data
plt.figure(figsize=(12, 8))
plt.hist(misclassified_data, bins=30, edgecolor='black', alpha=0.6, density=False, color='gray')
plt.title('Frequency Distribution of Luminance Values in Misclassified Data')
plt.xlabel('Luminance Value')
plt.ylabel('Frequency')
plt.grid(axis='y', alpha=0.75)

# Plot BGMM clusters on the same histogram
colors = plt.cm.viridis(np.linspace(0, 1, n_clusters))  # Ensure colors match the number of clusters

for cluster, min_luminance, max_luminance, avg_luminance, num_points in luminance_ranges:
    # Plot shaded region for each cluster's range
    plt.fill_betweenx([0, plt.ylim()[1]], min_luminance, max_luminance, color=colors[cluster], alpha=0.3, label=f'Cluster {cluster}')
    # Plot the mean of the cluster
    plt.axvline(x=avg_luminance, color=colors[cluster], linestyle='--', linewidth=2, label=f'Avg Cluster {cluster}')
    # Annotate the number of points for each cluster
    plt.text((min_luminance + max_luminance) / 2, plt.ylim()[1] * 0.8, f'Points: {num_points}', 
             color=colors[cluster], ha='center', va='top', fontsize=10, weight='bold')

# Add legend for clarity
plt.legend()
plt.show()
