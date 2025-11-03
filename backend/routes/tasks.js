const express = require("express");
const mongoose = require("mongoose");
const Task = require("../models/Task");
const auth = require("../middleware/auth");
const redisClient = require("../config/redis");
const { CACHE_TTL } = require("../config/constants");

const router = express.Router();

// Helper to get cache key
const getCacheKey = (userId) => `tasks:${userId}`;

// GET /api/tasks - List tasks for logged-in user
router.get("/", auth, async (req, res) => {
  try {
    const userId = req.user;
    const cacheKey = getCacheKey(userId);

    // Check cache first
    const cachedTasks = await redisClient.get(cacheKey);
    // console.log("Cache hit:", !!cachedTasks);
    if (cachedTasks) {
      return res.json(JSON.parse(cachedTasks));
    }

    // Fetch from DB
    const tasks = await Task.find({ owner: userId }).sort({ createdAt: -1 });
    res.json(tasks);

    // Cache the result
    await redisClient.setEx(cacheKey, CACHE_TTL, JSON.stringify(tasks)); // Cache for configured TTL
  } catch (error) {
    console.error("Error fetching tasks:", error);
    res.status(500).json({ message: "Server error while fetching tasks" });
  }
});

// POST /api/tasks - Create a new task
router.post("/", auth, async (req, res) => {
  try {
    const { title, description, status, dueDate } = req.body;
    if (!title) {
      return res.status(400).json({ message: "Title is required" });
    }
    const task = new Task({
      title,
      description,
      status: status || "pending",
      dueDate,
      owner: req.user,
    });
    await task.save();

    // Invalidate cache
    await redisClient.del(getCacheKey(req.user));

    res.status(201).json(task);
  } catch (error) {
    console.error("Error creating task:", error);
    
    // Handle validation errors
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ message: "Validation error", errors: messages });
    }
    
    res.status(500).json({ message: "Server error while creating task" });
  }
});

// PUT /api/tasks/:id - Update a task
router.put("/:id", auth, async (req, res) => {
  try {
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid task ID format" });
    }

    const { title, description, status, dueDate } = req.body;
    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, owner: req.user },
      { title, description, status, dueDate },
      { new: true, runValidators: true },
    );
    if (!task) {
      return res.status(404).json({ message: "Task not found or you don't have permission to update it" });
    }

    // Invalidate cache
    await redisClient.del(getCacheKey(req.user));
    // console.log("Cache invalidated for key:", getCacheKey(req.user));

    res.json(task);
  } catch (error) {
    console.error("Error updating task:", error);
    
    // Handle validation errors
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ message: "Validation error", errors: messages });
    }
    
    res.status(500).json({ message: "Server error while updating task" });
  }
});

// DELETE /api/tasks/:id - Delete a task
router.delete("/:id", auth, async (req, res) => {
  try {
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid task ID format" });
    }

    const task = await Task.findOneAndDelete({
      _id: req.params.id,
      owner: req.user,
    });
    if (!task) {
      return res.status(404).json({ message: "Task not found or you don't have permission to delete it" });
    }

    // Invalidate cache
    await redisClient.del(getCacheKey(req.user));

    res.json({ message: "Task deleted successfully" });
  } catch (error) {
    console.error("Error deleting task:", error);
    res.status(500).json({ message: "Server error while deleting task" });
  }
});

module.exports = router;