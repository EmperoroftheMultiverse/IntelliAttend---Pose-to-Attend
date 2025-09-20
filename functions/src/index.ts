import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();
const db = admin.firestore();

interface DeleteUserData {
  uidToDelete: string;
}

interface CreateUserData {
  name: string;
  email: string;
  password: string;
  role: "student" | "professor" | "admin";
  faceDescriptor?: number[]; // 👈 Add optional face descriptor
  year?: number;
}

export const createUser = functions.https.onCall(async (data, context) => {
  // 1. Check if the user making the request is an admin
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "The function must be called while authenticated.",
    );
  }
  const adminDoc = await db.collection("users").doc(context.auth.uid).get();
  if (adminDoc.data()?.role !== "admin") {
    throw new functions.https.HttpsError(
      "permission-denied",
      "You must be an admin to create users.",
    );
  }

  // 2. Safely access the data properties
  const {email, password, name, role, faceDescriptor, year} = data as CreateUserData; // 👈 Get year
  if (!email || !password || !name || !role) {
    throw new functions.https.HttpsError(
      "invalid-argument", "Missing user data.",
    );
  }

  try {
    const userRecord = await admin.auth().createUser({
      email: email,
      password: password,
      displayName: name,
    });

    await db.collection("users").doc(userRecord.uid).set({
      email: email,
      name: name,
      role: role,
      faceDescriptor: faceDescriptor || null,
      year: role === 'student' ? year : null,
    });

    return {result: `Successfully created user ${email}`};
  } catch (error) {
    if (error instanceof Error) {
      throw new functions.https.HttpsError("internal", error.message);
    }
    throw new functions.https.HttpsError("internal", "An unknown error occurred.");
  }
});

export const deleteUser = functions.https.onCall(async (data, context) => {
  // (Admin check)
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated", "The function must be called while authenticated.",
    );
  }
  const adminDoc = await db.collection("users").doc(context.auth.uid).get();
  if (adminDoc.data()?.role !== "admin") {
    throw new functions.https.HttpsError(
      "permission-denied", "You must be an admin to delete users.",
    );
  }

  const {uidToDelete} = data as DeleteUserData;
  if (!uidToDelete) {
      throw new functions.https.HttpsError("invalid-argument", "Missing UID.");
  }

  try {
    await admin.auth().deleteUser(uidToDelete);
    await db.collection("users").doc(uidToDelete).delete();
    return {result: "Successfully deleted user."};
  } catch (error) {
    if (error instanceof Error) {
      throw new functions.https.HttpsError("internal", error.message);
    }
    throw new functions.https.HttpsError("internal", "An unknown error occurred.");
  }
});