'use client';
import { useAuth } from '../context/AuthContext';
import { auth } from '../lib/firebase';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { Bars3Icon } from '@heroicons/react/24/outline';

export default function Header({ toggleSidebar }: { toggleSidebar: () => void }) {
  const { userProfile } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      window.location.href = '/login';
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };

  return (
    <header className="bg-white shadow-sm p-4 flex justify-between items-center z-10">
      {/* Hamburger Menu Button - visible only on mobile */}
      <button onClick={toggleSidebar} className="md:hidden p-2">
        <Bars3Icon className="h-6 w-6 text-gray-700" />
      </button>

      {/* Welcome Message - hidden on mobile, visible on desktop */}
      <div className="hidden md:block">
        {/* You can add a dynamic page title here later */}
      </div>

      <div className="flex items-center space-x-4">
        <span className="text-sm md:text-base text-gray-600">Welcome, {userProfile?.name}</span>
        <button onClick={handleLogout} className="px-4 py-2 bg-red-500 text-white text-sm font-semibold rounded-lg hover:bg-red-600">
          Logout
        </button>
      </div>
    </header>
  );
}