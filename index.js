import "dotenv/config";
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import bcrypt from "bcrypt";
import session from "express-session";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import {
  createUser,
  getUserByUsername,
  getUserByEmail,
  getUserById,
  updateUserProfile,
  getAllCategories,
  getCategoryById,
  getPostsPaginated,
  getTotalPosts,
  getPostsByCategoryPaginated,
  getTotalPostsByCategory,
  getTotalSearchPosts,
  searchPostsPaginated,
  createPost,
  createComment,
  getPostById,
  getCommentById,
  getCommentsByPostId,
  getLikeCount,
  getLike,
  updateComment,
  updatePost,
  deleteComment,
  createLike,
  deleteLike,
  getUserProfile,
  getUserPosts,
  deletePost,
  sendFriendRequest,
  getFriendStatus,
  getPendingFriendRequests,
  acceptFriendRequest,
  rejectFriendRequest,
  getFriends,
  getConversation,
  markMessagesAsRead,
  getUnreadMessageCount,
  getUnreadMessageCountsBySender,
  createMessage,
} from "./database-pg.js";

const app = express();
const port = process.env.PORT || 3000;

// =========================
// Image Upload Configuration
// =========================

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,

  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only JPEG, PNG, GIF, and WebP images are allowed"));
    }
  },

  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

// Session middleware
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
  }),
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

  const isCommentAuthor = comment.user_id === userId;

  const isPostOwner = post.user_id === userId;

  return isCommentAuthor || isPostOwner;
}

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

  if (!email?.trim() || !password?.trim()) {
    return res.send("Email and password are required.");
  }

  // Find user by email

  const user = await getUserByEmail(email);

  if (!user) {
    return res.send("Invalid email or password.");
  }

  // Compare password with stored hash

  const passwordMatch = await bcrypt.compare(password, user.password_hash);

  if (!passwordMatch) {
    return res.send("Invalid email or password.");
  }

  // Create session

  req.session.user = {
    id: user.id,
    username: user.username,
    email: user.email,
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

  if (!username?.trim() || !email?.trim() || !password?.trim()) {
    return res.send("All fields are required.");
  }

  // Check if username already exists

  const existingUsername = await getUserByUsername(username);

  if (existingUsername) {
    return res.send("Username already exists.");
  }

  // Check if email already exists

  const existingEmail = await getUserByEmail(email);

  if (existingEmail) {
    return res.send("Email already exists.");
  }

  // Hash password

  const passwordHash = await bcrypt.hash(password, 10);

  // Registration date

  const createdAt = new Date().toISOString();

  // Save user

  await createUser(username, email, passwordHash, createdAt);

  // Redirect to login

  res.redirect("/login");
});

// Show posts by category
app.get("/category/:id", async (req, res) => {
  const categoryId = Number(req.params.id);

  if (!Number.isInteger(categoryId) || categoryId <= 0) {
    return res.status(404).send("Category not found");
  }

  const category = await getCategoryById(categoryId);

  if (!category) {
    return res.status(404).send("Category not found");
  }

  const postsPerPage = 6;

  const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);

  const totalPosts = await getTotalPostsByCategory(categoryId);

  const totalPages = Math.ceil(totalPosts / postsPerPage);

  const currentPage = Math.min(page, Math.max(totalPages, 1));

  const offset = (currentPage - 1) * postsPerPage;

  const posts = await getPostsByCategoryPaginated(
    categoryId,
    postsPerPage,
    offset,
  );

  const categories = await getAllCategories();

  res.render("index.ejs", {
    posts: posts,
    categories: categories,
    selectedCategory: category,
    searchTerm: null,
    currentPage: currentPage,
    totalPages: totalPages,
    categoryId: categoryId,
  });
});

