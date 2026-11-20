
import { readFileSync } from "node:fs";
import {
  after,
  before,
  test
} from "node:test";
import assert from "node:assert/strict";

import {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails
} from "@firebase/rules-unit-testing";

import {
  doc,
  getDoc,
  getDocs,
  collection,
  setDoc,
  updateDoc,
  serverTimestamp,
  writeBatch
} from "firebase/firestore";

let testEnv;


// ==========================================
// TEST ENVIRONMENT SETUP
// ==========================================

before(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: "lectra-2cc59",
    firestore: {
      host: "127.0.0.1",
      port: 8080,
      rules: readFileSync("firestore.rules", "utf8")
    }
  });

  // Clear old emulator data before every test run.
  await testEnv.clearFirestore();

  // Seed test data without applying security rules.
  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();

    // Student 1
    await setDoc(doc(db, "users", "student-1"), {
      displayName: "Test Student",
      email: "student@example.com",
      role: "student",
      createdAt: new Date()
    });

    // Lecturer 1
    await setDoc(doc(db, "users", "lecturer-1"), {
      displayName: "Test Lecturer",
      email: "lecturer@example.com",
      role: "lecturer",
      createdAt: new Date()
    });

    // Student 2
    await setDoc(doc(db, "users", "student-2"), {
      displayName: "Other Student",
      email: "other@example.com",
      role: "student",
      createdAt: new Date()
    });

    // Lecture owned by Lecturer 1
    await setDoc(doc(db, "lectures", "lecture-1"), {
      lecturerId: "lecturer-1",
      subject: "Software Engineering",
      topic: "Design Patterns",
      scheduledAt: new Date(),
      sessionCode: "ABC123",
      status: "scheduled",
      createdAt: new Date()
    });

    // Student 1 is a participant.
    await setDoc(
      doc(db, "lectures", "lecture-1", "participants", "student-1"),
      {
        joinedAt: new Date()
      }
    );
  });
});


// ==========================================
// TEST ENVIRONMENT CLEANUP
// ==========================================

after(async () => {
  if (testEnv) {
    await testEnv.cleanup();
  }
});


// ==========================================
// USERS SECURITY TESTS
// ==========================================

test("unauthenticated user cannot read a profile", async () => {
  const db = testEnv.unauthenticatedContext().firestore();

  await assertFails(
    getDoc(doc(db, "users", "student-1"))
  );
});


test("student can read their own profile", async () => {
  const db = testEnv.authenticatedContext("student-1").firestore();

  await assertSucceeds(
    getDoc(doc(db, "users", "student-1"))
  );
});


test("student cannot change their role", async () => {
  const db = testEnv.authenticatedContext("student-1").firestore();

  await assertFails(
    updateDoc(doc(db, "users", "student-1"), {
      role: "lecturer"
    })
  );
});


test("student cannot create a profile directly", async () => {
  const db = testEnv.authenticatedContext("student-2").firestore();

  await assertFails(
    setDoc(doc(db, "users", "student-2-new"), {
      displayName: "New Student",
      email: "new@example.com",
      role: "student",
      createdAt: serverTimestamp()
    })
  );
});


// ==========================================
// LECTURE SECURITY TESTS
// ==========================================

test("lecturer can create their own lecture", async () => {
  const db = testEnv.authenticatedContext("lecturer-1").firestore();

  await assertSucceeds(
    setDoc(doc(db, "lectures", "lecture-2"), {
      lecturerId: "lecturer-1",
      subject: "Operating Systems",
      topic: "Processes",
      scheduledAt: new Date(),
      sessionCode: "XYZ789",
      status: "scheduled",
      createdAt: serverTimestamp()
    })
  );
});


test("lecturer cannot edit another lecturer's lecture", async () => {
  const db = testEnv.authenticatedContext("lecturer-2").firestore();

  await testEnv.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), "users", "lecturer-2"), {
      displayName: "Another Lecturer",
      email: "lecturer2@example.com",
      role: "lecturer",
      createdAt: new Date()
    });
  });

  await assertFails(
    updateDoc(doc(db, "lectures", "lecture-1"), {
      topic: "Unauthorized change"
    })
  );
});


// ==========================================
// QUESTION SECURITY TESTS
// ==========================================

