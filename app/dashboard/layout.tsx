'use client';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth(); // 👈 Get the new loading state
  const router = useRouter();

  useEffect(() => {
    // Only run this check if loading is complete
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]); // 👈 Add loading to the dependency array

  // Show a full-page loading indicator while Firebase is verifying the user
  if (loading) {
    return (
        <div className="flex h-screen items-center justify-center">
            <div>Loading Session...</div>
        </div>
    );
  }

  // If loading is done and there is a user, show the dashboard
  return user ? (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header /> {/* 👈 Add Header component */}
        <main className="flex-1 p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  ) : null;
}