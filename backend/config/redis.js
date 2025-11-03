const redis = require("redis");

let redisClient;

if (process.env.NODE_ENV !== "test") {
  redisClient = redis.createClient({ url: process.env.REDIS_URL });
  redisClient.on("error", (err) => console.error("Redis Client Error", err));
  redisClient.on("connect", () => console.log("Redis connected"));
  redisClient.connect();
}

module.exports = redisClient;
