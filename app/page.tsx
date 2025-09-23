import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-4xl font-bold">Welcome to IntelliAttend</h1>
      <Link href="/dashboard" className="mt-4 px-4 py-2 text-white bg-indigo-600 rounded hover:bg-indigo-700">
        Go to Dashboard
      </Link>
    </div>
  );
}