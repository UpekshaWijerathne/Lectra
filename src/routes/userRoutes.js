const express = require("express");
const router = express.Router();

const verifyToken = require("../middleware/authMiddleware");
const { db } = require("../firebaseAdmin");

// POST /api/users/profile
// Create a profile for an authenticated student or lecturer.
router.post("/profile", verifyToken, async (req, res) => {
  try {
    const { name, role, preferredLanguage = "en" } = req.body;

    if (typeof name !== "string" || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Name is required.",
      });
    }

    if (!["student", "lecturer"].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role. Select student or lecturer.",
      });
    }

    const uid = req.user.uid;
    const userRef = db.collection("users").doc(uid);

    const result = await db.runTransaction(async (transaction) => {
      const userDoc = await transaction.get(userRef);

      // Never allow an existing user to change their role here.
      if (userDoc.exists) {
        const existingProfile = userDoc.data();

        if (existingProfile.role !== role) {
          const error = new Error("A profile already exists with a different role.");
          error.statusCode = 409;
          throw error;
        }

        return {
          created: false,
          profile: existingProfile,
        };
      }

      const profile = {
        name: name.trim(),
        displayName: name.trim(),
        email: req.user.email || "",
        role,
        preferredLanguage,
        createdAt: require("firebase-admin/firestore")
          .FieldValue.serverTimestamp(),
      };

      transaction.create(userRef, profile);

      return { created: true, profile };
    });

    return res.status(result.created ? 201 : 200).json({
      success: true,
      message: result.created
        ? "User profile created successfully."
        : "User profile already exists.",
      data: result.profile,
    });

  } catch (error) {
    if (error.statusCode === 409) {
      return res.status(409).json({
        success: false,
        message: error.message,
      });
    }

    console.error("Profile creation error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create user profile.",
    });
  }
});

module.exports = router;