# AI VISION Computer Vision Pipeline Architecture

## System Overview
The AI VISION platform employs a decoupled, multi-stage inference architecture designed for high-throughput, low-latency face detection and approximate age estimation.

### Pipeline Stages
1. **Input Ingestion & Validation**:
   - Accepts raw RGB/BGR image buffers or base64 streams via HTTP multipart or WebSocket.
   - Enforces dimension checks (minimum 64x64px, maximum 4096x4096px) and mime-type verification.
   - Decodes image bytes directly into RAM using OpenCV C++ decoders.

2. **Face Detection Stage (OpenCV YuNet)**:
   - Model: YuNet ONNX (FaceDetectorYN).
   - Architecture: Lightweight deep convolutional network with Feature Pyramid Network (FPN) and single-stage detection.
   - Input: Dynamically resized spatial dimension matching input frame.
   - Outputs: Bounding boxes `[x, y, w, h]`, 5 facial landmark pairs, and classification confidence score.
   - Non-Maximum Suppression (NMS) threshold: 0.30; Detection confidence threshold: 0.55.

3. **Image Quality Assessment Stage**:
   - Evaluates lighting via grayscale luminance mean (nominal range: 45–220).
   - Evaluates motion blur using Laplacian second-derivative variance (sharpness threshold: >75.0).
   - Evaluates boundary clipping (faces contacting frame perimeter).
   - Evaluates multi-face overlap using Intersection-over-Union (IoU > 0.35).

4. **Age Estimation Stage (GoogleNet AgeNet ONNX)**:
   - Architecture: Multi-branch Inception-based deep convolutional neural network.
   - Input: Face region cropped, resized to 224x224x3, normalized via standard ILSVRC mean subtraction `[104.0, 117.0, 123.0]`.
   - Output: 8-class softmax probability distribution spanning `(0-2)`, `(4-6)`, `(8-12)`, `(15-20)`, `(25-32)`, `(38-43)`, `(48-53)`, `(60-100)`.

5. **Prediction Calibration & Age Range Conversion**:
   - Calculates continuous expected age value: `E[age] = sum(p_i * center_i)`.
   - Formulates conservative age range bracket (e.g., `25–30 years`).
   - Maps entropy to a model uncertainty indicator.
   - If image quality is flagged as "Poor", suppresses numerical age estimation and displays an actionable quality advisory.

6. **Ephemeral Purge**:
   - Immediately releases and deletes in-memory image buffers, cropped arrays, and intermediate tensors from memory.

