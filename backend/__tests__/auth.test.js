const request = require("supertest");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const redis = require("redis-mock");
const app = require("../server.js");
const User = require("../models/User.js");
const bcrypt = require("bcryptjs");

let mongoServer;
let redisClient;

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
  await redisClient.flushall();
});

describe("Auth Routes", () => {
  describe("POST /api/auth/signup", () => {
    it("should create a new user", async () => {
      const res = await request(app).post("/api/auth/signup").send({
        name: "Test User",
        email: "test@example.com",
        password: "password123",
      });

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty("token");
      expect(res.body.user).toHaveProperty("id");
      expect(res.body.user.name).toBe("Test User");
    });

    it("should not create user with existing email", async () => {
      await User.create({
        name: "Existing User",
        email: "test@example.com",
        password: "hashedpass",
      });

      const res = await request(app).post("/api/auth/signup").send({
        name: "Test User",
        email: "test@example.com",
        password: "password123",
      });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe("User already exists");
    });

    it("should return 400 if required fields are missing", async () => {
      const res = await request(app).post("/api/auth/signup").send({
        name: "Test User",
      });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe("Please provide all required fields");
    });
  });

  describe("POST /api/auth/login", () => {
    beforeEach(async () => {
      const hashedPassword = await bcrypt.hash("password123", 10);
      await User.create({
        name: "Test User",
        email: "test@example.com",
        password: hashedPassword,
      });
    });

    it("should login with valid credentials", async () => {
      const res = await request(app).post("/api/auth/login").send({
        email: "test@example.com",
        password: "password123",
      });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty("token");
      expect(res.body.user.email).toBe("test@example.com");
    });

    it("should not login with invalid credentials", async () => {
      const res = await request(app).post("/api/auth/login").send({
        email: "test@example.com",
        password: "wrongpassword",
      });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe("Invalid credentials");
    });

    it("should not login with non-existent email", async () => {
      const res = await request(app).post("/api/auth/login").send({
        email: "nonexistent@example.com",
        password: "password123",
      });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe("Invalid credentials");
    });
  });
});
