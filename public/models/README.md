# Face API Models Directory

This directory should contain the face-api.js model files for face detection.

In a production environment, you would download these models from:
https://github.com/justadudewhohacks/face-api.js/tree/master/weights

Required models for basic face detection:
- tiny_face_detector_model-weights_manifest.json
- tiny_face_detector_model-shard1
- face_landmark_68_model-weights_manifest.json  
- face_landmark_68_model-shard1
- face_recognition_model-weights_manifest.json
- face_recognition_model-shard1
- face_recognition_model-shard2

For development/testing, the fraud detection will gracefully degrade if models are not available.