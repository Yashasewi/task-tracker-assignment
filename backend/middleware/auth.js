const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../config/constants");

const auth = (req, res, next) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");
  if (!token) {
    return res.status(401).json({ message: "No token, authorization denied" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded.userId;
    // console.log("JWT verified for user:", decoded.userId);
    next();
  } catch (error) {
    console.error("JWT verification failed:", error.message);
    // console.log("Invalid token received:", token);
    res.status(401).json({ message: "Token is not valid" });
  }
};

module.exports = auth;
