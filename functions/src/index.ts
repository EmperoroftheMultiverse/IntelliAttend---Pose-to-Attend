import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();
const db = admin.firestore();

// --- TYPE DEFINITIONS ---
interface CreateUserData {
  name: string;
  email: string;
  password: string;
  role: "student" | "professor" | "admin";
  faceDescriptor?: number[];
  year?: number;
}

interface DeleteUserData {
  uidToDelete: string;
}

// ===================================================================
// ==                      CREATE USER FUNCTION                     ==
// ===================================================================
export const createUser = functions.https.onCall(async (data, context) => {
  // 1. Verify the user making the request is an admin
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

  // 2. Validate incoming data
  const {email, password, name, role, faceDescriptor, year} = data as CreateUserData;

  // Add logging to see what the function receives
  console.log(`Request to create user: ${name} (${email}), Role: ${role}, Year: ${year}`);
  console.log(`Received face descriptor with length: ${faceDescriptor?.length || 0}`);

  if (!email || !password || !name || !role) {
    throw new functions.https.HttpsError(
      "invalid-argument", "Missing required user data.",
    );
  }

  try {
    // 3. Create the user in Firebase Authentication
    const userRecord = await admin.auth().createUser({
      email: email,
      password: password,
      displayName: name,
    });

    // 4. Prepare the user profile data for Firestore
    const userProfileData: { [key: string]: any } = {
      email: email,
      name: name,
      role: role,
    };

    // 5. Conditionally add student-specific fields
    if (role === 'student') {
        userProfileData.year = year || 1; // Default to year 1 if not provided
        if (Array.isArray(faceDescriptor) && faceDescriptor.length > 0) {
            userProfileData.faceDescriptor = faceDescriptor;
        }
    }

    // 6. Save the profile to Firestore
    await db.collection("users").doc(userRecord.uid).set(userProfileData);

    return {result: `Successfully created user ${email}`};
  } catch (error) {
    if (error instanceof Error) {
      throw new functions.https.HttpsError("internal", error.message);
    }
    throw new functions.https.HttpsError("internal", "An unknown error occurred.");
  }
});

// ===================================================================
// ==                      DELETE USER FUNCTION                     ==
// ===================================================================
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
