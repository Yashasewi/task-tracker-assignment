const express = require("express");
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
    console.log("Cache hit:", !!cachedTasks);
    if (cachedTasks) {
      console.log("Tasks fetched from cache for user:", userId);
      return res.json(JSON.parse(cachedTasks));
    }

    // Fetch from DB
    const tasks = await Task.find({ owner: userId }).sort({ createdAt: -1 });
    console.log("Tasks fetched from DB for user:", userId, "Count:", tasks.length);
    res.json(tasks);

    // Cache the result
    await redisClient.setEx(cacheKey, CACHE_TTL, JSON.stringify(tasks)); // Cache for configured TTL
    console.log("Cache set for key:", cacheKey);
  } catch (error) {
    console.error("Error fetching tasks:", error);
    res.status(500).json({ message: "Server error" });
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
    console.log("Task created:", task._id, "for user:", req.user);

    // Invalidate cache
    await redisClient.del(getCacheKey(req.user));
    console.log("Cache invalidated for key:", getCacheKey(req.user));

    res.status(201).json(task);
  } catch (error) {
    console.error("Error creating task:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// PUT /api/tasks/:id - Update a task
router.put("/:id", auth, async (req, res) => {
  try {
    const { title, description, status, dueDate } = req.body;
    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, owner: req.user },
      { title, description, status, dueDate },
      { new: true },
    );
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }
    console.log("Task updated:", task._id, "for user:", req.user);

    // Invalidate cache
    await redisClient.del(getCacheKey(req.user));
    console.log("Cache invalidated for key:", getCacheKey(req.user));
    console.log("Cache invalidated for key:", getCacheKey(req.user));

    res.json(task);
  } catch (error) {
    console.error("Error updating task:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// DELETE /api/tasks/:id - Delete a task
router.delete("/:id", auth, async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({
      _id: req.params.id,
      owner: req.user,
    });
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }
    console.log("Task deleted:", task._id, "for user:", req.user);

    // Invalidate cache
    await redisClient.del(getCacheKey(req.user));

    res.json({ message: "Task deleted" });
  } catch (error) {
    console.error("Error deleting task:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;