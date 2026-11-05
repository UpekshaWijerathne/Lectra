const express = require("express");
const router = express.Router();

const { Timestamp, FieldValue } = require("firebase-admin/firestore");

const verifyToken = require("../middleware/authMiddleware");
const allowRoles = require("../middleware/roleMiddleware");
const { db } = require("../firebaseAdmin");

const {
  generateSessionCode,
  isValidSessionCode,
} = require("../utils/sessionCode");

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


// POST /api/lectures/join
// Join a lecture using a session code (students only)
router.post(
  "/join",
  verifyToken,
  allowRoles("student"),
  async (req, res) => {
    try {
      const { sessionCode } = req.body;

      // Validate session code
      if (
        typeof sessionCode !== "string" ||
        !isValidSessionCode(sessionCode.trim().toUpperCase())
      ) {
        return res.status(400).json({
          success: false,
          message: "A valid 6-character session code is required.",
        });
      }

      const code = sessionCode.trim().toUpperCase();
      const studentId = req.user.uid;

      const codeRef = db.collection("sessionCodes").doc(code);

      const result = await db.runTransaction(async (transaction) => {
        // Check session code
        const codeSnapshot = await transaction.get(codeRef);

        if (!codeSnapshot.exists) {
          return { error: "INVALID_CODE" };
        }

        const codeData = codeSnapshot.data();

        if (!codeData.isActive) {
          return { error: "INACTIVE_CODE" };
        }

        if (
          !codeData.expiresAt ||
          codeData.expiresAt.toMillis() <= Date.now()
        ) {
          return { error: "EXPIRED_CODE" };
        }

        // Get lecture
        const lectureRef = db.collection("lectures").doc(codeData.lectureId);
        const lectureSnapshot = await transaction.get(lectureRef);

        if (!lectureSnapshot.exists) {
          return { error: "LECTURE_NOT_FOUND" };
        }

        const lectureData = lectureSnapshot.data();

        if (lectureData.status === "ended") {
          return { error: "LECTURE_ENDED" };
        }

        // Check whether student already joined
        const participantRef = lectureRef
          .collection("participants")
          .doc(studentId);

        const participantSnapshot = await transaction.get(participantRef);

        // Add student only if not already joined
        if (!participantSnapshot.exists) {
          transaction.create(participantRef, {
            joinedAt: FieldValue.serverTimestamp(),
          });
        }

        return {
          lectureId: lectureRef.id,
          subject: lectureData.subject,
          topic: lectureData.topic,
          status: lectureData.status,
          alreadyJoined: participantSnapshot.exists,
        };
      });

      // Handle validation errors
      if (result.error) {
        const errors = {
          INVALID_CODE: [404, "Session code not found."],
          INACTIVE_CODE: [400, "This session code is inactive."],
          EXPIRED_CODE: [400, "This session code has expired."],
          LECTURE_NOT_FOUND: [404, "Lecture not found."],
          LECTURE_ENDED: [400, "This lecture has already ended."],
        };

        const [statusCode, message] = errors[result.error];

        return res.status(statusCode).json({
          success: false,
          message,
        });
      }

      return res.status(200).json({
        success: true,
        message: result.alreadyJoined
          ? "You have already joined this lecture."
          : "Successfully joined the lecture.",
        data: result,
      });

    } catch (error) {
      console.error("Lecture joining error:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to join lecture.",
      });
    }
  }
);


module.exports = router;