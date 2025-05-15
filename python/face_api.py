import cv2
import numpy as np
import os
import shutil
import json
import tempfile
import time
from fastapi import FastAPI, File, UploadFile, HTTPException, Depends, Body, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import Dict, List, Any, Optional
import uvicorn
from ultralytics import YOLO
from keras_facenet import FaceNet
import logging
from fastapi.responses import FileResponse

# Configure logging
logging.basicConfig(level=logging.INFO, 
                    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("face_recognition_api")

# Initialize FastAPI app
app = FastAPI(title="Face Recognition API")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# JWT token validation
security = HTTPBearer()

# Create a temporary directory for uploads
TEMP_DIR = os.path.join(tempfile.gettempdir(), "face_recognition_uploads")
os.makedirs(TEMP_DIR, exist_ok=True)

# Keep track of active tasks
ACTIVE_TASKS = {}

# Model paths - Allow override via environment variable
MODEL_PATH = os.environ.get("MODEL_PATH", os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "public", "best.pt"))
logger.info(f"Using YOLO model at: {MODEL_PATH}")

# Initialize models on startup to avoid loading them for every request
yolo_model = None
embedder = None

# Helper function to get face embeddings (same as original)
def get_face_embedding(image, embedder):
    face_image_resized = cv2.resize(image, (160, 160))
    face_image_expanded = np.expand_dims(face_image_resized, axis=0)
    embeddings = embedder.embeddings(face_image_expanded)
    return embeddings[0]

# Helper function to compare faces (same as original)
def compare_faces(embedding1, embeddings_list, threshold=0.8):
    distances = [np.linalg.norm(embedding1 - embedding) for embedding in embeddings_list]
    min_distance = min(distances)
    return min_distance < threshold, min_distance, distances.index(min_distance)

# Response models
class Match(BaseModel):
    timestamp: float
    frame_number: int
    distance: float
    position: Dict[str, int]

class RecognitionResult(BaseModel):
    matches: List[Match]
    match_count: int
    status: str
    error: Optional[str] = None

# Authentication verification
async def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    # In a real implementation, you would validate the JWT here
    # For now, we'll just check if a token is provided
    if not credentials.credentials:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")
    return credentials.credentials

