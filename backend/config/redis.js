const redis = require("redis");
const { REDIS_URL } = require("./constants");

let redisClient;

if (process.env.NODE_ENV !== "test") {
  redisClient = redis.createClient({ url: REDIS_URL });
  redisClient.on("error", (err) => console.error("Redis Client Error", err));
  redisClient.on("connect", () => console.log("Redis connected"));
  redisClient.connect();
}

module.exports = redisClient;
