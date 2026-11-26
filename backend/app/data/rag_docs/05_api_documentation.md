# AI VISION REST & WebSocket API Specification

## Endpoints Summary

### Authentication
- `POST /api/v1/auth/login`: Form-encoded or JSON credentials. Returns JWT bearer access token with assigned enterprise role.
- `POST /api/v1/auth/register`: Create a new user with email, password, full name, and role.
- `GET /api/v1/auth/me`: Returns current authenticated user profile and permissions.

### Face Detection & Analysis
- `POST /api/v1/detection/analyze`: Accepts multipart form image file (`image`) or raw bytes. Executes validation, face detection, quality analysis, age estimation.
- `POST /api/v1/detection/image`: Dedicated image analysis endpoint with aggregate summary report output.
- `GET /api/v1/detection/status`: Health and model readiness status.
- `WS /api/v1/detection/stream`: WebSocket channel for real-time video frame streaming and low-latency JSON inference responses.

### Model Management
- `GET /api/v1/models`: Retrieve all registered models and active deployment states.
- `POST /api/v1/models/register`: Register a new model version with metadata and architecture details.
- `POST /api/v1/models/deploy`: Promote model to staging or production environment.
- `POST /api/v1/models/rollback`: Revert deployment to previous verified model version.

### RAG Knowledge Base
- `POST /api/v1/rag/query`: Submit query to RAG assistant; returns semantic answer with grounded citations.
- `GET /api/v1/rag/documents`: List indexed documentation articles.
- `POST /api/v1/rag/documents`: Upload and index new knowledge documentation.
- `DELETE /api/v1/rag/documents/{id}`: Purge document and re-index vector space.

### Error Codes
- `400 Bad Request`: Payload validation failed or unsupported image format.
- `401 Unauthorized`: Token missing or expired.
- `403 Forbidden`: Role permission level insufficient for requested operation.
- `422 Unprocessable Entity`: Corrupt image or unparsable bounding box parameters.
- `500 Internal Error`: Inference pipeline exception.

