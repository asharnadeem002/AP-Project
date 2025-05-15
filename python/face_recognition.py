import cv2
import numpy as np
import os
import json
import sys
import argparse
from ultralytics import YOLO
from keras_facenet import FaceNet
import tempfile

# Helper function to get face embeddings
def get_face_embedding(image, embedder):
    face_image_resized = cv2.resize(image, (160, 160))
    face_image_expanded = np.expand_dims(face_image_resized, axis=0)
    embeddings = embedder.embeddings(face_image_expanded)
    return embeddings[0]

# Helper function to compare faces
def compare_faces(embedding1, embeddings_list, threshold=0.8):
    distances = [np.linalg.norm(embedding1 - embedding) for embedding in embeddings_list]
    min_distance = min(distances)
    return min_distance < threshold, min_distance, distances.index(min_distance)

def main(reference_path, video_path, output_path, model_path):
    try:
        # Initialize the YOLO model and FaceNet embedder
        yolo_model = YOLO(model_path)
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
        matches = []  # List to store all matches (timestamp, distance)
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break

            frame_count += 1
            
            # Process every 5th frame to improve performance
            if frame_count % 5 != 0:
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
                        matches.append({
                            "timestamp": timestamp,
                            "distance": float(min_distance),
                            "frame": frame_count,
                            "position": {
                                "x": int(x),
                                "y": int(y),
                                "width": int(width - x),
                                "height": int(height - y)
                            }
                        })

        cap.release()

        # Save results to output file
        result = {
            "status": "completed",
            "matchCount": len(matches),
            "matches": matches
        }
        
        with open(output_path, 'w') as f:
            json.dump(result, f, indent=2)
            
        return 0
    except Exception as e:
        error_result = {
            "status": "failed",
            "error": str(e),
            "matchCount": 0,
            "matches": []
        }
        
        try:
            with open(output_path, 'w') as f:
                json.dump(error_result, f, indent=2)
        except:
            pass
        
        print(f"Error: {str(e)}", file=sys.stderr)
        return 1

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Face Recognition from Video')
    parser.add_argument('--reference', required=True, help='Path to reference image')
    parser.add_argument('--video', required=True, help='Path to video file')
    parser.add_argument('--output', required=True, help='Path for output JSON file')
    parser.add_argument('--model', required=True, help='Path to the YOLO model file')
    
    args = parser.parse_args()
    
    sys.exit(main(args.reference, args.video, args.output, args.model)) 