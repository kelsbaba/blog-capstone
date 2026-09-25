import express from "express";
import bcrypt from "bcrypt";
import session from "express-session";
import db from "./database.js";
import multer from "multer";

const app = express();
const port = 3000;

// =========================
// Image Upload Configuration
// =========================

const storage = multer.diskStorage({

    destination: (req, file, cb) => {
        cb(null, "public/uploads/");
    },

    filename: (req, file, cb) => {

        const uniqueName =
            Date.now() +
            "-" +
            file.originalname.replace(/\s+/g, "-");

        cb(null, uniqueName);
    }

});

const upload = multer({
    storage: storage,

    fileFilter: (req, file, cb) => {

        const allowedTypes = [
            "image/jpeg",
            "image/png",
            "image/gif",
            "image/webp"
        ];

        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error("Only JPEG, PNG, GIF, and WebP images are allowed"));
        }
    },

    limits: {
        fileSize: 5 * 1024 * 1024
    }
});

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

// Check whether the user can delete a comment
function canDeleteComment(req, comment, post) {

    const userId = req.session.user.id;

    const isCommentAuthor =
        comment.user_id === userId;

    const isPostOwner =
        post.user_id === userId;

    return isCommentAuthor || isPostOwner;

}

// Post database queries
const getAllPosts = db.prepare(`
    SELECT
        posts.*,
        categories.name AS category_name
    FROM posts
    LEFT JOIN categories
        ON posts.category_id = categories.id
    ORDER BY posts.id DESC
`);

const getPostsPaginated = db.prepare(`
    SELECT
        posts.*,
        categories.name AS category_name
    FROM posts
    LEFT JOIN categories
        ON posts.category_id = categories.id
    ORDER BY posts.id DESC
    LIMIT ? OFFSET ?
`);

const getTotalPosts = db.prepare(`
    SELECT COUNT(*) AS count
    FROM posts
`);

const searchPosts = db.prepare(`
    SELECT
        posts.*,
        categories.name AS category_name
    FROM posts
    LEFT JOIN categories
        ON posts.category_id = categories.id
    WHERE
        posts.title LIKE ?
        OR posts.content LIKE ?
        OR posts.author LIKE ?
        OR categories.name LIKE ?
    ORDER BY posts.id DESC
`);

const getPostsByCategory = db.prepare(`
    SELECT
        posts.*,
        categories.name AS category_name
    FROM posts
    LEFT JOIN categories
        ON posts.category_id = categories.id
    WHERE posts.category_id = ?
    ORDER BY posts.id DESC
`);

const getPostsByCategoryPaginated = db.prepare(`
    SELECT
        posts.*,
        categories.name AS category_name
    FROM posts
    LEFT JOIN categories
        ON posts.category_id = categories.id
    WHERE posts.category_id = ?
    ORDER BY posts.id DESC
    LIMIT ? OFFSET ?
`);

const getTotalPostsByCategory = db.prepare(`
    SELECT COUNT(*) AS count
    FROM posts
    WHERE category_id = ?
`);

const getPostById = db.prepare(`
    SELECT
        posts.*,
        categories.name AS category_name
    FROM posts
    LEFT JOIN categories
        ON posts.category_id = categories.id
    WHERE posts.id = ?
`);

