const express = require("express");
const router = express.Router();

const { Timestamp, FieldValue } = require("firebase-admin/firestore");

const verifyToken = require("../middleware/authMiddleware");
const allowRoles = require("../middleware/roleMiddleware");
const { db } = require("../firebaseAdmin");

const { generateSessionCode } = require("../utils/sessionCode");

const MAX_CODE_ATTEMPTS = 10;
const SESSION_CODE_VALIDITY_HOURS = 24;

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

      // Validate scheduled date
      const scheduledDate = new Date(scheduledAt);

      if (Number.isNaN(scheduledDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: "Invalid scheduledAt date.",
        });
      }

      const lecturerId = req.user.uid;

      // Generate a stable lecture document reference
      const lectureRef = db.collection("lectures").doc();

      // Calculate session-code expiry
      const expiresAt = Timestamp.fromMillis(
        Date.now() + SESSION_CODE_VALIDITY_HOURS * 60 * 60 * 1000
      );

      // Retry if a generated code already exists
      for (let attempt = 1; attempt <= MAX_CODE_ATTEMPTS; attempt++) {
        const sessionCode = generateSessionCode();

        const codeRef = db.collection("sessionCodes").doc(sessionCode);

        const created = await db.runTransaction(async (transaction) => {
          const codeSnapshot = await transaction.get(codeRef);

          // Code already exists: retry with another code
          if (codeSnapshot.exists) {
            return false;
          }

          // Create lecture document
          transaction.create(lectureRef, {
            lecturerId,
            subject: subject.trim(),
            topic: topic.trim(),
            scheduledAt: Timestamp.fromDate(scheduledDate),
            sessionCode,
            status: "scheduled",
            createdAt: FieldValue.serverTimestamp(),
          });

          // Create session-code document
          transaction.create(codeRef, {
            lectureId: lectureRef.id,
            createdAt: FieldValue.serverTimestamp(),
            expiresAt,
            isActive: true,
          });

          return true;
        });

        if (created) {
          return res.status(201).json({
            success: true,
            message: "Lecture created successfully.",
            data: {
              lectureId: lectureRef.id,
              subject: subject.trim(),
              topic: topic.trim(),
              scheduledAt: scheduledDate.toISOString(),
              sessionCode,
              expiresAt: expiresAt.toDate().toISOString(),
              status: "scheduled",
            },
          });
        }
      }

      // Could not generate a unique code after multiple attempts
      return res.status(503).json({
        success: false,
        message: "Unable to generate a unique session code. Please try again.",
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
