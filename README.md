# SnapTrace: Photo Management App

SnapTrace is a modern web application for storing, organizing, and sharing photos and videos with advanced features and security.

## Features

- **User Authentication**: Secure signup, login, and email verification
- **Admin Dashboard**: Manage users, subscriptions, and platform settings
- **Gallery Management**: Upload, organize, and share photos and videos
- **Advanced Search**: Find content by tags, dates, or other metadata
- **Responsive Design**: Works on desktop, tablet, and mobile devices

## Data Fetching Strategies

This project demonstrates various Next.js data fetching strategies:

1. **Static Site Generation (SSG)** with Incremental Static Regeneration (ISR) for:
   - Authentication pages (signup, login, forgot-password)
   - Blog index and home page
   - Public pages that don't need frequent updates

2. **Server-Side Rendering (SSR)** for:
   - Admin dashboard with real-time database queries
   - User profile pages with authenticated user-specific data

3. **Dynamic Routes with getStaticPaths** for:
   - Blog posts ([slug].tsx) with fallback: false
   - Tag pages ([tag].tsx) with fallback: true for on-demand generation

4. **Client-Side Data Fetching with SWR** in:
   - Explore page with pagination and filtering
   - Dashboard components with real-time updates

## Getting Started

### Prerequisites

- Node.js (>= 16.x)
- MySQL database or compatible alternative
- npm or yarn

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/yourusername/snaptrace.git
   cd snaptrace
   ```

2. Install dependencies
   ```bash
   npm install
   # or 
   yarn
   ```

3. Create a `.env` file in the root directory with the following variables:
   ```
   DATABASE_URL="mysql://user:password@localhost:3306/snaptrace"
   JWT_SECRET="your-jwt-secret-key"
   NEXTAUTH_URL="http://localhost:3000"
   ```

4. Set up the database

   Run migrations (if required):
   npx prisma migrate reset --force
   npx prisma generate
   ```bash
   npx prisma db push
   ```
   Apply migrations (if needed):
   npx prisma migrate dev --name update_schema

5. Create admin user(s)
   ```bash
   npm run seed:admin
   # or directly with
   npx ts-node scripts/seed-admin.ts
   ```

6. Start the development server
   ```bash
   npm run dev
   # or
   yarn dev
   ```

7. Open [http://localhost:3000](http://localhost:3000) in your browser

### Admin Login Credentials

After running the admin seed script successfully, you can log in with:

- Email: `admin@snaptrace.com`
- Password: `Admin@123`

Or:

- Email: `superadmin@snaptrace.com`
- Password: `SuperAdmin@123`

## Authentication Flow

1. User signs up with email, username, and password
2. Verification email is sent to the user
3. User verifies email by entering the verification code
4. Admin approves the user account
5. User can log in after approval
6. Two-step login process requires an email verification code

## Role-Based Access

- **User Role**: Regular users can access their profile, gallery, and subscription features
- **Admin Role**: Administrators can access the admin dashboard, approve users, and manage platform features

## Project Structure

- `/app`: Application components, hooks, and utilities
- `/pages`: Page components and API routes
- `/prisma`: Database schema and migration files
- `/public`: Static assets
- `/styles`: Global styles and theme settings
- `/scripts`: Utility scripts for setup and maintenance

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Face Recognition Feature

SnapTrace now includes an AI-powered face recognition feature that allows users to find faces in videos.

### Setup Instructions

1. Ensure you have Python 3.8+ installed on your system
2. Run the setup script to create a Python virtual environment:
   ```
   npm run setup:python
   OR
   python python/face_api.py
   ```
3. Generate Prisma client with the new models:
   ```
   npm run prisma:generate
   ```
4. Place the YOLO model file at `public/best.pt`
5. Start the application:
   ```
   npm run dev
   ```

### How It Works

1. Upload reference images and videos to your gallery
2. Go to the Face Recognition page from the user dashboard sidebar
3. Select a reference image containing the face(s) you want to find
4. Select a video to search in
5. Start the face recognition process
6. View the results showing when and where the faces were found in the video

### Technologies Used

- Next.js for the frontend and API routes
- Prisma for database operations
- Python with YOLO and FaceNet for face detection and recognition
- TensorFlow and OpenCV for image processing

# Next.js Face Recognition System

This project integrates a Python-based face recognition system with a Next.js application. It uses YOLO and FaceNet for face detection and matching.

## Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later)
- [Docker](https://www.docker.com/get-started/) and Docker Compose

## Setup Instructions

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start the Python API service**:
   ```bash
   npm run python:start
   ```
   This command builds and starts a Docker container with the Python face recognition API.

3. **Run the Next.js development server**:
   ```bash
   npm run dev
   ```
   
   Alternatively, start both the Python API and Next.js with a single command:
   ```bash
   npm run dev:with-python
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Face Recognition Feature

The face recognition system allows you to:

1. Upload a reference image (containing faces)
2. Upload a video to scan for those faces
3. View results showing any matches found in the video

### How It Works

The system uses:
- **YOLO**: For face detection in images and videos
- **FaceNet**: For extracting face embeddings to compare faces
- **FastAPI**: Python backend for processing videos and images
- **Next.js**: Frontend and API routes to communicate with the Python backend

## Development

### Project Structure

- `python/`: Contains the Python API code and Dockerfile
  - `face_api.py`: FastAPI implementation for face recognition
  - `requirements.txt`: Python dependencies
  - `Dockerfile`: Docker configuration for the Python service

- `pages/api/python/`: Next.js API routes for communicating with the Python service
  - `face-recognition.ts`: API handler for face recognition requests

- `pages/dashboard/user/face-recognition/`: Frontend components
  - `streamlit-ui.tsx`: React component for the face recognition UI

- `docker-compose.yml`: Docker Compose configuration

### Stopping the Python API

When you're done, stop the Python API service:

```bash
npm run python:stop
```

## Troubleshooting

If you encounter issues:

1. Check that Docker is running and the container is up:
   ```bash
   docker-compose ps
   ```

2. Check the container logs:
   ```bash
   docker-compose logs face-api
   ```

3. Make sure the YOLO model is present in the public directory (`public/best.pt`)

4. Ensure the Next.js API can communicate with the Python API (http://localhost:8000)

```
```