const createPost = db.prepare(`
    INSERT INTO posts (title, content, author, date, user_id, category_id, image)
    VALUES (?, ?, ?, ?, ?, ?, ?)
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

// Comment database queries

const getCommentsByPostId = db.prepare(`
    SELECT * FROM comments
    WHERE post_id = ?
    ORDER BY id ASC
`);

const getCommentById = db.prepare(`
    SELECT *
    FROM comments
    WHERE id = ?
`);

const createComment = db.prepare(`
    INSERT INTO comments (
        content,
        post_id,
        user_id,
        author,
        date
    )
    VALUES (?, ?, ?, ?, ?)
`);

const deleteComment = db.prepare(`
    DELETE FROM comments
    WHERE id = ?
`);

const updateComment = db.prepare(`
    UPDATE comments
    SET content = ?
    WHERE id = ?
`);


// =========================
// Like Queries
// =========================

const getLike = db.prepare(`
    SELECT *
    FROM likes
    WHERE post_id = ? AND user_id = ?
`);

const createLike = db.prepare(`
    INSERT INTO likes (
        post_id,
        user_id
    )
    VALUES (?, ?)
`);

const deleteLike = db.prepare(`
    DELETE FROM likes
    WHERE post_id = ? AND user_id = ?
`);

const getLikeCount = db.prepare(`
    SELECT COUNT(*) AS count
    FROM likes
    WHERE post_id = ?
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


// Category database queries

const getAllCategories = db.prepare(`
    SELECT * FROM categories
    ORDER BY name ASC
`);

const getUserProfile = db.prepare(`
    SELECT
        users.id,
        users.username,
        users.email,
        users.created_at,
        COUNT(DISTINCT posts.id) AS post_count,
        COUNT(DISTINCT comments.id) AS comment_count
    FROM users
    LEFT JOIN posts
        ON users.id = posts.user_id
    LEFT JOIN comments
        ON users.id = comments.user_id
    WHERE users.id = ?
    GROUP BY users.id
`);

const getUserPosts = db.prepare(`
    SELECT
        posts.*,
        categories.name AS category_name
    FROM posts
    LEFT JOIN categories
        ON posts.category_id = categories.id
    WHERE posts.user_id = ?
    ORDER BY posts.id DESC
`);

const getCategoryById = db.prepare(`
    SELECT * FROM categories
    WHERE id = ?
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


// Show posts by category
app.get("/category/:id", (req, res) => {
    const categoryId = Number(req.params.id);

    if (!Number.isInteger(categoryId) || categoryId <= 0) {
        return res.status(404).send("Category not found");
    }

    const category = getCategoryById.get(categoryId);

    if (!category) {
        return res.status(404).send("Category not found");
    }

    const postsPerPage = 6;

    const page = Math.max(
        1,
        Number.parseInt(req.query.page, 10) || 1
    );

    const totalPosts = getTotalPostsByCategory.get(categoryId).count;

    const totalPages = Math.ceil(totalPosts / postsPerPage);

    const currentPage = Math.min(
        page,
        Math.max(totalPages, 1)
    );

    const offset = (currentPage - 1) * postsPerPage;

    const posts = getPostsByCategoryPaginated.all(
        categoryId,
        postsPerPage,
        offset
    );

    const categories = getAllCategories.all();

    res.render("index.ejs", {
        posts: posts,
        categories: categories,
        selectedCategory: category,
        searchTerm: null,
        currentPage: currentPage,
        totalPages: totalPages,
        categoryId: categoryId
    });
});



// Homepage
app.get("/", (req, res) => {
    const postsPerPage = 6;

    const page = Math.max(
        1,
        Number.parseInt(req.query.page, 10) || 1
    );

    const totalPosts = getTotalPosts.get().count;

    const totalPages = Math.ceil(totalPosts / postsPerPage);

    const currentPage = Math.min(page, Math.max(totalPages, 1));

    const offset = (currentPage - 1) * postsPerPage;

    const posts = getPostsPaginated.all(
        postsPerPage,
        offset
    );

    const categories = getAllCategories.all();

    res.render("index.ejs", {
        posts: posts,
        categories: categories,
        selectedCategory: null,
        searchTerm: null,
        currentPage: currentPage,
        totalPages: totalPages,
        categoryId: null
    });
});

// Show create post form
app.get("/create", requireLogin, (req, res) => {
    const categories = getAllCategories.all();

    res.render("create.ejs", {
        categories: categories
    });
    
});

// Create new post
app.post("/create",
     requireLogin,
     upload.single("image"),
      (req, res) => {
    const { title, content, category_id } = req.body;

   if (
    !title?.trim() ||
    !content?.trim() ||
    !category_id
) {
    return res.send("All fields are required.");
}

    const categoryId = Number(category_id);

    if (!Number.isInteger(categoryId) || categoryId <= 0){
        return res.send("Invalid category selected.");
    }

    const category = getCategoryById.get(categoryId);

    if (!category) {
        return res.send("Selected category does not exist.");
    }



    const author = req.session.user.username;

    const date = new Date().toLocaleDateString();

    const userId = req.session.user.id;

    const image = req.file
    ? `/uploads/${req.file.filename}`
    : null;

    createPost.run(title.trim(), content.trim(), author, date, userId, categoryId, image);

    res.redirect("/");
});

app.get("/search", (req, res) => {
    const searchTerm = req.query.q?.trim() || "";

    if (!searchTerm) {
        return res.redirect("/");
    }

    const postsPerPage = 6;

    const page = Math.max(
        1,
        Number.parseInt(req.query.page, 10) || 1
    );

    const searchPattern = `%${searchTerm}%`;

    const totalPosts = db.prepare(`
        SELECT COUNT(*) AS count
        FROM posts
        LEFT JOIN categories
            ON posts.category_id = categories.id
        WHERE
            posts.title LIKE ?
            OR posts.content LIKE ?
            OR posts.author LIKE ?
            OR categories.name LIKE ?
    `).get(
        searchPattern,
        searchPattern,
        searchPattern,
        searchPattern
    ).count;

    const totalPages = Math.ceil(totalPosts / postsPerPage);

    const currentPage = Math.min(
        page,
        Math.max(totalPages, 1)
    );

    const offset = (currentPage - 1) * postsPerPage;

    const posts = db.prepare(`
        SELECT
            posts.*,
            categories.name AS category_name
        FROM posts
        LEFT JOIN categories
            ON posts.category_id = categories.id
        WHERE
            posts.title LIKE ?
            OR posts.content LIKE ?
            OR posts.author LIKE ?
            OR categories.name LIKE ?
        ORDER BY posts.id DESC
        LIMIT ? OFFSET ?
    `).all(
        searchPattern,
        searchPattern,
        searchPattern,
        searchPattern,
        postsPerPage,
        offset
    );

    const categories = getAllCategories.all();

    res.render("index.ejs", {
        posts: posts,
        categories: categories,
        selectedCategory: null,
        searchTerm: searchTerm,
        currentPage: currentPage,
        totalPages: totalPages,
        categoryId: null
    });
});


// Profile route 
app.get("/profile/:id", (req, res) => {
    const userId = Number(req.params.id);

    if (!Number.isInteger(userId) || userId <= 0) {
        return res.status(404).send("User not found");
    }

    const profile = getUserProfile.get(userId);

    if (!profile) {
        return res.status(404).send("User not found");
    }

    const posts = getUserPosts.all(userId);

    res.render("profile.ejs", {
        profile: profile,
        posts: posts
    });
});

// Edit comment route 
app.get("/comment/:id/edit", requireLogin, (req, res) => {
    const commentId = Number(req.params.id);

    if (!Number.isInteger(commentId) || commentId <= 0) {
        return res.status(404).send("Comment not found");
    }

    const comment = getCommentById.get(commentId);

    if (!comment) {
        return res.status(404).send("Comment not found");
    }

    if (comment.user_id !== req.session.user.id) {
        return res.status(403).send("You are not allowed to edit this comment");
    }

    res.render("edit-comment.ejs", {
        comment: comment
    });
});

app.post("/comment/:id/edit", requireLogin, (req, res) => {
    const commentId = Number(req.params.id);
    const content = req.body.content?.trim();

    if (!Number.isInteger(commentId) || commentId <= 0) {
        return res.status(404).send("Comment not found");
    }

    if (!content) {
        return res.status(400).send("Comment cannot be empty");
    }

    const comment = getCommentById.get(commentId);

    if (!comment) {
        return res.status(404).send("Comment not found");
    }

    if (comment.user_id !== req.session.user.id) {
        return res.status(403).send("You are not allowed to edit this comment");
    }

    updateComment.run(content, commentId);

    res.redirect(`/post/${comment.post_id}`);
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

    //Get comments for the post
    const comments = getCommentsByPostId.all(postId);

    // Get total likes for the post
    const likeCount = getLikeCount.get(postId).count;

    let userHasLiked = false;

    if (req.session.user) {
        userHasLiked = !!getLike.get(
            postId,
            req.session.user.id
        );
    }

    res.render("post.ejs", {
        post: post,
        comments: comments,
        likeCount: likeCount,
        userHasLiked: userHasLiked

    });
});

// Add new comment
app.post("/post/:id/comments", requireLogin, (req, res) => {

    const postId = Number(req.params.id);

    // Validate post ID
    if (!isValidPostId(postId)) {
        return res.status(404).send("Post not found");
    }

    // Check if post exists
    const post = getPostById.get(postId);

    if (!post) {
        return res.status(404).send("Post not found");
    }

    // Get comment content
    const { content } = req.body;

    // Validate comment
    if (!content?.trim()) {
        return res.send("Comment cannot be empty.");
    }

    // Get logged-in user information
    const userId = req.session.user.id;
    const author = req.session.user.username;

    // Comment date
    const date = new Date().toLocaleDateString();

    // Save comment
    createComment.run(
        content.trim(),
        postId,
        userId,
        author,
        date
    );

    // Redirect back to post
    res.redirect(`/post/${postId}`);

});

// =========================
// Like / Unlike Post
// =========================

app.post("/post/:id/like", requireLogin, (req, res) => {

    const postId = Number(req.params.id);
    const userId = req.session.user.id;

    // Validate post ID
    if (!Number.isInteger(postId) || postId <= 0) {
        return res.status(404).send("Post not found");
    }

    // Check that the post exists
    const post = getPostById.get(postId);

    if (!post) {
        return res.status(404).send("Post not found");
    }

    // Check whether the user already liked the post
    const existingLike = getLike.get(postId, userId);

    if (existingLike) {

        // Unlike the post
        deleteLike.run(postId, userId);

    } else {

        // Like the post
        createLike.run(postId, userId);

    }

    // Return to the post
    res.redirect(`/post/${postId}`);
});


// Delete comment
app.post("/comments/:id/delete", requireLogin, (req, res) => {

    const commentId = Number(req.params.id);

    // Validate comment ID
    if (!Number.isInteger(commentId) || commentId <= 0) {
        return res.status(404).send("Comment not found");
    }

    // Get the comment
    const comment = db.prepare(`
        SELECT * FROM comments
        WHERE id = ?
    `).get(commentId);

    if (!comment) {
        return res.status(404).send("Comment not found");
    }

    // Get the post belonging to the comment
    const post = getPostById.get(comment.post_id);

    if (!post) {
        return res.status(404).send("Post not found");
    }

    // Check permission
    if (!canDeleteComment(req, comment, post)) {
        return res.status(403).send(
            "You can only delete your own comments or comments on your own posts."
        );
    }

    // Delete comment
    deleteComment.run(commentId);

    // Redirect back to the post
    res.redirect(`/post/${comment.post_id}`);

});

// Show edit post form
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

    const categories = getAllCategories.all();

    res.render("edit.ejs", {
        post: post,
        categories: categories
    });
});


// Update existing post
app.post("/edit/:id", requireLogin,
    upload.single("image"),
     (req, res) => {
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

    const { title, content, category_id } = req.body;

    if (
        !title?.trim() ||
        !content?.trim() ||
        !category_id
    ) {
        return res.send("All fields are required.");
    }

    const categoryId = Number(category_id);

    if (!Number.isInteger(categoryId) || categoryId <= 0) {
        return res.send("Invalid category selected.");
    }

    const category = getCategoryById.get(categoryId);

    if (!category) {
        return res.send("Selected category does not exist.");
    }

     // Keep existing image if no new image was selected
        const image = req.file
            ? `/uploads/${req.file.filename}`
            : post.image;

    const updatePost = db.prepare(`
        UPDATE posts
        SET
            title = ?,
            content = ?,
            category_id = ?,
            image = ?
        WHERE id = ?
    `);

    updatePost.run(
        title.trim(),
        content.trim(),
        categoryId,
        image,
        postId
    );

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

