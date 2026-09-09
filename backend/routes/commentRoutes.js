const express = require("express");

const Comment = require("../models/Comment");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// CREATE COMMENT
// Login required
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { text, post } = req.body;

    if (!text || !post) {
      return res.status(400).json({
        message: "Comment text and post ID are required",
      });
    }

    const comment = await Comment.create({
      text,
      post,
      author: req.user.userId,
    });

    const populatedComment = await comment.populate(
      "author",
      "name email"
    );

    res.status(201).json({
      message: "Comment added successfully",
      comment: populatedComment,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to add comment",
      error: error.message,
    });
  }
});

// GET COMMENTS FOR A POST
// Public
router.get("/:postId", async (req, res) => {
  try {
    const comments = await Comment.find({
      post: req.params.postId,
    })
      .populate("author", "name email")
      .sort({ createdAt: -1 });

    res.json(comments);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch comments",
      error: error.message,
    });
  }
});

// DELETE COMMENT
// Login required + only comment owner
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({
        message: "Comment not found",
      });
    }

    if (
      comment.author &&
      comment.author.toString() !== req.user.userId.toString()
    ) {
      return res.status(403).json({
        message: "You can only delete your own comments",
      });
    }

    await Comment.findByIdAndDelete(req.params.id);

    res.json({
      message: "Comment deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to delete comment",
      error: error.message,
    });
  }
});

module.exports = router;