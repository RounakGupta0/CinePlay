# 🌌 ShareMe — Midnight Indigo Video-Sharing Platform

A cinematic video-sharing web application built with the **MERN** stack (MongoDB, Express, React, Node.js), **Cloudinary**, and **express-fileupload**. Designed with a **Midnight Indigo** visual aesthetic featuring deep blacks (`#09090F`), rich indigo cards (`#191927`), and glowing purple accents (`#7C5CFC`).

---

## ✨ Features

- **Midnight Indigo Aesthetic**:
  - Deep black backgrounds (`#09090F`)
  - Floating dark navbar with subtle blur and transparency
  - Soft purple glowing interactive states (`#7C5CFC`, `#957BFF`)
  - 4-column video grid with thumbnail zoom on hover
  - Collapsible left sidebar with sleek category pills
  - Hero featured video section with gradient overlay
  - Dark search bar with glowing focus state
- **Authentication & Security**:
  - Secure signup and login with **bcryptjs** and **JWT**
  - **Email verification**: Prevents duplicate email accounts and ensures verified users only
  - Resend email verification option
  - Passwords hashed with 12 salt rounds
  - Rate limiting & Helmet security headers
- **Video Capabilities**:
  - Public browsing: Anyone can explore the home page, search videos, view channels, and watch videos without logging in
  - Responsive HTML5 video player with play/pause and custom controls
  - Cloudinary video upload with express-fileupload support up to 500MB
  - Automatic thumbnail generation or custom thumbnail image upload
  - Categorization across 14 categories (Music, Gaming, Tech, Film, etc.)
  - Real-time view count tracking
- **Social & Interactions**:
  - **Navbar**: Upload and profile buttons are **only visible to logged-in users**
  - **Like system**: Like & unlike videos with live counts
  - **Subscription system**: Follow creator channels (channel owners are blocked from subscribing to their own channel)
  - **Comment system**: Logged-in users can post comments; authors or video owners can delete them
  - **Channel pages**: Custom banners, avatars, bios, video tabs, and subscriber counts
  - **Channel customization**: Edit banner, profile avatar, channel name, and bio

---

## 🛠️ Tech Stack

- **Frontend**: React 18/19, React Router v6, Axios, React Toastify, Bootstrap 5 CSS, Custom CSS Variables
- **Backend**: Node.js, Express.js, Mongoose (MongoDB)
- **Media Storage**: Cloudinary SDK + `express-fileupload`
- **Security & Auth**: JSON Web Tokens (`jsonwebtoken`), `bcryptjs`, `helmet`, `express-rate-limit`
- **Email Service**: `nodemailer` (SMTP)

---

## 🚀 Getting Started

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v16 or higher)
- [MongoDB](https://www.mongodb.com/) (Local instance or MongoDB Atlas)
- [Cloudinary Account](https://cloudinary.com/) (Free tier)

---

### 2. Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Configure your environment variables in `.env`:
   ```env
   PORT=5000
   MONGO_URI=mongodb://localhost:27017/shareme
   JWT_SECRET=your_super_secret_jwt_key_here
   JWT_EXPIRE=7d
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_email_app_password
   CLIENT_URL=http://localhost:3000
   CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
   CLOUDINARY_API_KEY=your_cloudinary_api_key
   CLOUDINARY_API_SECRET=your_cloudinary_api_secret
   ```

3. Start the backend development server:
   ```bash
   npm run dev
   ```
   Server will start at `http://localhost:5000`.

---

### 3. Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Start the React development server:
   ```bash
   npm start
   ```
   The client will launch automatically at `http://localhost:3000`.

---

## 📁 Directory Structure

```
ShareMe/
├── backend/
│   ├── config/
│   │   └── cloudinary.js         # Cloudinary configuration
│   ├── controllers/
│   │   ├── authController.js     # Signup, verify, login, resend
│   │   ├── videoController.js    # Upload, search, update, delete
│   │   ├── commentController.js  # Add, delete, list comments
│   │   ├── likeController.js     # Toggle like, get like status
│   │   ├── subscriptionController.js # Toggle sub, feed, counts
│   │   └── userController.js     # Profile & channel customizer
│   ├── middleware/
│   │   └── auth.js               # JWT protect & optionalAuth
│   ├── models/
│   │   ├── User.js               # User & channel schema
│   │   ├── Video.js              # Video metadata & stats
│   │   ├── Comment.js            # Video comments
│   │   ├── Like.js               # Video likes
│   │   └── Subscription.js       # Channel subscriptions
│   ├── routes/
│   │   ├── auth.js
│   │   ├── videos.js
│   │   ├── comments.js
│   │   ├── likes.js
│   │   ├── subscriptions.js
│   │   └── users.js
│   ├── utils/
│   │   ├── sendEmail.js          # Nodemailer email transporter
│   │   └── sendToken.js          # JWT & HTTP-only cookies
│   ├── .env
│   ├── package.json
│   └── server.js
└── frontend/
    ├── public/
    │   └── index.html            # Plus Jakarta Sans & Midnight Indigo title
    ├── src/
    │   ├── api/
    │   │   └── axios.js          # Axios interceptors with JWT
    │   ├── components/
    │   │   ├── Navbar.js         # Floating dark navbar + user dropdown
    │   │   ├── Sidebar.js        # Collapsible navigation & categories
    │   │   ├── VideoCard.js      # Cinematic video cards with hover zoom
    │   │   └── ProtectedRoute.js # Route guard for authenticated actions
    │   ├── context/
    │   │   └── AuthContext.js    # Global auth & session management
    │   ├── pages/
    │   │   ├── Home.js           # 4-col grid, featured banner, pills
    │   │   ├── Watch.js          # Responsive player, likes, subs, comments
    │   │   ├── Upload.js         # Video & thumbnail upload with progress
    │   │   ├── Channel.js        # Channel banner, avatar, tabs, videos
    │   │   ├── Settings.js       # Channel customization & banner update
    │   │   ├── Search.js         # Video search result grid
    │   │   ├── Trending.js       # Top viewed videos
    │   │   ├── Subscriptions.js  # Following feed
    │   │   ├── LikedVideos.js    # Liked videos list
    │   │   ├── Login.js          # Auth sign in with resend verification
    │   │   ├── Register.js       # Auth register with verification instructions
    │   │   └── VerifyEmail.js    # Link handler for email verification
    │   ├── utils/
    │   │   └── helpers.js        # Timeago, counts, duration formatters
    │   ├── App.js                # App router & layouts
    │   ├── index.css             # Midnight Indigo design system
    │   └── index.js
    └── package.json
```

