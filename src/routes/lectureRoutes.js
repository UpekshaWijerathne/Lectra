const express = require("express");
const router = express.Router();

const verifyToken = require("../middleware/authMiddleware");
const allowRoles = require("../middleware/roleMiddleware");
const { db } = require("../firebaseAdmin");

// POST /api/lectures
// Create a new lecture (lecturers only)
router.post(
  "/",
  verifyToken,
  allowRoles("lecturer"),
  async (req, res) => {
    try {
      const { subject, topic, scheduledAt } = req.body;

      // Validate required fields
      if (
        typeof subject !== "string" ||
        !subject.trim() ||
        typeof topic !== "string" ||
        !topic.trim() ||
        !scheduledAt
      ) {
        return res.status(400).json({
          success: false,
          message: "Subject, topic and scheduledAt are required.",
        });
      }

      const date = new Date(scheduledAt);

      if (Number.isNaN(date.getTime())) {
        return res.status(400).json({
          success: false,
          message: "Invalid scheduledAt date.",
        });
      }

      // Actual Firestore creation logic comes next
      return res.status(501).json({
        success: false,
        message: "Lecture creation logic is not implemented yet.",
      });

    } catch (error) {
      console.error("Lecture creation error:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to create lecture.",
      });
    }
  }
);

module.exports = router;
