
const { db } = require("../firebaseAdmin");

const allowRoles = (...allowedRoles) => {
  return async (req, res, next) => {
    try {
      // Authentication middleware must run first
      if (!req.user || !req.user.uid) {
        return res.status(401).json({
          success: false,
          message: "Authentication required.",
        });
      }

      // Retrieve the user's trusted profile from Firestore
      const userRef = db.collection("users").doc(req.user.uid);
      const userDoc = await userRef.get();

      if (!userDoc.exists) {
        return res.status(403).json({
          success: false,
          message: "User profile not found.",
        });
      }

      const userRole = userDoc.data().role;

      if (!allowedRoles.includes(userRole)) {
        return res.status(403).json({
          success: false,
          message: "You do not have permission to access this resource.",
        });
      }

      // Attach the verified role to the request
      req.user.role = userRole;

      next();
    } catch (error) {
      console.error("Role verification error:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to verify user permissions.",
      });
    }
  };
};

module.exports = allowRoles;
