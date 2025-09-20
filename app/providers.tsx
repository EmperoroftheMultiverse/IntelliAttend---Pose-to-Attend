'use client';

// This component will wrap all other client-side context providers
import { AuthContextProvider } from '../context/AuthContext';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthContextProvider>
      {children}
    </AuthContextProvider>
  );
}