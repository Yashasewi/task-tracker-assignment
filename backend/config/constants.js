const constants = {
  JWT_SECRET: process.env.JWT_SECRET || "your_jwt_secret_key",
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "1h",
  PORT: process.env.PORT || 5000,
  MONGODB_URI: process.env.MONGO_URI || process.env.MONGODB_URI || "mongodb://localhost:27017/task-tracker",
  REDIS_URL: process.env.REDIS_URL || "redis://localhost:6379",
  CACHE_TTL: parseInt(process.env.CACHE_TTL) || 3600, // 1 hour in seconds
};

module.exports = constants;