// Homepage
app.get("/", async (req, res) => {
  const postsPerPage = 6;

  const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);

  const totalPosts = await getTotalPosts();

  const totalPages = Math.ceil(totalPosts / postsPerPage);

  const currentPage = Math.min(page, Math.max(totalPages, 1));

  const offset = (currentPage - 1) * postsPerPage;

  const posts = await getPostsPaginated(postsPerPage, offset);

  const categories = await getAllCategories();

  res.render("index.ejs", {
    posts: posts,
    categories: categories,
    selectedCategory: null,
    searchTerm: null,
    currentPage: currentPage,
    totalPages: totalPages,
    categoryId: null,
  });
});

// Show create post form
app.get("/create", requireLogin, async (req, res) => {
  const categories = await getAllCategories();

  res.render("create.ejs", {
    categories: categories,
  });
});

// Create new post
app.post("/create", requireLogin, upload.single("image"), async (req, res) => {
  const { title, content, category_id } = req.body;

  if (!title?.trim() || !content?.trim() || !category_id) {
    return res.send("All fields are required.");
  }

  const categoryId = Number(category_id);

  if (!Number.isInteger(categoryId) || categoryId <= 0) {
    return res.send("Invalid category selected.");
  }

  const category = await getCategoryById(categoryId);

  if (!category) {
    return res.send("Selected category does not exist.");
  }
  const author = req.session.user.username;

  const date = new Date().toLocaleDateString();

  const userId = req.session.user.id;

  let image = null;

  if (req.file) {
    const result = await cloudinary.uploader.upload(
      `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`,
      {
        folder: "blog-capstone",
      },
    );

    image = result.secure_url;
  }
  await createPost(
    title.trim(),
    content.trim(),
    author,
    date,
    userId,
    categoryId,
    image,
  );

  res.redirect("/");
});

// Search posts
app.get("/search", async (req, res) => {
  const searchTerm = req.query.q?.trim() || "";

  if (!searchTerm) {
    return res.redirect("/");
  }

  const postsPerPage = 6;

  const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);

  const searchPattern = `%${searchTerm}%`;

  // Get total matching posts
  const totalPosts = await getTotalSearchPosts(searchPattern);

  const totalPages = Math.ceil(totalPosts / postsPerPage);

  const currentPage = Math.min(page, Math.max(totalPages, 1));

  const offset = (currentPage - 1) * postsPerPage;

  // Get posts for the current page
  const posts = await searchPostsPaginated(searchPattern, postsPerPage, offset);

  const categories = await getAllCategories();

  res.render("index.ejs", {
    posts: posts,
    categories: categories,
    selectedCategory: null,
    searchTerm: searchTerm,
    currentPage: currentPage,
    totalPages: totalPages,
    categoryId: null,
  });
});

// =========================
// Edit Profile
// =========================

app.get("/profile/edit", requireLogin, async (req, res) => {
  try {
    const user = await getUserById(req.session.user.id);

    if (!user) {
      return res.status(404).send("User not found");
    }

    res.render("edit-profile.ejs", { user });
  } catch (error) {
    console.error("Error loading edit profile:", error);
    res.status(500).send("Unable to load edit profile");
  }
});

app.post(
  "/profile/edit",
  requireLogin,
  upload.single("image"),
  async (req, res) => {
    try {
      const { displayName, bio } = req.body;

      let profileImage = req.body.currentProfileImage || null;

      // Upload new profile picture to Cloudinary
      if (req.file) {
        const result = await cloudinary.uploader.upload(
          `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`,
          {
            folder: "blog-capstone/profiles",
          },
        );

        profileImage = result.secure_url;
      }

      await updateUserProfile(
        req.session.user.id,
        displayName,
        bio,
        profileImage,
      );

      res.redirect(`/profile/${req.session.user.id}`);
    } catch (error) {
      console.error("Error updating profile:", error);

      res.status(500).send("Unable to update profile");
    }
  },
);

