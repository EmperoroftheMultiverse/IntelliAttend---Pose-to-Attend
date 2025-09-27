'use client';

import { useState, FormEvent } from 'react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { auth } from '../../lib/firebase'; // Import auth
import { createUserWithEmailAndPassword, updateProfile, signOut } from 'firebase/auth'; // Import auth functions
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function SignUpPage() {
    const [instituteName, setInstituteName] = useState('');
    const [adminName, setAdminName] = useState('');
    const [adminEmail, setAdminEmail] = useState('');
    const [adminPassword, setAdminPassword] = useState('');
    const [feedback, setFeedback] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const router = useRouter();

    const handleSignUp = async (e: FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setFeedback('Step 1: Creating your admin account...');

        try {
            // Step 1: Create the basic user account on the client
            const userCredential = await createUserWithEmailAndPassword(auth, adminEmail, adminPassword);
            await updateProfile(userCredential.user, { displayName: adminName });

            setFeedback('Step 2: Initializing your institute...');

            // Step 2: Call the Cloud Function
            const functions = getFunctions();
            const initializeInstitute = httpsCallable(functions, 'initializeNewInstitute');
            await initializeInstitute({ instituteName });

            // --- NEW POLLING LOGIC ---
            setFeedback('Step 3: Verifying admin permissions...');

            const checkClaims = async () => {
                if (auth.currentUser) {
                    // Force a refresh of the token
                    const tokenResult = await auth.currentUser.getIdTokenResult(true);
                    // Check if the role claim now exists
                    return tokenResult.claims.role === 'admin';
                }
                return false;
            };

            // Poll for the claim to appear, trying up to 5 times (10 seconds)
            for (let i = 0; i < 5; i++) {
                const claimsReady = await checkClaims();
                if (claimsReady) {
                    setFeedback('✅ Permissions verified! Redirecting to dashboard...');
                    router.push('/dashboard');
                    return; // Success! Exit the function.
                }
                // Wait 2 seconds before trying again
                await new Promise(resolve => setTimeout(resolve, 2000));
            }

            // If the loop finishes without success, it timed out.
            await signOut(auth); // Sign out to be safe
            throw new Error("Could not verify admin permissions in time. Please try logging in manually in a minute.");

        } catch (error) {
            console.error("SIGN UP FAILED:", error);

            let message = 'An unknown error occurred. Please check the console.';

            // --- THIS IS THE CORRECTED ERROR HANDLING LOGIC ---
            if (typeof error === 'object' && error !== null && 'code' in error && 'message' in error) {
                const firebaseError = error as { code: string, message: string };
                switch (firebaseError.code) {
                    case 'auth/email-already-in-use':
                        message = 'This email address is already registered. Please try logging in.';
                        break;
                    case 'auth/weak-password':
                        message = 'The password is too weak. It must be at least 6 characters long.';
                        break;
                    case 'auth/invalid-email':
                        message = 'The email address is not valid.';
                        break;
                    default:
                        // Use the message from the Firebase error object for other cases
                        message = firebaseError.message;
                        break;
                }
            }

            setFeedback(`Error: ${message}`);
            // --- END OF CORRECTED LOGIC ---

        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
                <h1 className="text-2xl font-bold text-center">Register Your Institute</h1>
                <form onSubmit={handleSignUp} className="space-y-4">
                    <input type="text" placeholder="Institute Name" value={instituteName} onChange={(e) => setInstituteName(e.target.value)} className="w-full p-2 border rounded" required />
                    <input type="text" placeholder="Your Full Name" value={adminName} onChange={(e) => setAdminName(e.target.value)} className="w-full p-2 border rounded" required />
                    <input type="email" placeholder="Your Email (Admin)" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} className="w-full p-2 border rounded" required />
                    <input type="password" placeholder="Password" value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} className="w-full p-2 border rounded" required minLength={6} />
                    <button type="submit" disabled={isSubmitting} className="w-full px-4 py-2 font-semibold text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:bg-gray-400">
                        {isSubmitting ? 'Registering...' : 'Create Institute'}
                    </button>
                    {feedback && <p className={`mt-2 text-sm text-center ${feedback.includes('✅') ? 'text-green-600' : 'text-red-600'}`}>{feedback}</p>}
                </form>
                <div className="text-center mt-4">
                    <Link href="/login" className="text-sm text-indigo-600 hover:underline">
                        Already have an account? Log In
                    </Link>
                </div>
            </div>
        </div>
    );
}