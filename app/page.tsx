import Link from 'next/link';
import { ShieldCheckIcon, UserGroupIcon, ChartBarIcon } from '@heroicons/react/24/outline';

export default function HomePage() {
  return (
    <div className="bg-gray-50 text-gray-800">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md shadow-sm">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-indigo-600">IntelliAttend</h1>
          <Link href="/dashboard" className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 transition-colors">
            Login
          </Link>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="min-h-screen flex items-center justify-center bg-white pt-20">
          <div className="container mx-auto px-6 text-center">
            <h2 className="text-4xl md:text-6xl font-extrabold text-gray-900 leading-tight mb-4">
              The Future of Academic Attendance is Here.
            </h2>
            <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto mb-8">
              IntelliAttend is a smart, seamless attendance platform using AI-powered face recognition to save time, eliminate errors, and provide powerful insights.
            </p>
            <div>
              <Link href="/signup" className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-full shadow-lg hover:bg-indigo-700 transition-transform hover:scale-105">
                Sign Up Your Institute
              </Link>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20">
          <div className="container mx-auto px-6">
            <h3 className="text-3xl font-bold text-center mb-12">Why Choose IntelliAttend?</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <div className="bg-white p-8 rounded-lg shadow-lg text-center">
                <ShieldCheckIcon className="h-12 w-12 mx-auto mb-4 text-indigo-500" />
                <h4 className="text-xl font-semibold mb-2">Secure & Proxy-Proof</h4>
                <p className="text-gray-600">
                  Our on-device face recognition with liveness and geolocation checks ensures academic integrity by eliminating proxy attendance.
                </p>
              </div>
              {/* Feature 2 */}
              <div className="bg-white p-8 rounded-lg shadow-lg text-center">
                <UserGroupIcon className="h-12 w-12 mx-auto mb-4 text-indigo-500" />
                <h4 className="text-xl font-semibold mb-2">Multi-Role Portals</h4>
                <p className="text-gray-600">
                  Dedicated, secure dashboards for Institute Admins, Professors, and Students, each with tools tailored to their specific needs.
                </p>
              </div>
              {/* Feature 3 */}
              <div className="bg-white p-8 rounded-lg shadow-lg text-center">
                <ChartBarIcon className="h-12 w-12 mx-auto mb-4 text-indigo-500" />
                <h4 className="text-xl font-semibold mb-2">Powerful Analytics</h4>
                <p className="text-gray-600">
                  Go beyond simple logs. Visualize attendance trends daily, weekly, or monthly to gain actionable insights and support student success.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-6">
        <div className="container mx-auto px-6 text-center">
          <p>&copy; {new Date().getFullYear()} IntelliAttend. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}