// Profile route
app.get("/profile/:id", async (req, res) => {
  const userId = Number(req.params.id);

  if (!Number.isInteger(userId) || userId <= 0) {
    return res.status(404).send("User not found");
  }

  const profile = await getUserProfile(userId);

  if (!profile) {
    return res.status(404).send("User not found");
  }

  const posts = await getUserPosts(userId);

  let friendStatus = null;

  if (req.session.user && req.session.user.id !== userId) {
    friendStatus = await getFriendStatus(req.session.user.id, userId);
  }

  res.render("profile.ejs", {
    profile: profile,
    posts: posts,
    friendStatus
  });
});

// Edit comment route
app.get("/comment/:id/edit", requireLogin, async (req, res) => {
  const commentId = Number(req.params.id);

  if (!Number.isInteger(commentId) || commentId <= 0) {
    return res.status(404).send("Comment not found");
  }

  const comment = await getCommentById(commentId);

  if (!comment) {
    return res.status(404).send("Comment not found");
  }

  if (comment.user_id !== req.session.user.id) {
    return res.status(403).send("You are not allowed to edit this comment");
  }

  res.render("edit-comment.ejs", {
    comment: comment,
  });
});

app.post("/comment/:id/edit", requireLogin, async (req, res) => {
  const commentId = Number(req.params.id);
  const content = req.body.content?.trim();

  if (!Number.isInteger(commentId) || commentId <= 0) {
    return res.status(404).send("Comment not found");
  }

  if (!content) {
    return res.status(400).send("Comment cannot be empty");
  }

  const comment = await getCommentById(commentId);

  if (!comment) {
    return res.status(404).send("Comment not found");
  }

  if (comment.user_id !== req.session.user.id) {
    return res.status(403).send("You are not allowed to edit this comment");
  }

  await updateComment(content, commentId);

  res.redirect(`/post/${comment.post_id}`);
});

// View single post
app.get("/post/:id", async (req, res) => {
  const postId = Number(req.params.id);

  if (!isValidPostId(postId)) {
    return res.status(404).send("Post not found");
  }

  const post = await getPostById(postId);

  if (!post) {
    return res.status(404).send("Post not found");
  }

  //Get comments for the post
  const comments = await getCommentsByPostId(postId);

  // Get total likes for the post
  const likeCount = await getLikeCount(postId);

  let userHasLiked = false;

  if (req.session.user) {
    userHasLiked = !!(await getLike(postId, req.session.user.id));
  }

  res.render("post.ejs", {
    post: post,
    comments: comments,
    likeCount: likeCount,
    userHasLiked: userHasLiked,
  });
});

// Add new comment
app.post("/post/:id/comments", requireLogin, async (req, res) => {
  const postId = Number(req.params.id);

  // Validate post ID
  if (!isValidPostId(postId)) {
    return res.status(404).send("Post not found");
  }

  // Check if post exists
  const post = await getPostById(postId);

  if (!post) {
    return res.status(404).send("Post not found");
  }

  // Get comment content
  const { content } = req.body;

  // Validate comment
  if (!content?.trim()) {
    return res.status(404).send("Comment cannot be empty.");
  }

  // Get logged-in user information
  const userId = req.session.user.id;
  const author = req.session.user.username;

  // Comment date
  const date = new Date().toLocaleDateString();

  // Save comment
  await createComment(content.trim(), postId, userId, author, date);

  // Redirect back to post
  res.redirect(`/post/${postId}`);
});

// =========================
// Like / Unlike Post
// =========================

app.post("/post/:id/like", requireLogin, async (req, res) => {
  const postId = Number(req.params.id);

  if (!isValidPostId(postId)) {
    return res.status(404).send("Post not found");
  }

  const post = await getPostById(postId);

  if (!post) {
    return res.status(404).send("Post not found");
  }

  const userId = req.session.user.id;

  const existingLike = await getLike(postId, userId);

  if (existingLike) {
    await deleteLike(postId, userId);
  } else {
    await createLike(postId, userId);
  }

  res.redirect(`/post/${postId}`);
});

