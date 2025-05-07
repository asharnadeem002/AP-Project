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
   ```bash
   npx prisma db push
   ```

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

```
```
