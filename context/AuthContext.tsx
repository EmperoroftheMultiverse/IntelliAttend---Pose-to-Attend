'use client';
import { useContext, createContext, useState, useEffect, ReactNode } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

interface UserProfile {
  name: string;
  email: string;
  role: 'student' | 'professor' | 'admin';
  updateFaceAllowed?: boolean;
  year?: number;
  instituteId?: string;
}

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean; // 👈 Add loading state to the type
  instituteId: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthContextProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true); // 👈 Initialize loading as true
  const [instituteId, setInstituteId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Get the token to read custom claims
        const tokenResult = await currentUser.getIdTokenResult(true);
        console.log("TOKEN CLAIMS:", tokenResult.claims);
        const currentInstituteId = tokenResult.claims.instituteId as string || null;
        setInstituteId(currentInstituteId);

        if (currentInstituteId) {
          const docRef = doc(db, 'institutes', currentInstituteId, 'users', currentUser.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setUserProfile(docSnap.data() as UserProfile);
          } else {
            setUserProfile(null);
          }
        } else {
          // This can happen briefly during sign-up before the claim is set.
          console.log("No instituteId found on token.");
          setUserProfile(null);
        }
      } else {
        setUserProfile(null);
        setInstituteId(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);


  return (
    <AuthContext.Provider value={{ user, userProfile, loading, instituteId }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthContextProvider");
  }
  return context;
};