# Camera & Hardware Troubleshooting Guide

## Common Camera Activation Issues
1. **Permission Denied / Blocked**:
   - Symptom: Browser displays "Camera permission denied" or error code `NotAllowedError`.
   - Resolution: Click the site lock/permissions icon in browser URL bar, change Camera permission to "Allow", and reload the page.
   - On Windows: Open Settings -> Privacy & Security -> Camera -> Ensure "Let desktop apps access your camera" is enabled.

2. **Device in Use / Busy (`NotReadableError`)**:
   - Symptom: Camera cannot start because another program has claimed exclusive hardware control.
   - Resolution: Close Zoom, Teams, Skype, OBS Studio, or other browser tabs accessing the webcam, then restart the camera.

3. **Camera Switching Issues**:
   - AI VISION enumerates available videoinput devices using `navigator.mediaDevices.enumerateDevices()`.
   - Select the desired camera from the dropdown selector. Changing selection releases the existing MediaStream and initializes the new target device.

4. **Frame Rate Stutter / Latency**:
   - Adjust the "Frame Sampling Rate" slider in the camera workspace (recommended: 3 to 10 FPS for balanced CPU utilization).
   - Verify network latency if using remote backend inference.

