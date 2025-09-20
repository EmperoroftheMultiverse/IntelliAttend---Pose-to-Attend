import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers'; // 👈 Import the new Providers component

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'IntelliAttend',
  description: 'AI-Powered Smart Attendance',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers> {/* 👈 Use the Providers component to wrap your children */}
          {children}
        </Providers>
      </body>
    </html>
  );
}