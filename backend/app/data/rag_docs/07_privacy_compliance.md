# Enterprise Privacy & Data Protection Compliance

## Core Privacy Architecture & Zero-Retention Policy
AI VISION is engineered from the ground up to comply with GDPR (Articles 5, 9, 32), CCPA/CPRA, and enterprise biometric privacy standards (including BIPA guidelines).

### Technical Privacy Guarantees
1. **Zero Facial Storage by Default**:
   - Camera video frames and uploaded photos are processed exclusively in volatile memory (RAM).
   - Once inference completes, image buffers and pixel arrays are unlinked and marked for immediate garbage collection.
   - No persistent image files, disk caches, or permanent image storage are written to disk.

2. **No Facial Embeddings or Biometric Templates**:
   - The platform does not generate, serialize, or store 128-d or 512-d facial embedding vectors.
   - It maintains no facial recognition database, identity matching lookup, or individual gallery.

3. **Temporary Session-Scoped Identifiers**:
   - Detections are labeled with transient session tokens (e.g., `Face #1`, `Face #2`).
   - Identifiers do not correlate across frames, video streams, or distinct upload requests.

4. **Camera Controls & Transparency**:
   - Explicit user permission required before hardware stream initializes.
   - Prominent visual indicator ("LIVE STREAMING ACTIVE") illuminated continuously while camera is active.
   - Single-click instantaneous "Stop Camera" kill-switch terminating MediaStream tracks immediately.
   - Strict absence of audio capture or microphone permissions.

