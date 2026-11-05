const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

const { db } = require("./firebaseAdmin");
const verifyToken = require("./middleware/authMiddleware");
const allowRoles = require("./middleware/roleMiddleware");
const lectureRoutes = require("./routes/lectureRoutes");
const userRoutes = require("./routes/userRoutes");

// Middleware
app.use(cors());
app.use(express.json());
app.use("/api/lectures", lectureRoutes);

// Home route
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Welcome to Lectra API",
    status: "running",
  });
});

// Health check route
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    status: "healthy",
    service: "lectra-backend",
  });
});

app.get("/api/protected", verifyToken, (req, res) => {
  res.status(200).json({
    success: true,
    message: "You have accessed a protected route!",
    user: {
      uid: req.user.uid,
      email: req.user.email,
    },
  });
});

// Student-only route
app.get(
  "/api/student",
  verifyToken,
  allowRoles("student"),
  (req, res) => {
    res.json({
      success: true,
      message: "Welcome, Student!",
      role: req.user.role,
    });
  }
);

// Lecturer-only route
app.get(
  "/api/lecturer",
  verifyToken,
  allowRoles("lecturer"),
  (req, res) => {
    res.json({
      success: true,
      message: "Welcome, Lecturer!",
      role: req.user.role,
    });
  }
);
app.use("/api/users", userRoutes);

// Admin-only route
app.get(
  "/api/admin",
  verifyToken,
  allowRoles("admin"),
  (req, res) => {
    res.json({
      success: true,
      message: "Welcome, Admin!",
      role: req.user.role,
    });
  }
);

// Handle unknown routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);

  res.status(500).json({
    success: false,
    message: "Internal server error",
  });
});

// Start server
const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`Lectra backend running on http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});

// Handle startup errors, such as an occupied port
server.on("error", (err) => {
  console.error("Failed to start Lectra backend:", err.message);
  process.exitCode = 1;
});

module.exports = app;
