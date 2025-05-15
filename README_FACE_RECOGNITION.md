# Face Recognition System - Setup & Usage Guide

This guide will help you set up and use the Face Recognition feature in the application. This system allows you to find faces from a reference image in video files.

## Quick Start

1. **Make sure Python is installed** (Python 3.8+ required)

2. **Setup the Python environment**:
   ```bash
   npm run setup:python
   ```

3. **Start the Python API in a dedicated terminal**:
   ```bash
   # Navigate to the project directory
   cd /path/to/project
   
   # Activate the virtual environment
   python\venv\Scripts\activate  # On Windows
   source python/venv/bin/activate  # On Linux/Mac
   
   # Run the Python API directly
   python python/face_api.py
   ```

4. **Start the Next.js application in another terminal**:
   ```bash
   npm run dev
   ```

5. **Open the application in your browser**:
   - Go to http://localhost:3000
   - Navigate to Dashboard → Face Recognition → Streamlit UI

## Troubleshooting

### "Task not found" or 404 errors when checking status

This issue has been fixed with the following improvements:
- Stable task IDs based on timestamps and file hashes
- A global task tracking system
- Improved error handling and logging
- **New: Long-polling approach** that waits for task completion instead of continuously checking status

### Python environment issues

If you encounter errors with Python:

1. **Check your Python installation**:
   ```bash
   python --version  # Should be 3.8+
   ```

2. **Verify the Python virtual environment**:
   ```bash
   # Activate the virtual environment first
   python\venv\Scripts\activate  # On Windows
   source python/venv/bin/activate  # On Linux/Mac
   
   # Check if key packages are installed
   python -c "import fastapi, uvicorn, ultralytics, keras_facenet; print('All packages installed')"
   ```

3. **If modules are missing, reinstall requirements**:
   ```bash
   # Inside the virtual environment
   pip install -r python/requirements.txt
   ```

### YOLO model not found

Make sure the YOLO model file exists at `public/best.pt`. If it's missing, you'll need to obtain the model file.

### File upload issues

If you encounter errors with file uploads:
1. Make sure both reference image and video file are selected
2. Try using smaller files initially to test the system
3. Check browser console for any JavaScript errors

## How Face Recognition Works

1. **You upload a reference image** containing faces to search for
2. **You upload a video** to scan for matching faces
3. The system uses:
   - **YOLO** for face detection
   - **FaceNet** for generating face embeddings (numerical representations)
   - **Similarity matching** to find faces in the video that match the reference

4. **Results show**:
   - Number of matches found
   - Timestamps where matches occur
   - Images of the matching frames

## Advanced Configuration

The Python API can be configured using environment variables:
- `PORT`: Change the port (default: 8000)
- `HOST`: Change the host (default: 127.0.0.1)
- `MODEL_PATH`: Override the path to the YOLO model

For example, to run on a different port:
```bash
PORT=8888 python python/face_api.py
```

If you change the port, make sure to update the `PYTHON_API_URL` in the Next.js API code or set it in your `.env.local` file:
```
PYTHON_API_URL=http://localhost:8888
``` 