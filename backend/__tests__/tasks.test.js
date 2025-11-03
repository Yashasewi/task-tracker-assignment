const request = require("supertest");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const redis = require("redis-mock");
const app = require("../server.js");
const User = require("../models/User.js");
const Task = require("../models/Task.js");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

let mongoServer;
let redisClient;
let token;
let userId;

beforeAll(async () => {
  // Disconnect existing connection if any
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }

  // Start in-memory MongoDB
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);

  // Mock Redis
  redisClient = redis.createClient();
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
  if (redisClient && typeof redisClient.disconnect === "function") {
    await redisClient.disconnect();
  }
});

beforeEach(async () => {
  await User.deleteMany({});
  await Task.deleteMany({});
  await redisClient.flushall();

  // Create a test user and get token
  const hashedPassword = await bcrypt.hash("password123", 10);
  const user = await User.create({
    name: "Test User",
    email: "test@example.com",
    password: hashedPassword,
  });
  userId = user._id;

  token = jwt.sign(
    { userId: user._id },
    process.env.JWT_SECRET || "testsecret",
  );
});

describe("Tasks Routes", () => {
  describe("GET /api/tasks", () => {
    it("should return tasks for authenticated user", async () => {
      await Task.create([
        { title: "Task 1", description: "Desc 1", owner: userId },
        { title: "Task 2", description: "Desc 2", owner: userId },
      ]);

      const res = await request(app)
        .get("/api/tasks")
        .set("Authorization", `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveLength(2);
      const titles = res.body.map((task) => task.title);
      expect(titles).toEqual(expect.arrayContaining(["Task 1", "Task 2"]));
    });

    it("should return 401 without token", async () => {
      const res = await request(app).get("/api/tasks");
      expect(res.statusCode).toBe(401);
    });

    it("should return 401 with invalid token", async () => {
      const res = await request(app)
        .get("/api/tasks")
        .set("Authorization", "Bearer invalid.token.here");
      
      expect(res.statusCode).toBe(401);
    });

    it("should return 401 with malformed Authorization header", async () => {
      const res = await request(app)
        .get("/api/tasks")
        .set("Authorization", "InvalidFormat token123");
      
      expect(res.statusCode).toBe(401);
    });

    it("should return empty array if user has no tasks", async () => {
      const res = await request(app)
        .get("/api/tasks")
        .set("Authorization", `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveLength(0);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it("should not return tasks from other users", async () => {
      const hashedPassword = await bcrypt.hash("password123", 10);
      const otherUser = await User.create({
        name: "Other User",
        email: "other@example.com",
        password: hashedPassword,
      });

      await Task.create([
        { title: "My Task", owner: userId },
        { title: "Other User Task", owner: otherUser._id },
      ]);

      const res = await request(app)
        .get("/api/tasks")
        .set("Authorization", `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].title).toBe("My Task");
    });
  });

  describe("POST /api/tasks", () => {
    it("should create a new task", async () => {
      const res = await request(app)
        .post("/api/tasks")
        .set("Authorization", `Bearer ${token}`)
        .send({
          title: "New Task",
          description: "New Description",
          status: "pending",
        });

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty("title", "New Task");
      expect(res.body.owner).toBe(userId.toString());
    });

    it("should return 400 if title is missing", async () => {
      const res = await request(app)
        .post("/api/tasks")
        .set("Authorization", `Bearer ${token}`)
        .send({
          description: "New Description",
          status: "pending",
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe("Title is required");
    });

    it("should return 401 without token", async () => {
      const res = await request(app)
        .post("/api/tasks")
        .send({
          title: "New Task",
          description: "New Description",
        });

      expect(res.statusCode).toBe(401);
    });

    it("should create task with only title (minimal data)", async () => {
      const res = await request(app)
        .post("/api/tasks")
        .set("Authorization", `Bearer ${token}`)
        .send({
          title: "Minimal Task",
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.title).toBe("Minimal Task");
      expect(res.body.status).toBe("pending"); // default status
    });

    it("should return 400 with empty title", async () => {
      const res = await request(app)
        .post("/api/tasks")
        .set("Authorization", `Bearer ${token}`)
        .send({
          title: "",
          description: "Description",
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe("Title is required");
    });

    it("should create task with all fields", async () => {
      const dueDate = new Date("2025-12-31");
      const res = await request(app)
        .post("/api/tasks")
        .set("Authorization", `Bearer ${token}`)
        .send({
          title: "Complete Task",
          description: "Full description",
          status: "completed",
          dueDate: dueDate.toISOString(),
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.title).toBe("Complete Task");
      expect(res.body.description).toBe("Full description");
      expect(res.body.status).toBe("completed");
      expect(res.body.dueDate).toBeDefined();
    });

    it("should return 400 with invalid JSON", async () => {
      const res = await request(app)
        .post("/api/tasks")
        .set("Authorization", `Bearer ${token}`)
        .set("Content-Type", "application/json")
        .send("{ invalid json");

      expect(res.statusCode).toBe(400);
    });
  });

  describe("PUT /api/tasks/:id", () => {
    it("should update a task", async () => {
      const task = await Task.create({
        title: "Old Title",
        description: "Old Desc",
        owner: userId,
      });

      const res = await request(app)
        .put(`/api/tasks/${task._id}`)
        .set("Authorization", `Bearer ${token}`)
        .send({
          title: "Updated Title",
          status: "completed",
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.title).toBe("Updated Title");
      expect(res.body.status).toBe("completed");
    });

    it("should return 404 for non-existent task", async () => {
      const res = await request(app)
        .put("/api/tasks/507f1f77bcf86cd799439011")
        .set("Authorization", `Bearer ${token}`)
        .send({ title: "Updated" });

      expect(res.statusCode).toBe(404);
    });

    it("should not update a task belonging to another user", async () => {
      const anotherUser = await User.create({
        name: "Another User",
        email: "another@example.com",
        password: "password123",
      });

      const task = await Task.create({
        title: "Another User's Task",
        owner: anotherUser._id,
      });

      const res = await request(app)
        .put(`/api/tasks/${task._id}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ title: "Updated Title" });

      expect(res.statusCode).toBe(404);
    });

    it("should return 401 without token", async () => {
      const task = await Task.create({
        title: "Task",
        owner: userId,
      });

      const res = await request(app)
        .put(`/api/tasks/${task._id}`)
        .send({ title: "Updated" });

      expect(res.statusCode).toBe(401);
    });

    it("should return 404 with invalid task ID format", async () => {
      const res = await request(app)
        .put("/api/tasks/invalid-id")
        .set("Authorization", `Bearer ${token}`)
        .send({ title: "Updated" });

      expect(res.statusCode).toBe(400); // Changed from 500 to 400
      expect(res.body.message).toBe("Invalid task ID format");
    });

    it("should update only specified fields", async () => {
      const task = await Task.create({
        title: "Original Title",
        description: "Original Description",
        status: "pending",
        owner: userId,
      });

      const res = await request(app)
        .put(`/api/tasks/${task._id}`)
        .set("Authorization", `Bearer ${token}`)
        .send({
          title: "Updated Title",
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.title).toBe("Updated Title");
      expect(res.body.description).toBe("Original Description");
    });

    it("should update status field", async () => {
      const task = await Task.create({
        title: "Task",
        status: "pending",
        owner: userId,
      });

      const res = await request(app)
        .put(`/api/tasks/${task._id}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ status: "completed" });

      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe("completed");
    });
  });

  describe("DELETE /api/tasks/:id", () => {
    it("should delete a task", async () => {
      const task = await Task.create({
        title: "Task to Delete",
        owner: userId,
      });

      const res = await request(app)
        .delete(`/api/tasks/${task._id}`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe("Task deleted successfully");

      const deletedTask = await Task.findById(task._id);
      expect(deletedTask).toBeNull();
    });

    it("should not delete a task belonging to another user", async () => {
      const anotherUser = await User.create({
        name: "Another User",
        email: "another@example.com",
        password: "password123",
      });

      const task = await Task.create({
        title: "Another User's Task",
        owner: anotherUser._id,
      });

      const res = await request(app)
        .delete(`/api/tasks/${task._id}`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.statusCode).toBe(404);

      const notDeletedTask = await Task.findById(task._id);
      expect(notDeletedTask).not.toBeNull();
    });

    it("should return 401 without token", async () => {
      const task = await Task.create({
        title: "Task",
        owner: userId,
      });

      const res = await request(app).delete(`/api/tasks/${task._id}`);

      expect(res.statusCode).toBe(401);
    });

    it("should return 404 for non-existent task", async () => {
      const res = await request(app)
        .delete("/api/tasks/507f1f77bcf86cd799439011")
        .set("Authorization", `Bearer ${token}`);

      expect(res.statusCode).toBe(404);
    });

    it("should return 500 with invalid task ID format", async () => {
      const res = await request(app)
        .delete("/api/tasks/invalid-id")
        .set("Authorization", `Bearer ${token}`);

      expect(res.statusCode).toBe(400); // Changed from 500 to 400
      expect(res.body.message).toBe("Invalid task ID format");
    });
  });
});