// Delete comment
app.post("/comment/:id/delete", requireLogin, async (req, res) => {
  const commentId = Number(req.params.id);

  if (!Number.isInteger(commentId) || commentId <= 0) {
    return res.status(404).send("Comment not found");
  }

  const comment = await getCommentById(commentId);

  if (!comment) {
    return res.status(404).send("Comment not found");
  }

  const post = await getPostById(comment.post_id);

  if (!post) {
    return res.status(404).send("Post not found");
  }

  const currentUserId = req.session.user.id;

  const isCommentOwner = comment.user_id === currentUserId;

  const isPostOwner = post.user_id === currentUserId;

  if (!isCommentOwner && !isPostOwner) {
    return res.status(403).send("You are not allowed to delete this comment");
  }

  await deleteComment(commentId);

  res.redirect(`/post/${comment.post_id}`);
});

// Show edit post form
app.get("/edit/:id", requireLogin, async (req, res) => {
  const postId = Number(req.params.id);

  if (!isValidPostId(postId)) {
    return res.status(404).send("Post not found");
  }

  const post = await getPostById(postId);

  if (!post) {
    return res.status(404).send("Post not found");
  }

  if (!isPostOwner(req, post)) {
    return res.status(403).send("You can only edit your own posts.");
  }

  const categories = await getAllCategories();

  res.render("edit.ejs", {
    post: post,
    categories: categories,
  });
});

// Update existing post
app.post(
  "/edit/:id",
  requireLogin,
  upload.single("image"),
  async (req, res) => {
    const postId = Number(req.params.id);

    if (!isValidPostId(postId)) {
      return res.status(404).send("Post not found");
    }

    const post = await getPostById(postId);

    if (!post) {
      return res.status(404).send("Post not found");
    }

    if (!isPostOwner(req, post)) {
      return res.status(403).send("You can only edit your own posts.");
    }

    const { title, content, category_id } = req.body;

    if (!title?.trim() || !content?.trim() || !category_id) {
      return res.send("All fields are required.");
    }

    const categoryId = Number(category_id);

    if (!Number.isInteger(categoryId) || categoryId <= 0) {
      return res.send("Invalid category selected.");
    }

    const category = await getCategoryById(categoryId);

    if (!category) {
      return res.send("Selected category does not exist.");
    }

    // Keep existing image if no new image was selected
    let image = post.image;

    if (req.file) {
      const result = await cloudinary.uploader.upload(
        `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`,
        {
          folder: "blog-capstone",
        },
      );

      image = result.secure_url;
    }
    await updatePost(title.trim(), content.trim(), categoryId, image, postId);

    res.redirect(`/post/${postId}`);
  },
);

// Delete post
app.post("/delete/:id", requireLogin, async (req, res) => {
  const postId = Number(req.params.id);

  if (!isValidPostId(postId)) {
    return res.status(404).send("Post not found");
  }

  const post = await getPostById(postId);

  if (!post) {
    return res.status(404).send("Post not found");
  }

  if (!isPostOwner(req, post)) {
    return res.status(403).send("You can only delete your own posts.");
  }

  await deletePost(postId);

  res.redirect("/");
});

// =========================
// Friendship Routes
// =========================

app.post("/friends/request/:id", requireLogin, async (req, res) => {
  try {
    const receiverId = Number(req.params.id);
    const senderId = req.session.user.id;

    if (!Number.isInteger(receiverId) || receiverId <= 0) {
      return res.status(400).send("Invalid user.");
    }

    // Prevent sending a request to yourself
    if (senderId === receiverId) {
      return res
        .status(400)
        .send("You cannot send a friend request to yourself.");
    }

    // Check the current relationship
    const existingFriendship = await getFriendStatus(senderId, receiverId);

    if (existingFriendship) {
      return res
        .status(400)
        .send("A friendship or friend request already exists.");
    }

    await sendFriendRequest(senderId, receiverId);

    res.redirect(`/profile/${receiverId}`);
  } catch (error) {
    console.error("Error sending friend request:", error);
    res.status(500).send("Unable to send friend request.");
  }
});

