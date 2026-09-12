# 📝 My Blog

A simple and responsive blog web application built with
Node.js, Express, EJS, and SQLite.

This project allows users to create, read, update,
and delete blog posts.

## 🚀 Features

- Create new blog posts
- View all blog posts
- View individual blog posts
- Edit existing blog posts
- Delete blog posts
- SQLite database storage
- Data persistence after server restart
- Responsive design
- Form validation
- Invalid post ID handling

## 🛠️ Technologies Used

### Frontend

- HTML5
- CSS3
- EJS

### Backend

- Node.js
- Express.js

### Database

- SQLite
- better-sqlite3

### Module System

- ES Modules

## 📁 Project Structure

blog-capstone/

├── server.js
├── database.js
├── package.json
├── package-lock.json
├── README.md
├── blog.db
│
├── public/
│   └── styles/
│       └── main.css
│
└── views/
    ├── index.ejs
    ├── create.ejs
    ├── post.ejs
    ├── edit.ejs
    │
    └── partials/
        ├── header.ejs
        └── footer.ejs

## ⚙️ Installation

### 1. Clone the repository

```bash
git clone YOUR_GITHUB_REPOSITORY_URL

2. Navigate into the project
cd blog-capstone
3. Install dependencies
npm install
4. Start the server
node server.js
5. Open the application

Visit:

http://localhost:3000

📝 How to Use
Create a Post
Click "Create Post".
Enter the title.
Enter the author name.
Write your content.
Click "Publish Post".
Read a Post

Click "Read More" on any blog post.

Edit a Post
Open a blog post.
Click "Edit Post".
Update the information.
Click "Update Post".
Delete a Post
Open a blog post.
Click "Delete Post".
Confirm deletion.
🗄️ Database

The application uses SQLite to store blog posts.

Each post contains:

ID
Title
Content
Author
Date

Posts remain available after restarting
the server.

🧪 Testing

The following operations have been tested:

Create post
Read post
Update post
Delete post
Database persistence
Form validation
Invalid post IDs

All CRUD operations passed successfully.

🔮 Future Improvements
User authentication
Comments
Categories
Search functionality
Pagination
Image uploads
Deployment
👨‍💻 Author

Kelly Sunday Esegine

📄 License

This project is licensed under the ISC License.