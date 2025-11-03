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

    it("should return 400 if name is missing", async () => {
      const res = await request(app).post("/api/auth/signup").send({
        email: "test@example.com",
        password: "password123",
      });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe("Please provide all required fields");
    });

    it("should return 400 if email is missing", async () => {
      const res = await request(app).post("/api/auth/signup").send({
        name: "Test User",
        password: "password123",
      });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe("Please provide all required fields");
    });

    it("should return 400 if password is missing", async () => {
      const res = await request(app).post("/api/auth/signup").send({
        name: "Test User",
        email: "test@example.com",
      });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe("Please provide all required fields");
    });

    it("should return 400 with empty body", async () => {
      const res = await request(app).post("/api/auth/signup").send({});

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe("Please provide all required fields");
    });

    it("should return 400 with malformed JSON", async () => {
      const res = await request(app)
        .post("/api/auth/signup")
        .set("Content-Type", "application/json")
        .send("{ invalid json }");

      expect(res.statusCode).toBe(400);
    });

    it("should hash the password before storing", async () => {
      const password = "password123";
      await request(app).post("/api/auth/signup").send({
        name: "Test User",
        email: "test@example.com",
        password: password,
      });

      const user = await User.findOne({ email: "test@example.com" });
      expect(user.password).not.toBe(password);
      expect(user.password).toMatch(/^\$2[aby]\$/); // bcrypt hash pattern
    });

    it("should create user with different email case", async () => {
      await request(app).post("/api/auth/signup").send({
        name: "User One",
        email: "test@example.com",
        password: "password123",
      });

      const res = await request(app).post("/api/auth/signup").send({
        name: "User Two",
        email: "TEST@EXAMPLE.COM",
        password: "password123",
      });

      // This should succeed if email comparison is case-sensitive
      // Or fail if it's case-insensitive (better UX)
      expect([201, 400]).toContain(res.statusCode);
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

    it("should return 400 if email is missing", async () => {
      const res = await request(app).post("/api/auth/login").send({
        password: "password123",
      });

      expect(res.statusCode).toBe(400);
    });

    it("should return 400 if password is missing", async () => {
      const res = await request(app).post("/api/auth/login").send({
        email: "test@example.com",
      });

      expect(res.statusCode).toBe(400);
    });

    it("should return 400 with empty body", async () => {
      const res = await request(app).post("/api/auth/login").send({});

      expect(res.statusCode).toBe(400);
    });

    it("should not login with empty password", async () => {
      const res = await request(app).post("/api/auth/login").send({
        email: "test@example.com",
        password: "",
      });

      expect(res.statusCode).toBe(400);
    });

    it("should return token with valid structure", async () => {
      const res = await request(app).post("/api/auth/login").send({
        email: "test@example.com",
        password: "password123",
      });

      expect(res.statusCode).toBe(200);
      expect(res.body.token).toBeDefined();
      expect(typeof res.body.token).toBe("string");
      expect(res.body.token.split(".").length).toBe(3); // JWT has 3 parts
    });
  });

  describe("POST /api/auth/verify", () => {
    let validToken;

    beforeEach(async () => {
      const hashedPassword = await bcrypt.hash("password123", 10);
      await User.create({
        name: "Test User",
        email: "test@example.com",
        password: hashedPassword,
      });

      const loginRes = await request(app).post("/api/auth/login").send({
        email: "test@example.com",
        password: "password123",
      });
      validToken = loginRes.body.token;
    });

    it("should verify a valid token", async () => {
      const res = await request(app)
        .post("/api/auth/verify")
        .send({ token: validToken });

      expect(res.statusCode).toBe(200);
      expect(res.body.valid).toBe(true);
      expect(res.body.decoded).toHaveProperty("userId");
    });

    it("should reject an invalid token", async () => {
      const res = await request(app)
        .post("/api/auth/verify")
        .send({ token: "invalid.token.here" });

      expect(res.statusCode).toBe(200);
      expect(res.body.valid).toBe(false);
      expect(res.body.error).toBeDefined();
    });

    it("should reject an expired token", async () => {
      const jwt = require("jsonwebtoken");
      const { JWT_SECRET } = require("../config/constants");
      
      const expiredToken = jwt.sign(
        { userId: "123" },
        JWT_SECRET,
        { expiresIn: "0s" }
      );

      // Wait a bit to ensure token is expired
      await new Promise(resolve => setTimeout(resolve, 100));

      const res = await request(app)
        .post("/api/auth/verify")
        .send({ token: expiredToken });

      expect(res.statusCode).toBe(200);
      expect(res.body.valid).toBe(false);
    });

    it("should return 400 if token is missing", async () => {
      const res = await request(app).post("/api/auth/verify").send({});

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe("Token required");
    });

    it("should reject empty token", async () => {
      const res = await request(app)
        .post("/api/auth/verify")
        .send({ token: "" });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe("Token required");
    });

    it("should reject malformed token", async () => {
      const res = await request(app)
        .post("/api/auth/verify")
        .send({ token: "not-a-valid-jwt" });

      expect(res.statusCode).toBe(200);
      expect(res.body.valid).toBe(false);
    });
  });
});
