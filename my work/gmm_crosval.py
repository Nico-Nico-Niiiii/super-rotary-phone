import pandas as pd
import matplotlib.pyplot as plt
from sklearn.mixture import GaussianMixture
from sklearn.metrics import silhouette_score
import numpy as np
from sklearn.model_selection import StratifiedKFold

# Load the Excel file
file_path = 'classification_results.xlsx'  # Replace with your file path
df = pd.read_excel(file_path)

# Filter the dataframe for correctly and misclassified images
correct_df = df[df['Correct Prediction'] == 'Yes']
misclassified_df = df[df['Correct Prediction'] == 'No']

# Extract the luminance values of misclassified images
luminance_values = misclassified_df['Luminescence'].values.reshape(-1, 1)

# Apply GMM clustering (determine optimal number of clusters dynamically using BIC, AIC, Elbow, Silhouette, and Cross-Validation)
bic_scores = []
aic_scores = []
log_likelihoods = []  # For Elbow-like method using log likelihood
silhouette_scores = []  # For Silhouette Score
cv_scores = []  # For Cross-Validation
K = range(2, 10)  # Starting from 2 clusters as silhouette score requires at least 2 clusters

# Setup for Cross-Validation
cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)

for k in K:
    # GMM for BIC, AIC, and log likelihood
    gmm = GaussianMixture(n_components=k, random_state=42)
    gmm.fit(luminance_values)
    bic_scores.append(gmm.bic(luminance_values))
    aic_scores.append(gmm.aic(luminance_values))
    log_likelihoods.append(gmm.score(luminance_values) * len(luminance_values))  # Total log likelihood
    
    # Assign each point to its most likely cluster for Silhouette Score
    labels = gmm.predict(luminance_values)
    silhouette_scores.append(silhouette_score(luminance_values, labels))
    
    # Cross-Validation for GMM
    cv_score = []
    for train_idx, test_idx in cv.split(luminance_values, labels):
        gmm_cv = GaussianMixture(n_components=k, random_state=42)
        gmm_cv.fit(luminance_values[train_idx])
        cv_score.append(gmm_cv.score(luminance_values[test_idx]))
    cv_scores.append(np.mean(cv_score))

# Plot the BIC, AIC, "Elbow", Silhouette, and Cross-Validation Scores to determine the optimal number of clusters
plt.figure(figsize=(14, 8))

plt.plot(K, bic_scores, 'bx-', label='BIC Score')
plt.plot(K, aic_scores, 'rx-', label='AIC Score')
plt.plot(K, -np.array(log_likelihoods), 'gx-', label='Log Likelihood (as Elbow)')
plt.plot(K, silhouette_scores, 'yx-', label='Silhouette Score')
plt.plot(K, cv_scores, 'mx-', label='Cross-Validation Score')

plt.xlabel('Number of Clusters (k)')
plt.ylabel('Score')
plt.title('Optimal Number of Clusters using BIC, AIC, Log Likelihood, Silhouette, and Cross-Validation')
plt.grid(True)

# Dynamically find the optimal number of clusters (minimum BIC, AIC scores, and "Elbow" method)
optimal_k_bic = max(np.argmin(bic_scores), 2)
optimal_k_aic = max(np.argmin(aic_scores) ,2)
optimal_k_elbow = np.argmax(np.diff(np.diff(-np.array(log_likelihoods)))) + 3  # Second derivative on negative log likelihood
optimal_k_silhouette = np.argmax(silhouette_scores) + 2
optimal_k_cv = np.argmax(cv_scores) + 2

plt.axvline(x=optimal_k_bic, color='blue', linestyle='--', label=f'Optimal k (BIC) = {optimal_k_bic}')
plt.axvline(x=optimal_k_aic, color='red', linestyle='--', label=f'Optimal k (AIC) = {optimal_k_aic}')
plt.axvline(x=optimal_k_elbow, color='green', linestyle='--', label=f'Optimal k (Elbow) = {optimal_k_elbow}')
plt.axvline(x=optimal_k_silhouette, color='yellow', linestyle='--', label=f'Optimal k (Silhouette) = {optimal_k_silhouette}')
plt.axvline(x=optimal_k_cv, color='magenta', linestyle='--', label=f'Optimal k (Cross-Validation) = {optimal_k_cv}')

plt.legend(loc='best')
plt.show()

# Choose the optimal number of clusters based on BIC, AIC, Elbow, Silhouette, or Cross-Validation (you can choose one)
optimal_k = max(optimal_k_bic, optimal_k_aic, optimal_k_elbow, optimal_k_silhouette, optimal_k_cv)
optimal_k = optimal_k_aic

