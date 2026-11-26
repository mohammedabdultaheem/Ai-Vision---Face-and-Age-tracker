# Model Evaluation Metrics and Interpretation

## Core Metric Definitions
1. **Mean Absolute Error (MAE)**:
   - Quantifies the average absolute discrepancy between the predicted age expectation and ground-truth benchmark age in years.
   - Formula: `MAE = (1/N) * sum(|y_true - y_pred|)`.
   - Current production model baseline: 3.18 years on standard validation cohorts.

2. **Root Mean Squared Error (RMSE)**:
   - Penalizes larger outlier errors more heavily than MAE.
   - Formula: `RMSE = sqrt((1/N) * sum((y_true - y_pred)^2))`.
   - Current production model baseline: 4.05 years.

3. **Age-Range Accuracy**:
   - The percentage of samples where the ground truth age falls within the model's reported confidence interval range.
   - Baseline on high-quality captures: 87.6%.

4. **Performance Stratified by Image Quality**:
   - Good Quality captures: 92.4% accuracy, MAE 2.4 years.
   - Moderate Quality captures: 84.1% accuracy, MAE 3.9 years.
   - Poor Quality captures: 62.8% accuracy (suppressed in default production mode).

5. **Inference Latency Metrics**:
   - P50 Latency: 14.2 ms (CPU).
   - P95 Latency: 18.5 ms (CPU).
   - Maximum recommended frame processing rate: 30 FPS.

