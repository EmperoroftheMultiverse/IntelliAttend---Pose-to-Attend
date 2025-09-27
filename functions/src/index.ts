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
// ==        FUNCTION 1: INITIALIZE NEW INSTITUTE & ADMIN           ==
// ===================================================================
export const initializeNewInstitute = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "You must be authenticated.");
    }
    if (context.auth.token.instituteId) {
        throw new functions.https.HttpsError("already-exists", "This user is already part of an institute.");
    }
    const { instituteName } = data;
    if (!instituteName) {
        throw new functions.https.HttpsError("invalid-argument", "Institute name is required.");
    }
    const user = await admin.auth().getUser(context.auth.uid);

    try {
        const instituteRef = await db.collection("institutes").add({
            name: instituteName,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        const instituteId = instituteRef.id;
        await admin.auth().setCustomUserClaims(user.uid, { instituteId, role: "admin" });
        await db.collection("institutes").doc(instituteId).collection("users").doc(user.uid).set({
            name: user.displayName || 'Admin',
            email: user.email,
            role: "admin",
        });
        return { result: `Successfully created institute with ID: ${instituteId}` };
    } catch (error) {
        if (error instanceof Error) { throw new functions.https.HttpsError("internal", error.message); }
        throw new functions.https.HttpsError("internal", "An unknown error occurred.");
    }
});

// ===================================================================
// ==                FUNCTION 2: CREATE A NEW USER                  ==
// ===================================================================
export const createUser = functions.https.onCall(async (data, context) => {
    if (context.auth?.token?.role !== "admin") {
        throw new functions.https.HttpsError("permission-denied", "You must be an admin to create users.");
    }
    const instituteId = context.auth.token.instituteId as string;
    const {email, password, name, role, faceDescriptor, year} = data as CreateUserData;

    try {
        const userRecord = await admin.auth().createUser({ email, password, displayName: name });
        await admin.auth().setCustomUserClaims(userRecord.uid, { instituteId, role });
        const userProfileData: { [key: string]: any } = { email, name, role };
        if (role === 'student') {
            userProfileData.year = year || 1;
            if (Array.isArray(faceDescriptor) && faceDescriptor.length > 0) {
                userProfileData.faceDescriptor = faceDescriptor;
            }
        }
        await db.collection("institutes").doc(instituteId).collection("users").doc(userRecord.uid).set(userProfileData);
        return { result: `Successfully created user ${email}` };
    } catch (error) {
       if (error instanceof Error) { throw new functions.https.HttpsError("internal", error.message); }
       throw new functions.https.HttpsError("internal", "An unknown error occurred.");
    }
});

// ===================================================================
// ==                 FUNCTION 3: DELETE A USER                     ==
// ===================================================================
export const deleteUser = functions.https.onCall(async (data, context) => {
    if (context.auth?.token?.role !== "admin") {
        throw new functions.https.HttpsError("permission-denied", "You must be an admin to delete users.");
    }
    const instituteId = context.auth.token.instituteId as string;
    const { uidToDelete } = data as DeleteUserData;

    try {
        await admin.auth().deleteUser(uidToDelete);
        await db.collection("institutes").doc(instituteId).collection("users").doc(uidToDelete).delete();
        return { result: "Successfully deleted user." };
    } catch (error) {
        if (error instanceof Error) { throw new functions.https.HttpsError("internal", error.message); }
        throw new functions.https.HttpsError("internal", "An unknown error occurred.");
    }
});

// ===================================================================
// ==     FUNCTION 4: DELETE SUBJECT & ASSOCIATED ATTENDANCE        ==
// ===================================================================
export const deleteSubjectAndAttendance = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "You must be authenticated.");
    }
    const userRole = context.auth.token.role;
    const instituteId = context.auth.token.instituteId as string;
    if ((userRole !== 'professor' && userRole !== 'admin') || !instituteId) {
        throw new functions.https.HttpsError("permission-denied", "You must be a professor or admin.");
    }

    const { subjectId } = data;
    if (!subjectId) {
        throw new functions.https.HttpsError("invalid-argument", "Missing subjectId.");
    }
    
    const subjectRef = db.collection('institutes').doc(instituteId).collection('subjects').doc(subjectId);
    
    try {
        const attendanceQuery = db.collection('institutes').doc(instituteId).collection('attendance').where('subjectId', '==', subjectId);
        const attendanceDocs = await attendanceQuery.get();
        
        const batch = db.batch();
        attendanceDocs.docs.forEach(doc => { batch.delete(doc.ref); });
        await batch.commit();

        await subjectRef.delete();

        return { result: `Successfully deleted subject and ${attendanceDocs.size} attendance records.` };
    } catch (error) {
        if (error instanceof Error) { throw new functions.https.HttpsError("internal", error.message); }
        throw new functions.https.HttpsError("internal", "An unknown error occurred.");
    }
});