app.post("/friends/accept/:id", requireLogin, async (req, res) => {
  try {
    const requestId = Number(req.params.id);
    const userId = req.session.user.id;

    if (!Number.isInteger(requestId) || requestId <= 0) {
      return res.status(400).send("Invalid friend request.");
    }

    const request = await acceptFriendRequest(requestId, userId);

    if (!request) {
      return res.status(404).send("Friend request not found.");
    }

    res.redirect("/friends");
  } catch (error) {
    console.error("Error accepting friend request:", error);
    res.status(500).send("Unable to accept friend request.");
  }
});

app.post("/friends/reject/:id", requireLogin, async (req, res) => {
  try {
    const requestId = Number(req.params.id);
    const userId = req.session.user.id;

    if (!Number.isInteger(requestId) || requestId <= 0) {
      return res.status(400).send("Invalid friend request.");
    }

    const request = await rejectFriendRequest(requestId, userId);

    if (!request) {
      return res.status(404).send("Friend request not found.");
    }

    res.redirect("/friends");
  } catch (error) {
    console.error("Error rejecting friend request:", error);
    res.status(500).send("Unable to reject friend request.");
  }
});

app.get("/friends", requireLogin, async (req, res) => {
  try {
    const userId = req.session.user.id;

    const friendRequests = await getPendingFriendRequests(userId);
    const friends = await getFriends(userId);

    res.render("friends.ejs", {
      friendRequests,
      friends,
    });
  } catch (error) {
    console.error("Error loading friends page:", error);
    res.status(500).send("Unable to load friends.");
  }
});


// =========================
// Private Chat
// =========================

// Get unread message count
app.get("/messages/unread-count", requireLogin, async (req, res) => {
    try {
        const userId = req.session.user.id;

        const unreadCount = await getUnreadMessageCount(userId);

        res.json({
            count: unreadCount
        });

    } catch (error) {
        console.error("Error getting unread message count:", error);

        res.status(500).json({
            count: 0
        });
    }
});

// Get unread message counts grouped by sender
app.get("/messages/unread-by-sender", requireLogin, async (req, res) => {
    try {
        const userId = req.session.user.id;

        const unreadCounts =
            await getUnreadMessageCountsBySender(userId);

        res.json(unreadCounts);

    } catch (error) {
        console.error(
            "Error getting unread message counts by sender:",
            error
        );

        res.status(500).json([]);
    }
});

app.get("/chat/:id", requireLogin, async (req, res) => {
  try {
    const otherUserId = Number(req.params.id);
    const currentUserId = req.session.user.id;

    // Validate user ID
    if (!Number.isInteger(otherUserId) || otherUserId <= 0) {
      return res.status(404).send("User not found.");
    }

    // Prevent chatting with yourself
    if (currentUserId === otherUserId) {
      return res.status(400).send("You cannot chat with yourself.");
    }

    // Make sure the other user exists
    const otherUser = await getUserById(otherUserId);

    if (!otherUser) {
      return res.status(404).send("User not found.");
    }

    // Load conversation history
    const messages = await getConversation(
      currentUserId,
      otherUserId
    );

    // Mark messages from this user as read
    await markMessagesAsRead(
      currentUserId,
      otherUserId
    );

    res.render("chat.ejs", {
      otherUser,
      messages,
    });
  } catch (error) {
    console.error("Error loading chat:", error);
    res.status(500).send("Unable to load chat.");
  }
});


// Send a private message
app.post("/chat/:id/send", requireLogin, async (req, res) => {
    try {
        const receiverId = Number(req.params.id);
        const senderId = req.session.user.id;

        // Validate receiver ID
        if (!Number.isInteger(receiverId) || receiverId <= 0) {
            return res.status(400).send("Invalid user.");
        }

        // Prevent sending a message to yourself
        if (senderId === receiverId) {
            return res.status(400).send("You cannot message yourself.");
        }

        // Validate message content
        const content = req.body.content?.trim();

        if (!content) {
            return res.status(400).send("Message cannot be empty.");
        }

        // Make sure receiver exists
        const receiver = await getUserById(receiverId);

        if (!receiver) {
            return res.status(404).send("User not found.");
        }

        // Save message
        await createMessage(
            senderId,
            receiverId,
            content
        );

        // Return to conversation
        res.redirect(`/chat/${receiverId}`);

    } catch (error) {
        console.error("Error sending message:", error);
        res.status(500).send("Unable to send message.");
    }
});

