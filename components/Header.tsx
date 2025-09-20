'use client';
import { useAuth } from '../context/AuthContext';
import { auth } from '../lib/firebase';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';

export default function Header() {
  const { userProfile } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push('/login');
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };

  return (
    <header className="bg-white shadow-sm p-4 flex justify-between items-center">
      <div>
        {/* You can add a dynamic page title here later */}
      </div>
      <div className="flex items-center space-x-4">
        <span className="text-gray-600">Welcome, {userProfile?.name}</span>
        <button onClick={handleLogout} className="px-4 py-2 bg-red-500 text-white text-sm font-semibold rounded-lg hover:bg-red-600">
          Logout
        </button>
      </div>
    </header>
  );
}