FROM python:3.10-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    libgl1-mesa-glx \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the model and code files
COPY face_api.py .

# Make directory for the model
RUN mkdir -p /app/model

# Set environment variables
ENV PORT=8000
ENV HOST=0.0.0.0
ENV MODEL_PATH=/app/model/best.pt

# Expose the port the app runs on
EXPOSE 8000

# Command to run the API
CMD ["python", "face_api.py"] 