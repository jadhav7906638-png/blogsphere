const express = require("express");

const Post = require("../models/Post");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// CREATE POST
// Login required
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { title, content } = req.body;

    if (!title || !content) {
      return res.status(400).json({
        message: "Title and content are required",
      });
    }

    const post = await Post.create({
      title,
      content,
      author: req.user.userId,
    });

    const populatedPost = await post.populate(
      "author",
      "name email"
    );

    res.status(201).json({
      message: "Post created successfully",
      post: populatedPost,
    });
  } catch (error) {
    console.error("CREATE POST ERROR:", error);

    res.status(500).json({
      message: "Failed to create post",
      error: error.message,
    });
  }
});

// GET ALL POSTS
// Public
router.get("/", async (req, res) => {
  try {
    const posts = await Post.find()
      .populate("author", "name email")
      .sort({ createdAt: -1 });

    res.json(posts);
  } catch (error) {
    console.error("GET POSTS ERROR:", error);

    res.status(500).json({
      message: "Failed to fetch posts",
      error: error.message,
    });
  }
});

// GET SINGLE POST
// Public
router.get("/:id", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).populate(
      "author",
      "name email"
    );

    if (!post) {
      return res.status(404).json({
        message: "Post not found",
      });
    }

    res.json(post);
  } catch (error) {
    console.error("GET SINGLE POST ERROR:", error);

    res.status(500).json({
      message: "Failed to fetch post",
      error: error.message,
    });
  }
});

// UPDATE POST
// Login required + only owner
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const { title, content } = req.body;

    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        message: "Post not found",
      });
    }

    if (
      !post.author ||
      post.author.toString() !== req.user.userId.toString()
    ) {
      return res.status(403).json({
        message: "You can only edit your own posts",
      });
    }

    post.title = title;
    post.content = content;

    await post.save();

    const updatedPost = await post.populate(
      "author",
      "name email"
    );

    res.json({
      message: "Post updated successfully",
      post: updatedPost,
    });
  } catch (error) {
    console.error("UPDATE POST ERROR:", error);

    res.status(500).json({
      message: "Failed to update post",
      error: error.message,
    });
  }
});

// DELETE POST
// Login required + only owner
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        message: "Post not found",
      });
    }

    if (
      !post.author ||
      post.author.toString() !== req.user.userId.toString()
    ) {
      return res.status(403).json({
        message: "You can only delete your own posts",
      });
    }

    await Post.findByIdAndDelete(req.params.id);

    res.json({
      message: "Post deleted successfully",
    });
  } catch (error) {
    console.error("DELETE POST ERROR:", error);

    res.status(500).json({
      message: "Failed to delete post",
      error: error.message,
    });
  }
});

module.exports = router;