// Create HTTP server for Express + Socket.IO
const server = createServer(app);

// Initialize Socket.IO
const io = new Server(server);

// Track currently online users
const onlineUsers = new Map();

io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);

    socket.on("user-online", (userId) => {
        if (!onlineUsers.has(userId)) {
            onlineUsers.set(userId, new Set());
        }

        onlineUsers.get(userId).add(socket.id);

        console.log(`User ${userId} is online.`);

        // Send the current online users to this browser
        socket.emit("online-users", Array.from(onlineUsers.keys()));

        // Tell all other connected browsers this user is online
        socket.broadcast.emit("presence-update", {
            userId: userId,
            online: true
        });
    });
     // ==========================================
    // Private Real-Time Messaging
    // ==========================================

    socket.on("private-message", async ({ senderId, receiverId, content }) => {
        try {
            if (
                !Number.isInteger(senderId) ||
                !Number.isInteger(receiverId) ||
                senderId <= 0 ||
                receiverId <= 0
            ) {
                return;
            }

            if (senderId === receiverId) {
                return;
            }

            const messageContent = content?.trim();

            if (!messageContent) {
                return;
            }

            // Make sure the receiver exists
            const receiver = await getUserById(receiverId);

            if (!receiver) {
                return;
            }

            // Save the message to PostgreSQL
            const message = await createMessage(
                senderId,
                receiverId,
                messageContent
            );

        // Send the message to the sender's active sockets
        const senderSockets = onlineUsers.get(senderId);

        if (senderSockets) {
            for (const socketId of senderSockets) {
                io.to(socketId).emit("message-sent", message);
            }
        }

        // Send the message to the receiver's active sockets
        const receiverSockets = onlineUsers.get(receiverId);

        if (receiverSockets) {
            for (const socketId of receiverSockets) {
                io.to(socketId).emit("message-received", message);
                io.to(socketId).emit("unread-message-update");
            }
        }

        } catch (error) {
            console.error("Error sending private message:", error);
        }
    });

// ==========================================
// Mark Private Messages as Read
// ==========================================

socket.on("mark-messages-read", async ({ userId, otherUserId }) => {
    try {
        if (
            !Number.isInteger(userId) ||
            !Number.isInteger(otherUserId) ||
            userId <= 0 ||
            otherUserId <= 0 ||
            userId === otherUserId
        ) {
            return;
        }

        // Mark messages from the other user as read
        await markMessagesAsRead(
            userId,
            otherUserId
        );

        // Refresh the unread badge on all of this user's browsers
        const userSockets = onlineUsers.get(userId);

        if (!userSockets) {
            return;
        }

        for (const socketId of userSockets) {
            io.to(socketId).emit("unread-message-update");
        }

    } catch (error) {
        console.error(
            "Error marking messages as read:",
            error
        );
    }
});



    socket.on("disconnect", () => {
        for (const [userId, socketIds] of onlineUsers.entries()) {
            if (socketIds.has(socket.id)) {
                socketIds.delete(socket.id);

                if (socketIds.size === 0) {
                    onlineUsers.delete(userId);

                    console.log(`User ${userId} is offline.`);

                    // Tell all connected browsers this user is offline
                    socket.broadcast.emit("presence-update", {
                        userId: userId,
                        online: false
                    });
                }

                break;
            }
        }

        console.log("A user disconnected:", socket.id);
    });
});

// Start server
server.listen(port, "0.0.0.0", () => {
  console.log(`Server is running on port ${port}`);
});
