import express from "express";
import bcrypt from "bcrypt";
import session from "express-session";
import db from "./database.js";

const app = express();
const port = 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

// Session middleware
app.use(
    session({
        secret: "blog-capstone-secret",
        resave: false,
        saveUninitialized: false
    })
);

// Make logged-in user available to all EJS views

app.use((req, res, next) => {
    res.locals.currentUser = req.session.user || null;

    next();
});

app.set("view engine", "ejs");

// Authentication middleware

function requireLogin(req, res, next) {

    if (!req.session.user) {
        return res.redirect("/login");
    }

    next();

}

// Validate post ID
function isValidPostId(id) {
    return Number.isInteger(id) && id > 0;
}

// Check whether the logged-in user owns the post
function isPostOwner(req, post) {
    return post.user_id === req.session.user.id;
}

// Post database queries
const getAllPosts = db.prepare(`
    SELECT * FROM posts
    ORDER BY id DESC
`);

const getPostById = db.prepare(`
    SELECT * FROM posts
    WHERE id = ?
`);

const createPost = db.prepare(`
    INSERT INTO posts (title, content, author, date, user_id)
    VALUES (?, ?, ?, ?, ?)
`);

const updatePost = db.prepare(`
    UPDATE posts
    SET title = ?, content = ?, author = ?
    WHERE id = ?
`);

const deletePost = db.prepare(`
    DELETE FROM posts
    WHERE id = ?
`);

// User database queries

const createUser = db.prepare(`
    INSERT INTO users (username, email, password_hash, created_at)
    VALUES (?, ?, ?, ?)
`);

const getUserByUsername = db.prepare(`
    SELECT * FROM users
    WHERE username = ?
`);

const getUserByEmail = db.prepare(`
    SELECT * FROM users
    WHERE email = ?
`);

// Show registration form

app.get("/register", (req, res) => {
    res.render("register.ejs");
});

// Show login form

app.get("/login", (req, res) => {
    res.render("login.ejs");
});


// Login user

app.post("/login", async (req, res) => {

    const { email, password } = req.body;

    // Validate fields

    if (
        !email?.trim() ||
        !password?.trim()
    ) {
        return res.send("Email and password are required.");
    }

    // Find user by email

    const user = getUserByEmail.get(email);

    if (!user) {
        return res.send("Invalid email or password.");
    }

    // Compare password with stored hash

    const passwordMatch = await bcrypt.compare(
        password,
        user.password_hash
    );

    if (!passwordMatch) {
        return res.send("Invalid email or password.");
    }

    // Create session

    req.session.user = {
        id: user.id,
        username: user.username,
        email: user.email
    };

    // Redirect to homepage

    res.redirect("/");

});


// Logout user

app.post("/logout", (req, res) => {

    req.session.destroy((err) => {

        if (err) {
            return res.send("Could not log out.");
        }

        res.redirect("/");

    });

});


// Register new user

app.post("/register", async (req, res) => {

    const { username, email, password } = req.body;

    // Validate fields

    if (
        !username?.trim() ||
        !email?.trim() ||
        !password?.trim()
    ) {
        return res.send("All fields are required.");
    }

    // Check if username already exists

    const existingUsername = getUserByUsername.get(username);

    if (existingUsername) {
        return res.send("Username already exists.");
    }

    // Check if email already exists

    const existingEmail = getUserByEmail.get(email);

    if (existingEmail) {
        return res.send("Email already exists.");
    }

    // Hash password

    const passwordHash = await bcrypt.hash(password, 10);

    // Registration date

    const createdAt = new Date().toISOString();

    // Save user

    createUser.run(
        username,
        email,
        passwordHash,
        createdAt
    );

    // Redirect to login

    res.redirect("/login");

});

// Homepage
app.get("/", (req, res) => {
    const posts = getAllPosts.all();

    res.render("index.ejs", {
        posts: posts
    });
});

// Show create post form
app.get("/create", requireLogin, (req, res) => {
    res.render("create.ejs");
});

// Create new post
app.post("/create", requireLogin, (req, res) => {
    const { title, content } = req.body;

   if (
    !title?.trim() ||
    !content?.trim() 
) {
    return res.send("All fields are required.");
}

    const author = req.session.user.username;

    const date = new Date().toLocaleDateString();

    const userId = req.session.user.id;

    createPost.run(title, content, author, date, userId);

    res.redirect("/");
});

// View single post
app.get("/post/:id", (req, res) => {
    const postId = Number(req.params.id);

    if (!isValidPostId(postId)) {
        return res.status(404).send("Post not found");
    }

    const post = getPostById.get(postId);

    if (!post) {
        return res.status(404).send("Post not found");
    }

    res.render("post.ejs", {
        post: post
    });
});

// Show edit form
app.get("/edit/:id", requireLogin, (req, res) => {
    const postId = Number(req.params.id);

    if (!isValidPostId(postId)) {
        return res.status(404).send("Post not found");
    }

    const post = getPostById.get(postId);

    if (!post) {
        return res.status(404).send("Post not found");
    }


    if (!isPostOwner(req, post)) {
        return res.status(403).send("You can only edit your own posts.");
    }


    res.render("edit.ejs", {
        post: post
    });
});

// Update post
app.post("/edit/:id", requireLogin, (req, res) => {
    const postId = Number(req.params.id);

    if (!isValidPostId(postId)) {
        return res.status(404).send("Post not found");
    }

    const { title, content } = req.body;

    if (
        !title?.trim() ||
        !content?.trim()
    ) {
        return res.send("All fields are required.");
    }

    const post = getPostById.get(postId);

    if (!post) {
        return res.status(404).send("Post not found");
    }

       if (!isPostOwner(req, post)) {
        return res.status(403).send("You can only update your own posts.");
    }

    const author = req.session.user.username;

    updatePost.run(title, content, author, postId);

    res.redirect(`/post/${postId}`);
});

// Delete post
app.post("/delete/:id", requireLogin, (req, res) => {
    const postId = Number(req.params.id);

    if (!isValidPostId(postId)) {
        return res.status(404).send("Post not found");
    }

    const post = getPostById.get(postId);

    if (!post) {
        return res.status(404).send("Post not found");
    }

       if (!isPostOwner(req, post)) {
        return res.status(403).send("You can only delete your own posts.");
    }

    deletePost.run(postId);

    res.redirect("/");
});

// Start server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

