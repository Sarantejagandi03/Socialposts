const express = require("express");
const Post = require("../models/post");
const auth = require("../middleware/auth");
const upload = require("../middleware/upload");

const router = express.Router();

// Create Post
router.post("/", auth, upload.single("image"), async (req, res) => {
  try {
    const newPost = await Post.create({
      title: req.body.title,
      content: req.body.content,
      image: req.file ? `/uploads/${req.file.filename}` : null,
      user: req.user.id
    });

    res.json(newPost);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get Feed (4 per page)
router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 4;
    const skip = (page - 1) * limit;

    const posts = await Post.find()
      .populate("user", "name _id")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get My Posts (User Dashboard)
router.get("/my-posts/all", auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    const posts = await Post.find({ user: req.user.id })
      .populate("user", "name _id")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update Post (Only Owner)
router.put("/:id", auth, async (req, res) => {
  try {
    const updatedPost = await Post.findById(req.params.id);

    if (!updatedPost) return res.status(404).json({ message: "Post not found" });

    if (updatedPost.user.toString() !== req.user.id)
      return res.status(403).json({ message: "Not authorized" });

    updatedPost.title = req.body.title || updatedPost.title;
    updatedPost.content = req.body.content || updatedPost.content;

    await updatedPost.save();
    res.json(updatedPost);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete Post (Only Owner)
router.delete("/:id", auth, async (req, res) => {
  try {
    const deletedPost = await Post.findById(req.params.id);

    if (!deletedPost) return res.status(404).json({ message: "Post not found" });

    if (deletedPost.user.toString() !== req.user.id)
      return res.status(403).json({ message: "Not authorized" });

    await deletedPost.deleteOne();
    res.json({ message: "Post deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;