# Face Recognition Setup and Usage Guide

This guide will help you set up and use the face recognition feature in the application. The system allows you to upload a reference image with faces and find those faces in a video.

## Prerequisites

- Python 3.8 or later installed on your system
- Node.js 16 or later

## Setup Options

There are two ways to set up the face recognition system:

### Option 1: Direct Python Setup (Recommended)

This option runs the Python API directly on your system:

1. Install Python dependencies:
   ```bash
   npm run setup:python
   ```

2. Start the Python API:
   ```bash
   npm run python:direct
   ```

3. In a separate terminal, start the Next.js app:
   ```bash
   npm run dev
   ```

   Alternatively, use a single command to start both:
   ```bash
   npm run dev:with-python-direct
   ```

### Option 2: Docker Setup (If Docker is installed)

This option runs the Python API in a Docker container:

1. Install Docker and Docker Compose
2. Run the application:
   ```bash
   npm run dev:with-python
   ```

## Troubleshooting Common Issues

### Permission Error with Prisma

If you see Prisma-related errors about permissions or the `faceRecognitionResult` model:

1. Try fixing Prisma permissions:
   ```bash
   npm run prisma:fix
   ```

2. If that doesn't work, manually run as administrator:
   - Close VS Code or any code editor
   - Open command prompt as administrator
   - Navigate to project directory
   - Run: `npx prisma generate --force`

### Python Environment Issues

If the Python API fails to start:

1. Check Python installation:
   ```bash
   python --version
   ```
   Ensure it shows version 3.8 or higher

2. Verify the setup:
   ```bash
   npm run verify:python
   ```

3. Ensure the YOLO model file exists:
   - Check that `public/best.pt` exists
   - If missing, place your YOLO model file there

### API Connection Issues

If the frontend can't connect to the Python API:

1. Check if the API is running:
   - Visit http://localhost:8000 in your browser
   - It should display a message like "Face Recognition API is running"

2. Ensure ports are not blocked:
   - The API uses port 8000 by default
   - Make sure no other application is using this port

## How to Use the Face Recognition Feature

1. Navigate to Dashboard → Face Recognition
2. Click on "Open Streamlit UI"
3. Upload a reference image containing the face(s) you want to find
4. Upload a video to search for those faces
5. Click "Process Video"
6. Wait for processing to complete (this may take some time depending on video length)
7. View the results showing when and where the faces were detected

## Technical Details

The system uses:
- **YOLO**: For detecting faces in both the reference image and video frames
- **FaceNet**: For generating face embeddings to compare similarity
- **FastAPI**: For the Python backend service
- **Next.js**: For the frontend and API routing

Processing happens in the following steps:
1. Face detection in the reference image
2. Embedding extraction for reference faces
3. Frame-by-frame processing of the video
4. Face detection in each frame
5. Comparison of detected faces with reference embeddings
6. Recording matches with timestamps and positions

## Performance Tips

- For better performance, use clear, well-lit reference images
- Processing time depends on video length and resolution
- The system processes frames at intervals to improve speed
- Higher quality detection may require more processing time

## Advanced Configuration

If needed, you can configure the system by setting environment variables:

- `PYTHON_API_URL`: Change the Python API URL (default: http://localhost:8000)
- `PYTHON_API_PORT`: Change the port for the Python API (default: 8000)
- `PYTHON_API_HOST`: Change the host for the Python API (default: 127.0.0.1)

You can set these in a `.env.local` file in the project root. 