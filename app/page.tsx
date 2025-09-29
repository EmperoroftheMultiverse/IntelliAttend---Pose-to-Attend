'use client';

import Link from 'next/link';
import { ShieldCheckIcon, UserGroupIcon, ChartBarIcon, ArrowDownIcon } from '@heroicons/react/24/outline';
import { motion, Variants, AnimatePresence } from 'framer-motion'; // Import Framer Motion
import { useState } from 'react';
import LoginModal from '../components/LoginModal'; // Import the new modal
import SignUpModal from '../components/SignUpModal'; // Import the new modal

export default function HomePage() {
  const [modalOpen, setModalOpen] = useState<'login' | 'signup' | null>(null);

  const sectionVariants: Variants = {
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
  };

  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  };

  return (
    <div className="bg-slate-50 text-slate-800">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md shadow-sm">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-indigo-600">IntelliAttend</h1>
          <button onClick={() => setModalOpen('login')} className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 transition-colors">
            Login
          </button>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <motion.section
          initial="hidden"
          animate="visible"
          variants={sectionVariants}
          className="min-h-screen flex items-center justify-center bg-white pt-20 text-center"
        >
          <div className="container mx-auto px-6">
            <h2 className="text-4xl md:text-6xl font-extrabold text-slate-900 leading-tight mb-4">
              The Future of Academic Attendance is Here.
            </h2>
            <p className="text-lg md:text-xl text-slate-600 max-w-3xl mx-auto mb-8">
              IntelliAttend is a smart, seamless attendance platform using AI-powered face recognition to save time, eliminate errors, and provide powerful insights.
            </p>
            <div>
              <button onClick={() => setModalOpen('signup')} className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-full shadow-lg hover:bg-indigo-700 transition-transform hover:scale-105">
                Sign Up Your Institute
              </button>
            </div>
          </div>
        </motion.section>

        {/* How It Works Section */}
        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={sectionVariants}
          className="py-20 text-center"
        >
          <div className="container mx-auto px-6">
            <h3 className="text-3xl font-bold mb-12">Simple Steps to a Smarter Campus</h3>
            <div className="flex flex-col md:flex-row items-center justify-center gap-8">
              <div className="flex-1 text-center">
                <p className="text-xl font-semibold mb-2">1. Professor Starts Session</p>
                <p className="text-slate-600">From the dashboard, a professor starts the attendance session for a specific class and year.</p>
              </div>
              <ArrowDownIcon className="h-8 w-8 text-indigo-400 md:rotate-[-90deg]" />
              <div className="flex-1 text-center">
                <p className="text-xl font-semibold mb-2">2. Student Secure Check-in</p>
                <p className="text-slate-600">Students use their phone to pass a liveness and location check, then verify with their face.</p>
              </div>
              <ArrowDownIcon className="h-8 w-8 text-indigo-400 md:rotate-[-90deg]" />
              <div className="flex-1 text-center">
                <p className="text-xl font-semibold mb-2">3. View Real-time Data</p>
                <p className="text-slate-600">Attendance is logged instantly, and professors can view live analytics and manage records.</p>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Features Section */}
        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={sectionVariants}
          className="py-20 bg-white"
        >
          <div className="container mx-auto px-6">
            <h3 className="text-3xl font-bold text-center mb-12">Why Choose IntelliAttend?</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <div className="glassmorphism p-8 rounded-lg shadow-lg text-center">
                <ShieldCheckIcon className="h-12 w-12 mx-auto mb-4 text-indigo-500" />
                <h4 className="text-xl font-semibold mb-2">Secure & Proxy-Proof</h4>
                <p className="text-gray-600">
                  Our on-device face recognition with liveness and geolocation checks ensures academic integrity by eliminating proxy attendance.
                </p>
              </div>
              {/* Feature 2 */}
              <div className="glassmorphism p-8 rounded-lg shadow-lg text-center">
                <UserGroupIcon className="h-12 w-12 mx-auto mb-4 text-indigo-500" />
                <h4 className="text-xl font-semibold mb-2">Multi-Role Portals</h4>
                <p className="text-gray-600">
                  Dedicated, secure dashboards for Institute Admins, Professors, and Students, each with tools tailored to their specific needs.
                </p>
              </div>
              {/* Feature 3 */}
              <div className="glassmorphism p-8 rounded-lg shadow-lg text-center">
                <ChartBarIcon className="h-12 w-12 mx-auto mb-4 text-indigo-500" />
                <h4 className="text-xl font-semibold mb-2">Powerful Analytics</h4>
                <p className="text-gray-600">
                  Go beyond simple logs. Visualize attendance trends daily, weekly, or monthly to gain actionable insights and support student success.
                </p>
              </div>
            </div>
          </div>
        </motion.section>
      </main>

      {/* Footer */}
      <footer className="bg-slate-800 text-white py-6">
        <div className="container mx-auto px-6 text-center">
          <p>&copy; {new Date().getFullYear()} IntelliAttend. All rights reserved.</p>
        </div>
      </footer>
      <AnimatePresence>
        {modalOpen && (
          <motion.div
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={backdropVariants}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={() => setModalOpen(null)} // Close modal on backdrop click
          >
            <div onClick={(e) => e.stopPropagation()}>
              {/* This prevents the modal from closing when you click inside it */}
              {modalOpen === 'login' && <LoginModal closeModal={() => setModalOpen(null)} />}
              {modalOpen === 'signup' && <SignUpModal closeModal={() => setModalOpen(null)} />}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}