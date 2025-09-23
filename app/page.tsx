import Link from 'next/link';
import Image from 'next/image';
import { ShieldCheck } from 'lucide-react'; // For the small icon

export default function HomePage() {
  return (
    <div className="bg-[#1a1a2e] text-white min-h-screen flex flex-col font-sans">
      {/* Header/Navigation */}
      <header className="w-full max-w-7xl mx-auto py-5 px-6 sm:px-8">
        <nav className="flex items-center justify-between">
          <div className="text-2xl font-bold tracking-wider">
            IntelliAttend
          </div>
          <div className="hidden md:flex items-center space-x-8 text-sm font-medium text-gray-300">
            <Link href="#features" className="hover:text-white transition-colors">
              Features
            </Link>
            <Link href="/dashboard" className="hover:text-white transition-colors">
              Dashboard
            </Link>
            <Link href="#security" className="hover:text-white transition-colors">
              Security
            </Link>
            <Link href="#pricing" className="hover:text-white transition-colors">
              Pricing
            </Link>
          </div>
          <div>
            <Link href="/login" className="px-6 py-2.5 bg-[#8A2BE2] text-white rounded-lg font-semibold hover:bg-[#7b24cc] transition-colors text-sm">
              Login
            </Link>
          </div>
        </nav>
      </header>

      {/* Main Hero Section */}
      <main className="flex-grow flex items-center w-full max-w-7xl mx-auto px-6 sm:px-8 py-12 md:py-0">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          
          {/* Left Column: Text and CTAs */}
          <div className="text-center md:text-left">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight">
              Smarter Attendance,
              <br />
              Effortlessly Secure
            </h1>
            <p className="mt-4 text-lg text-gray-300 max-w-xl mx-auto md:mx-0">
              AI-Powered, Multi-Role System with On-Device Face Recognition and Liveness Detection.
            </p>
            <div className="mt-8 flex justify-center md:justify-start space-x-4">
              <Link href="/request-demo" className="px-8 py-3 bg-[#8A2BE2] text-white rounded-lg font-semibold hover:bg-[#7b24cc] transition-transform hover:scale-105">
                Request Demo
              </Link>
              <Link href="/learn-more" className="px-8 py-3 bg-transparent border-2 border-gray-500 text-white rounded-lg font-semibold hover:bg-gray-700 hover:border-gray-700 transition-colors">
                Learn More
              </Link>
            </div>
          </div>

          {/* Right Column: Image Graphic */}
          <div className="relative flex justify-center items-center">
            <Image 
              src="image.jpeg" // IMPORTANT: Make sure this path is correct!
              alt="AI powered face recognition wireframe graphic"
              width={600}
              height={600}
              quality={100}
              priority
              className="object-contain"
            />
            <div className="absolute bottom-4 right-4 md:bottom-8 md:right-8 bg-black bg-opacity-30 backdrop-blur-sm text-white px-3 py-2 rounded-lg flex items-center space-x-2 text-sm">
              <ShieldCheck size={18} className="text-purple-400" />
              <span>Liveness Detection</span>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}