# Function to process a video and find matches
async def process_video_task(reference_path: str, video_path: str, task_id: str, output_dir: str):
    try:
        global yolo_model, embedder
        
        # Initialize models if not already loaded
        if yolo_model is None:
            logger.info(f"Loading YOLO model from {MODEL_PATH}")
            yolo_model = YOLO(MODEL_PATH)
        
        if embedder is None:
            logger.info("Loading FaceNet model")
            embedder = FaceNet()
        
        # Load and process the reference image
        group_image = cv2.imread(reference_path)
        if group_image is None:
            raise ValueError(f"Could not read reference image at {reference_path}")
        
        group_rgb = cv2.cvtColor(group_image, cv2.COLOR_BGR2RGB)

        # Detect faces in the reference image and extract embeddings
        group_faces = yolo_model(group_rgb)
        if len(group_faces[0].boxes) == 0:
            raise ValueError("No faces detected in the reference image.")

        # Extract embeddings for all faces in the reference image
        embeddings_list = []
        for box in group_faces[0].boxes.xyxy:
            x, y, width, height = map(int, box.tolist())
            face = group_rgb[y:height, x:width]
            embeddings_list.append(get_face_embedding(face, embedder))

        # Process the video
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            raise ValueError(f"Error opening video file at {video_path}")

        fps = cap.get(cv2.CAP_PROP_FPS)  # Frames per second
        frame_count = 0
        matches = []  # List to store all matches
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        logger.info(f"Processing video with {total_frames} frames")

        # Process every 5th frame to improve performance
        frame_step = 5
        
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break

            frame_count += 1
            
            # Process every Nth frame to improve performance
            if frame_count % frame_step != 0:
                continue

            # Convert frame to RGB
            frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

            # Brighten up the frame if necessary
            frame_rgb = frame_rgb.astype('float32') * 2.122
            frame_rgb = np.clip(frame_rgb, 0, 255).astype('uint8')

            # Detect faces in the current frame
            detected_faces = yolo_model(frame_rgb)
            if len(detected_faces[0].boxes) > 0:
                for box in detected_faces[0].boxes.xyxy:
                    x, y, width, height = map(int, box.tolist())
                    face = frame_rgb[y:height, x:width]
                    embedding_current = get_face_embedding(face, embedder)

                    # Compare with reference embeddings
                    is_match, min_distance, match_index = compare_faces(embedding_current, embeddings_list)
                    if is_match:
                        timestamp = frame_count / fps  # Time in seconds
                        
                        # Save match results
                        matches.append({
                            "timestamp": timestamp,
                            "frame_number": frame_count,
                            "distance": float(min_distance),
                            "position": {
                                "x": int(x),
                                "y": int(y),
                                "width": int(width - x),
                                "height": int(height - y)
                            }
                        })
                        
                        # Save the matched frame as an image
                        matched_frame = frame_rgb.copy()
                        cv2.rectangle(matched_frame, (x, y), (width, height), (0, 255, 0), 3)
                        frame_output_path = os.path.join(output_dir, f"match_{len(matches)}_frame_{frame_count}.jpg")
                        cv2.imwrite(frame_output_path, cv2.cvtColor(matched_frame, cv2.COLOR_RGB2BGR))

            # Log progress every 100 frames
            if frame_count % 100 == 0:
                logger.info(f"Processed {frame_count}/{total_frames} frames ({frame_count/total_frames*100:.1f}%)")

        cap.release()
        
        # Save results to a JSON file
        result = {
            "matches": matches,
            "match_count": len(matches),
            "status": "completed",
            "error": None
        }
        
        with open(os.path.join(output_dir, "result.json"), "w") as f:
            json.dump(result, f, indent=2)
            
        logger.info(f"Processing completed. Found {len(matches)} matches.")
        return result
        
    except Exception as e:
        logger.error(f"Error processing video: {str(e)}")
        error_result = {
            "matches": [],
            "match_count": 0,
            "status": "failed",
            "error": str(e)
        }
        
        # Save error result
        try:
            with open(os.path.join(output_dir, "result.json"), "w") as f:
                json.dump(error_result, f, indent=2)
        except Exception as write_error:
            logger.error(f"Could not write error result: {str(write_error)}")
            
        return error_result

@app.on_event("startup")
async def startup_event():
    logger.info("Starting Face Recognition API")
    global TEMP_DIR
    # Clean any existing temporary files
    if os.path.exists(TEMP_DIR):
        shutil.rmtree(TEMP_DIR)
    os.makedirs(TEMP_DIR, exist_ok=True)
    
    # Verify model file exists
    if not os.path.exists(MODEL_PATH):
        logger.error(f"YOLO model not found at {MODEL_PATH}")
    else:
        logger.info(f"YOLO model found at {MODEL_PATH}")

@app.on_event("shutdown")
async def shutdown_event():
    logger.info("Shutting down Face Recognition API")
    # Clean up temporary files
    if os.path.exists(TEMP_DIR):
        shutil.rmtree(TEMP_DIR)

@app.get("/")
async def root():
    return {"message": "Face Recognition API is running"}

