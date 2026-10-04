# Blog Capstone

A full-stack blog application built with Node.js, Express.js, EJS, PostgreSQL, JavaScript, HTML5, and CSS3.

The project started as a traditional CRUD blog and evolved into a complete social blogging platform with authentication, user profiles, post ownership controls, comments, likes, friendships, private messaging, image uploads, and production deployment.

## 🚀 Live Demo

https://blog-capstone-wy3x.onrender.com

## 📂 GitHub Repository

https://github.com/kelsbaba/blog-capstone

## ✨ Features

### 🔐 Authentication
- User registration and login
- Password hashing with bcrypt
- Session-based authentication
- Protected routes
- Login/logout functionality

### 👤 User Profiles
- User profile pages
- Display name
- Bio
- Profile image
- Member information
- Post and comment statistics

### 📝 Blog Posts
- Create posts
- View posts
- Edit posts
- Delete posts
- Post ownership controls
- Categories
- Search
- Pagination

### 💬 Comments
- Add comments
- Edit comments
- Delete comments
- Comment ownership controls

### ❤️ Likes
- Like posts
- Unlike posts
- Display post like counts

### 🤝 Friendships
- Send friend requests
- Accept friend requests
- Reject friend requests
- View friends
- Friendship status management

### 💌 Private Messaging
- Private conversations between users
- Send messages
- Read/unread message tracking
- Unread message counts
- Socket.IO integration for real-time communication

### 🖼️ Image Uploads
- Cloudinary image storage
- Multer file handling
- JPEG, PNG, GIF, and WebP support
- Maximum upload size of 5 MB
- Profile image uploads
- Blog post image uploads

### ☁️ Deployment
- Deployed on Render
- PostgreSQL database hosted with Neon
- Cloudinary used for production image storage
- Environment variables used for sensitive configuration

## 🛠️ Tech Stack

### Backend
- Node.js
- Express.js
- PostgreSQL
- `pg`
- Socket.IO

### Frontend
- EJS
- HTML5
- CSS3
- JavaScript

### Authentication & Security
- bcrypt
- express-session
- Environment variables with dotenv
- Server-side authorization and ownership checks

### File & Image Management
- Multer
- Cloudinary

### Deployment & Infrastructure
- Render
- Neon PostgreSQL
- Cloudinary

## 🗄️ Database

The application uses PostgreSQL with seven main tables:

- `users`
- `categories`
- `posts`
- `comments`
- `likes`
- `friendships`
- `messages`

The complete database structure, relationships, constraints, indexes, and schema evolution are documented in:

`DATABASE_SCHEMA.md`

## 📁 Project Structure

```text
blog-capstone/
│
├── public/
│   ├── styles/
│   │   └── main.css
│   └── uploads/
│
├── views/
│   ├── partials/
│   │   ├── footer.ejs
│   │   └── header.ejs
│   │
│   ├── chat.ejs
│   ├── create.ejs
│   ├── edit-comment.ejs
│   ├── edit-profile.ejs
│   ├── edit.ejs
│   ├── friends.ejs
│   ├── index.ejs
│   ├── login.ejs
│   ├── post.ejs
│   ├── profile.ejs
│   └── register.ejs
│
├── add-friendships-table.js
├── add-messages-table.js
├── add-profile-columns.js
├── database-pg.js
├── DATABASE_SCHEMA.md
├── index.js
├── package-lock.json
├── package.json
├── .gitignore
└── README.md

⚙️ Installation
1. Clone the repository
git clone https://github.com/kelsbaba/blog-capstone.git
2. Enter the project directory
cd blog-capstone
3. Install dependencies
npm install
4. Configure environment variables

Create a .env file in the project root:

DATABASE_URL=your_database_connection_string

CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

SESSION_SECRET=your_session_secret

Never commit the .env file to GitHub.

5. Start the application
npm start

The application will start using the command defined in package.json.

🔒 Security

Sensitive configuration is stored using environment variables rather than hard-coded directly into the application source code.

The .env file is excluded from version control through .gitignore.

The application also implements authentication and authorization checks for protected functionality such as post and comment ownership.

📚 Database Documentation

For the complete PostgreSQL database structure and schema evolution history, see:

DATABASE_SCHEMA.md

👨‍💻 Author

Kelly Sunday Esegine

Software Engineer | Java Developer | Backend & Full-Stack Developer

GitHub:
https://github.com/kelsbaba

📄 License

ISC