test("student who has not joined cannot read lecture questions", async () => {
  const db = testEnv.authenticatedContext("student-2").firestore();

  // Create a question without security rules.
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await setDoc(
      doc(context.firestore(), "questions", "question-1"),
      {
        lectureId: "lecture-1",
        text: "Test question",
        isAnonymous: false,
        voteCount: 0,
        createdAt: new Date()
      }
    );
  });

  await assertFails(
    getDoc(doc(db, "questions", "question-1"))
  );
});


test("participant can submit a valid question with private author record", async () => {
  const db = testEnv.authenticatedContext("student-1").firestore();

  const questionRef = doc(db, "questions", "question-2");
  const authorRef = doc(db, "questionAuthors", "question-2");

  const batch = writeBatch(db);

  // Public question document.
  batch.set(questionRef, {
    lectureId: "lecture-1",
    text: "Can you explain this topic?",
    isAnonymous: false,
    voteCount: 0,
    createdAt: serverTimestamp()
  });

  // Private author document.
  batch.set(authorRef, {
    lectureId: "lecture-1",
    authorId: "student-1"
  });

  // Both documents are created atomically.
  await assertSucceeds(batch.commit());
});


// ==========================================
// PRIVATE QUESTION AUTHOR SECURITY TESTS
// ==========================================

test("another participant cannot read a private question author record", async () => {
  const db = testEnv.authenticatedContext("student-3").firestore();

  await testEnv.withSecurityRulesDisabled(async (context) => {
    const adminDb = context.firestore();

    // Add student 3 as a participant.
    await setDoc(
      doc(adminDb, "lectures", "lecture-1", "participants", "student-3"),
      {
        joinedAt: new Date()
      }
    );

    // Author record belongs to student 1.
    await setDoc(
      doc(adminDb, "questionAuthors", "question-private"),
      {
        lectureId: "lecture-1",
        authorId: "student-1"
      }
    );
  });

  await assertFails(
    getDoc(doc(db, "questionAuthors", "question-private"))
  );
});


test("question author can read their own private author record", async () => {
  const db = testEnv.authenticatedContext("student-1").firestore();

  await testEnv.withSecurityRulesDisabled(async (context) => {
    await setDoc(
      doc(context.firestore(), "questionAuthors", "question-own"),
      {
        lectureId: "lecture-1",
        authorId: "student-1"
      }
    );
  });

  await assertSucceeds(
    getDoc(doc(db, "questionAuthors", "question-own"))
  );
});


test("lecture owner can read private question author information", async () => {
  const db = testEnv.authenticatedContext("lecturer-1").firestore();

  await testEnv.withSecurityRulesDisabled(async (context) => {
    await setDoc(
      doc(context.firestore(), "questionAuthors", "question-lecturer"),
      {
        lectureId: "lecture-1",
        authorId: "student-1"
      }
    );
  });

  await assertSucceeds(
    getDoc(doc(db, "questionAuthors", "question-lecturer"))
  );
});


test("student cannot list private question author records", async () => {
  const db = testEnv.authenticatedContext("student-1").firestore();

  await assertFails(
    getDocs(collection(db, "questionAuthors"))
  );
});


// ==========================================
// AI SUMMARY SECURITY TESTS
// ==========================================

test("client cannot create an AI summary", async () => {
  const db = testEnv.authenticatedContext("lecturer-1").firestore();

  await assertFails(
    setDoc(doc(db, "summaries", "summary-1"), {
      lectureId: "lecture-1",
      clusterLabel: "Design Patterns",
      summaryText: "Test summary",
      questionIds: [],
      createdAt: serverTimestamp()
    })
  );
});


test("student cannot read a lecturer's AI summary", async () => {
  const db = testEnv.authenticatedContext("student-1").firestore();

  await testEnv.withSecurityRulesDisabled(async (context) => {
    await setDoc(
      doc(context.firestore(), "summaries", "summary-1"),
      {
        lectureId: "lecture-1",
        clusterLabel: "Design Patterns",
        summaryText: "Test summary",
        questionIds: ["question-1"],
        createdAt: new Date()
      }
    );
  });

  await assertFails(
    getDoc(doc(db, "summaries", "summary-1"))
  );
});
