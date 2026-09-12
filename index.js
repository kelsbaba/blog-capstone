import express from "express";
import db from "./database.js";

const app = express();
const port = 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

app.set("view engine", "ejs");

// Validate post ID
function isValidPostId(id) {
    return Number.isInteger(id) && id > 0;
}

// Database queries
const getAllPosts = db.prepare(`
    SELECT * FROM posts
    ORDER BY id DESC
`);

const getPostById = db.prepare(`
    SELECT * FROM posts
    WHERE id = ?
`);

const createPost = db.prepare(`
    INSERT INTO posts (title, content, author, date)
    VALUES (?, ?, ?, ?)
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

// Homepage
app.get("/", (req, res) => {
    const posts = getAllPosts.all();

    res.render("index.ejs", {
        posts: posts
    });
});

// Show create post form
app.get("/create", (req, res) => {
    res.render("create.ejs");
});

// Create new post
app.post("/create", (req, res) => {
    const { title, content, author } = req.body;

   if (
    !title?.trim() ||
    !content?.trim() ||
    !author?.trim()
) {
    return res.send("All fields are required.");
}

    const date = new Date().toLocaleDateString();

    createPost.run(title, content, author, date);

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
app.get("/edit/:id", (req, res) => {
    const postId = Number(req.params.id);

    if (!isValidPostId(postId)) {
        return res.status(404).send("Post not found");
    }

    const post = getPostById.get(postId);

    if (!post) {
        return res.status(404).send("Post not found");
    }

    res.render("edit.ejs", {
        post: post
    });
});

// Update post
app.post("/edit/:id", (req, res) => {
    const postId = Number(req.params.id);

    if (!isValidPostId(postId)) {
        return res.status(404).send("Post not found");
    }

    const { title, content, author } = req.body;

    if (
        !title?.trim() ||
        !content?.trim() ||
        !author?.trim()
    ) {
        return res.send("All fields are required.");
    }

    const post = getPostById.get(postId);

    if (!post) {
        return res.status(404).send("Post not found");
    }

    updatePost.run(title, content, author, postId);

    res.redirect(`/post/${postId}`);
});

// Delete post
app.post("/delete/:id", (req, res) => {
    const postId = Number(req.params.id);

    if (!isValidPostId(postId)) {
        return res.status(404).send("Post not found");
    }

    const post = getPostById.get(postId);

    if (!post) {
        return res.status(404).send("Post not found");
    }

    deletePost.run(postId);

    res.redirect("/");
});

// Start server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});