# Apply GMM clustering with the chosen number of clusters
gmm = GaussianMixture(n_components=optimal_k)
misclassified_df['Cluster'] = gmm.fit_predict(luminance_values)

# Calculate the number of misclassified and correctly classified images in each cluster
cluster_summary = misclassified_df.groupby('Cluster').size()
total_correct = len(correct_df)

# Assume evenly distributed correctly classified examples across clusters
cluster_correct_classifications = total_correct / optimal_k  

# Calculate misclassification rate
misclassification_rate = cluster_summary / (cluster_summary + cluster_correct_classifications)

# Create a combined plot
fig, (ax1, ax2) = plt.subplots(2, 1, figsize=(14, 12))

# Plot 1: Luminance vs. Classification Results with GMM Clustering
ax1.hist(misclassified_df['Luminescence'], bins=30, color='blue', edgecolor='black', alpha=0.3, label='Misclassified Frequency')
ax1.scatter(correct_df['Luminescence'], [0]*len(correct_df), color='green', marker='o', label='Correctly Classified')
ax1.scatter(misclassified_df['Luminescence'], [0]*len(misclassified_df), color='red', marker='x', label='Misclassified')

# Scatter plot for the clustered misclassified points using GMM
for cluster in range(optimal_k):
    cluster_points = misclassified_df[misclassified_df['Cluster'] == cluster]
    ax1.scatter(cluster_points['Luminescence'], [-cluster-1]*len(cluster_points), 
                label=f'Cluster {cluster+1}', marker='x', cmap='viridis')

ax1.set_title('Luminance vs. Classification Results with GMM Clustering')
ax1.set_xlabel('Luminance')
ax1.set_ylabel('Frequency of Misclassified Images')
ax1.legend(loc='center left', bbox_to_anchor=(1, 0.5))
ax1.grid(True)



# Add cluster labels to the dataframe
labels = misclassified_df['Cluster'] 

# Determine the number of clusters
unique_labels = np.unique(labels)
num_clusters = len(unique_labels)

# Initialize lists to store cluster details
cluster_details = []

# Calculate details for each cluster
for cluster in unique_labels:
    cluster_points = misclassified_df[misclassified_df['Cluster'] == cluster]
    cluster_size = len(cluster_points)
    min_luminance = cluster_points['Luminescence'].min()
    max_luminance = cluster_points['Luminescence'].max()

    # Calculate correctly classified examples in the luminance range
    correct_in_range = correct_df[
        (correct_df['Luminescence'] >= min_luminance) &
        (correct_df['Luminescence'] <= max_luminance)
    ]
    correct_count = len(correct_in_range)

    # Calculate the misclassification rate
    misclassification_rate = cluster_size / (cluster_size + correct_count)
    
    # Store cluster details
    cluster_details.append({
        'Cluster': cluster + 1,
        'Incorrect Count': cluster_size,
        'Correct Count': correct_count,
        'Misclassification Rate': misclassification_rate,
        'Luminance Range': (min_luminance, max_luminance)
    })


# Print the details for each cluster
for detail in cluster_details:
    print(f"Cluster {detail['Cluster']}:")
    print(f"  Incorrect Count: {detail['Incorrect Count']}")
    print(f"  Correct Count: {detail['Correct Count']}")
    print(f"  Misclassification Rate: {detail['Misclassification Rate']:.2f}")
    print(f"  Luminance Range: {detail['Luminance Range'][0]:.2f} - {detail['Luminance Range'][1]:.2f}")
    print("-" * 50)


# Plot 2: Cluster Analysis: Misclassification Rate and Counts
bar_width = 0.35
index = np.arange(len(cluster_details))

ax2.bar(index, [detail['Incorrect Count'] for detail in cluster_details], bar_width, label='Misclassified')
ax2.bar(index + bar_width, [detail['Correct Count'] for detail in cluster_details], bar_width, label='Correctly Classified')

# Add the misclassification rate as text on the bars
for i, detail in enumerate(cluster_details):
    ax2.text(index[i], detail['Incorrect Count'] + 0.5, f'{detail["Misclassification Rate"]:.2f}', 
             ha='center', va='bottom', fontsize=10, color='red')
    ax2.text(index[i] + bar_width, detail['Correct Count'] + 0.5, f'{detail["Correct Count"]}', 
             ha='center', va='bottom', fontsize=10)

ax2.set_xlabel('Cluster')
ax2.set_ylabel('Count')
ax2.set_title('Cluster Analysis: Misclassification Rate and Counts')
ax2.set_xticks(index + bar_width / 2)
ax2.set_xticklabels([f'Cluster {detail["Cluster"]}' for detail in cluster_details])
ax2.legend()
ax2.grid(True)

# Show the combined plot
plt.tight_layout()
plt.show()