@app.post("/process", response_model=Dict[str, Any])
async def process_video(
    background_tasks: BackgroundTasks,
    reference_image: UploadFile = File(...),
    video_file: UploadFile = File(...),
    token: str = Depends(verify_token)
):
    # Create a unique task ID that is simpler and more consistent
    timestamp = int(time.time())
    task_id = f"task_{timestamp}_{hash(reference_image.filename)}"
    
    output_dir = os.path.join(TEMP_DIR, task_id)
    os.makedirs(output_dir, exist_ok=True)
    
    # Store task info globally so it can be accessed by status endpoint
    ACTIVE_TASKS[task_id] = {
        "status": "processing",
        "start_time": timestamp,
        "output_dir": output_dir
    }
    
    try:
        # Save uploaded files
        reference_path = os.path.join(output_dir, "reference.jpg")
        with open(reference_path, "wb") as f:
            f.write(await reference_image.read())
            
        video_path = os.path.join(output_dir, "video.mp4")
        with open(video_path, "wb") as f:
            f.write(await video_file.read())
            
        # Start background processing
        background_tasks.add_task(
            process_video_task, 
            reference_path, 
            video_path, 
            task_id, 
            output_dir
        )
        
        return {
            "status": "processing",
            "task_id": task_id,
            "message": "Video processing started in the background"
        }
        
    except Exception as e:
        logger.error(f"Error starting video processing: {str(e)}")
        # Clean up files in case of error
        shutil.rmtree(output_dir, ignore_errors=True)
        # Remove from active tasks
        if task_id in ACTIVE_TASKS:
            del ACTIVE_TASKS[task_id]
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/status/{task_id}", response_model=Dict[str, Any])
async def get_status(task_id: str, token: str = Depends(verify_token)):
    # First check if task is in active tasks
    if task_id not in ACTIVE_TASKS and not os.path.exists(os.path.join(TEMP_DIR, task_id)):
        logger.warning(f"Task {task_id} not found in active tasks or temp directory")
        raise HTTPException(status_code=404, detail=f"Task not found: {task_id}")
    
    output_dir = ACTIVE_TASKS.get(task_id, {}).get("output_dir", os.path.join(TEMP_DIR, task_id))
    result_file = os.path.join(output_dir, "result.json")
    
    # Check if output directory exists
    if not os.path.exists(output_dir):
        logger.warning(f"Output directory for task {task_id} not found: {output_dir}")
        raise HTTPException(status_code=404, detail=f"Task directory not found: {task_id}")
    
    # If result file exists, the task is complete
    if os.path.exists(result_file):
        try:
            with open(result_file, "r") as f:
                result = json.load(f)
                
            # Add URLs to matched frames
            if result["status"] == "completed" and result["matches"]:
                for i, match in enumerate(result["matches"]):
                    frame_number = match["frame_number"]
                    match["frame_url"] = f"/api/python/frame/{task_id}/{i}_{frame_number}"
            
            # Update active tasks if completed
            if result["status"] in ["completed", "failed"]:
                if task_id in ACTIVE_TASKS:
                    del ACTIVE_TASKS[task_id]
                    
            return result
        except Exception as e:
            logger.error(f"Error reading result file for task {task_id}: {str(e)}")
            return {
                "status": "error",
                "message": f"Error reading result file: {str(e)}"
            }
    else:
        # Still processing
        return {
            "status": "processing",
            "task_id": task_id,
            "message": "Video is still being processed"
        }

@app.get("/frame/{task_id}/{frame_id}")
async def get_frame(task_id: str, frame_id: str, token: str = Depends(verify_token)):
    # This endpoint retrieves a saved frame image
    output_dir = os.path.join(TEMP_DIR, task_id)
    
    if not os.path.exists(output_dir):
        raise HTTPException(status_code=404, detail="Task not found")
    
    # Extract the match index and frame number from the frame_id
    parts = frame_id.split("_")
    if len(parts) < 2:
        raise HTTPException(status_code=400, detail="Invalid frame ID format")
    
    match_index = parts[0]
    frame_number = parts[1]
    
    frame_path = os.path.join(output_dir, f"match_{match_index}_frame_{frame_number}.jpg")
    
    if not os.path.exists(frame_path):
        raise HTTPException(status_code=404, detail="Frame not found")
    
    # Return the file as a binary response
    return FileResponse(frame_path, media_type="image/jpeg")

# Run the server directly if this script is executed
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    host = os.environ.get("HOST", "127.0.0.1")
    uvicorn.run("face_api:app", host=host, port=port, reload=True) 