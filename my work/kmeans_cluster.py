import pandas as pd
import numpy as np
import seaborn as sns
import matplotlib.pyplot as plt
from sklearn.cluster import KMeans
from sklearn.metrics import silhouette_score

# Step 1: Generate data
# np.random.seed(42)
n_samples = 1000
accuracy = 0.60

# Generate luminance values
luminance = np.random.uniform(0, 100, n_samples)

# Randomly assign classifications with a 60% accuracy
classification = np.random.choice(['correct', 'incorrect'], n_samples, p=[accuracy, 1-accuracy])

# Create DataFrame
data = pd.DataFrame({
    'luminance': luminance,
    'classification': classification
})

# Separate the data into correctly and incorrectly classified images
correct = data[data['classification'] == 'correct']
incorrect = data[data['classification'] == 'incorrect']

# Step 2: Clustering
# Determine the optimal number of clusters using silhouette score
X = incorrect[['luminance']]

inertia = []
silhouette_scores = []
K = range(2, 10)

for k in K:
    kmeans = KMeans(n_clusters=k, random_state=42)
    kmeans.fit(X)
    inertia.append(kmeans.inertia_)
    silhouette_scores.append(silhouette_score(X, kmeans.labels_))

# Plot the elbow method and silhouette score results
plt.figure(figsize=(14, 7))

plt.subplot(1, 2, 1)
plt.plot(K, inertia, 'bx-')
plt.xlabel('Number of clusters')
plt.ylabel('Inertia')
plt.title('Elbow Method')
optimal_k = K[np.argmax(silhouette_scores)]
plt.text(optimal_k, inertia[np.argmax(silhouette_scores)], f'Optimal k = {optimal_k}', color='red')

plt.subplot(1, 2, 2)
plt.plot(K, silhouette_scores, 'bx-')
plt.xlabel('Number of clusters')
plt.ylabel('Silhouette Score')
plt.title('Silhouette Score Method')
plt.text(optimal_k, silhouette_scores[np.argmax(silhouette_scores)], f'Optimal k = {optimal_k}', color='red')

plt.tight_layout()
plt.show()

# Determine the optimal number of clusters (max silhouette score)
print(f'Optimal number of clusters: {optimal_k}')

# Apply KMeans clustering with the optimal number of clusters
kmeans = KMeans(n_clusters=optimal_k, random_state=42)
incorrect['cluster'] = kmeans.fit_predict(incorrect[['luminance']])

# Plot clusters
plt.figure(figsize=(10, 7))
sns.scatterplot(data=incorrect, x='luminance', y=[0]*len(incorrect), hue='cluster', palette='viridis')
plt.title('Luminance Clusters')

# Plot correctly classified points as green dots below the cluster points
sns.scatterplot(data=correct, x='luminance', y=[-0.1]*len(correct), color='green', marker='o', label='Correctly Classified')

# Plot incorrectly classified points as red crosses below the cluster points
sns.scatterplot(data=incorrect, x='luminance', y=[-0.1]*len(incorrect), color='red', marker='x', label='Misclassified')

# Calculate positions for text annotations and avoid overlap
cluster_centers = []
for cluster_id in incorrect['cluster'].unique():
    cluster_data = incorrect[incorrect['cluster'] == cluster_id]
    cluster_center = cluster_data['luminance'].mean()
    cluster_centers.append(cluster_center)

# Sort cluster centers to avoid overlap
cluster_centers_sorted = sorted(cluster_centers)

# Adding misclassification rate and counts for each cluster
padding = 0.1  # Vertical padding between text annotations
y_positions = np.linspace(0.2, 1.2, len(cluster_centers_sorted))  # Dynamic y-positions based on number of clusters

# Expand the y-axis limits to make space for the annotations
plt.ylim(-0.5, 2)

for i, cluster_id in enumerate(incorrect['cluster'].unique()):
    cluster_data = incorrect[incorrect['cluster'] == cluster_id]
    cluster_center = cluster_data['luminance'].mean()

    # Calculate counts and misclassification rate
    misclassified_count = len(cluster_data)
    total_count = len(data[(data['luminance'] >= cluster_data['luminance'].min()) & (data['luminance'] <= cluster_data['luminance'].max())])
    correctly_classified_count = total_count - misclassified_count
    misclassification_rate = misclassified_count / total_count if total_count > 0 else 0

    # Adjust y-position based on sorted cluster centers
    y_position = y_positions[i]

    # Display text with the calculated information above the cluster points
    plt.text(
        x=cluster_centers_sorted[i],
        y=y_position,
        s=(f"Cluster {cluster_id}\n"
           f"Misclassification Rate: {misclassification_rate:.2f}\n"
           f"Correctly Classified: {correctly_classified_count}\n"
           f"Misclassified: {misclassified_count}"),
        horizontalalignment='center',
        fontsize=10,
        bbox=dict(facecolor='white', alpha=0.8)  # Background box for better visibility
    )

plt.legend()
plt.show()

# New plot: KDE for Luminance and Frequency of Misclassified Examples
plt.figure(figsize=(10, 7))

# Plot KDE of luminance for all data
sns.kdeplot(data['luminance'], color='blue', label='Luminance KDE', fill=True)

# Plot KDE of misclassified luminance values
sns.kdeplot(incorrect['luminance'], color='red', label='Misclassified KDE', fill=True)

# Highlight cluster ranges with vertical lines and shaded areas
for cluster_id in incorrect['cluster'].unique():
    cluster_data = incorrect[incorrect['cluster'] == cluster_id]
    cluster_min = cluster_data['luminance'].min()
    cluster_max = cluster_data['luminance'].max()

    plt.axvline(x=cluster_min, color='black', linestyle='--', alpha=0.7)
    plt.axvline(x=cluster_max, color='black', linestyle='--', alpha=0.7)

    # Shade the area between the cluster min and max
    plt.fill_betweenx(y=[0, 1], x1=cluster_min, x2=cluster_max, color='gray', alpha=0.3)

    # Annotate the range on the plot
    plt.text(
        x=(cluster_min + cluster_max) / 2,
        y=0.8,
        s=f"Cluster {cluster_id}\n({cluster_min:.1f}, {cluster_max:.1f})",
        horizontalalignment='center',
        fontsize=9,
        color='black',
        bbox=dict(facecolor='white', alpha=0.7)
    )

plt.title('Luminance KDE with Misclassification Frequency and Cluster Ranges')
plt.xlabel('Luminance')
plt.ylabel('Density')
plt.legend()
plt.show()
