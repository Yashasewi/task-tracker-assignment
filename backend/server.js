const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

// Load environment variables FIRST before any other imports
dotenv.config();

const connectDB = require("./config/database");
const authRoutes = require("./routes/auth");
const taskRoutes = require("./routes/tasks");
const { PORT } = require("./config/constants");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Handle JSON parsing errors
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ message: 'Invalid JSON in request body' });
  }
  next(err);
});

// MongoDB Connection
connectDB();

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/tasks", taskRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something broke!");
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app; // For testing
