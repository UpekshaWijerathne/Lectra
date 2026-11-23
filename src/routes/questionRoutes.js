const express = require("express");
const { FieldValue } = require("firebase-admin/firestore");

const router = express.Router();
const verifyToken = require("../middleware/authMiddleware");
const { db } = require("../firebaseAdmin");

function serializeQuestion(document) {
  const data = document.data();
  return {
    id: document.id,
    ...data,
    createdAt:
      data.createdAt && typeof data.createdAt.toDate === "function"
        ? data.createdAt.toDate().toISOString()
        : data.createdAt || null,
  };
}

function sendSseEvent(res, event, data) {
  res.write(`event: ${event}\n`);
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

async function getLectureAccess(uid, lectureId) {
  const [userSnapshot, lectureSnapshot] = await Promise.all([
    db.collection("users").doc(uid).get(),
    db.collection("lectures").doc(lectureId).get(),
  ]);

  if (!userSnapshot.exists) {
    return { allowed: false, status: 403, message: "User profile not found." };
  }

  if (!lectureSnapshot.exists) {
    return { allowed: false, status: 404, message: "Lecture not found." };
  }

  const role = userSnapshot.data().role;
  const lecture = lectureSnapshot.data();

  if (role === "admin") {
    return { allowed: true, role, lecture };
  }

  if (role === "lecturer" && lecture.lecturerId === uid) {
    return { allowed: true, role, lecture };
  }

  if (role === "student") {
    const participantSnapshot = await db
      .collection("lectures")
      .doc(lectureId)
      .collection("participants")
      .doc(uid)
      .get();

    if (participantSnapshot.exists) {
      return { allowed: true, role, lecture };
    }
  }

  return {
    allowed: false,
    status: 403,
    message: "You are not authorized to access this lecture.",
  };
}

// GET /api/questions/lectures/:lectureId/stream
// Stream question snapshots and changes to authorized lecture participants.
router.get("/lectures/:lectureId/stream", verifyToken, async (req, res) => {
  let unsubscribe;

  try {
    const { lectureId } = req.params;
    const access = await getLectureAccess(req.user.uid, lectureId);

    if (!access.allowed) {
      return res.status(access.status).json({
        success: false,
        message: access.message,
      });
    }

    res.status(200);
    res.set({
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    });
    res.flushHeaders();

    const questionsQuery = db
      .collection("questions")
      .where("lectureId", "==", lectureId);

    let isInitialSnapshot = true;

    unsubscribe = questionsQuery.onSnapshot(
      (snapshot) => {
        if (res.writableEnded) return;

        if (isInitialSnapshot) {
          const questions = snapshot.docs
            .map(serializeQuestion)
            .sort((a, b) => {
              const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
              const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
              return aTime - bTime;
            });

          sendSseEvent(res, "snapshot", { questions });
          isInitialSnapshot = false;
          return;
        }

        snapshot.docChanges().forEach((change) => {
          sendSseEvent(res, "question", {
            changeType: change.type,
            question: serializeQuestion(change.doc),
          });
        });
      },
      (error) => {
        console.error("Question stream error:", error);

        if (!res.writableEnded) {
          sendSseEvent(res, "error", {
            message: "The live question feed encountered an error.",
          });
          res.end();
        }
      }
    );

    req.on("close", () => {
      if (unsubscribe) unsubscribe();
    });
  } catch (error) {
    console.error("Question stream setup error:", error);

    if (!res.headersSent) {
      return res.status(500).json({
        success: false,
        message: "Failed to start the live question feed.",
      });
    }

    if (!res.writableEnded) res.end();
  }
});

// POST /api/questions/:questionId/upvote
// A student can upvote a question once. The vote and count update atomically.
router.post("/:questionId/upvote", verifyToken, async (req, res) => {
  try {
    const { questionId } = req.params;
    const uid = req.user.uid;

    const userSnapshot = await db.collection("users").doc(uid).get();

    if (!userSnapshot.exists || userSnapshot.data().role !== "student") {
      return res.status(403).json({
        success: false,
        message: "Only students can upvote questions.",
      });
    }

    const questionRef = db.collection("questions").doc(questionId);
    const questionSnapshot = await questionRef.get();

    if (!questionSnapshot.exists) {
      return res.status(404).json({
        success: false,
        message: "Question not found.",
      });
    }

    const lectureId = questionSnapshot.data().lectureId;
    const participantRef = db
      .collection("lectures")
      .doc(lectureId)
      .collection("participants")
      .doc(uid);
    const voteRef = questionRef.collection("votes").doc(uid);

    const result = await db.runTransaction(async (transaction) => {
      const [currentQuestion, existingVote, participant] = await Promise.all([
        transaction.get(questionRef),
        transaction.get(voteRef),
        transaction.get(participantRef),
      ]);

      if (!currentQuestion.exists) {
        return { error: "QUESTION_NOT_FOUND" };
      }

      if (!participant.exists) {
        return { error: "NOT_A_PARTICIPANT" };
      }

      if (existingVote.exists) {
        return {
          error: "ALREADY_VOTED",
          voteCount: currentQuestion.data().voteCount || 0,
        };
      }

      const currentCount = currentQuestion.data().voteCount;
      const voteCount =
        Number.isInteger(currentCount) && currentCount >= 0 ? currentCount : 0;

      transaction.create(voteRef, {
        userId: uid,
        createdAt: FieldValue.serverTimestamp(),
      });

      transaction.update(questionRef, {
        voteCount: voteCount + 1,
      });

      return { voteCount: voteCount + 1 };
    });

    if (result.error) {
      const errors = {
        QUESTION_NOT_FOUND: [404, "Question not found."],
        NOT_A_PARTICIPANT: [403, "Join the lecture before upvoting."],
        ALREADY_VOTED: [409, "You have already upvoted this question."],
      };
      const [statusCode, message] = errors[result.error];

      return res.status(statusCode).json({
        success: false,
        message,
        ...(result.voteCount !== undefined && { voteCount: result.voteCount }),
      });
    }

    return res.status(200).json({
      success: true,
      message: "Question upvoted successfully.",
      data: { questionId, voteCount: result.voteCount },
    });
  } catch (error) {
    console.error("Question upvote error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to upvote question.",
    });
  }
});

module.exports = router;
