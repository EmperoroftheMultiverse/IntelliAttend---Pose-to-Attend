'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../context/AuthContext'; // Import useAuth

export default function Sidebar() {
  const pathname = usePathname();
  const { userProfile } = useAuth(); // Get user role

  // Define links for each role
  const adminLinks = [
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'All Subjects', href: '/dashboard/admin/subjects' },
    { name: 'All Users', href: '/dashboard/admin/users' },
    { name: 'Grievances', href: '/dashboard/grievances' }
  ];
  const professorLinks = [
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'My Subjects', href: '/dashboard/subjects' },
    { name: 'Students', href: '/dashboard/students' },
    { name: 'Grievances', href: '/dashboard/grievances' }
  ];
  const studentLinks = [
    { name: 'My Dashboard', href: '/dashboard' },
    { name: 'Subjects', href: '/dashboard/student-subjects' },
    { name: 'My Profile', href: '/dashboard/profile' }
  ];

  // Determine which links to show based on the user's role
  let navLinks = studentLinks; // Default to student
  if (userProfile?.role === 'admin') {
    navLinks = adminLinks;
  } else if (userProfile?.role === 'professor') {
    navLinks = professorLinks;
  }
  
  return (
    <aside className="w-64 bg-gray-800 text-white p-4 flex flex-col">
      <h2 className="text-xl font-bold mb-6">IntelliAttend</h2>
      <nav className="flex-1">
        <ul>
          {navLinks.map((link) => {
            // Check for both exact match and startsWith for nested routes
            const isActive = pathname === link.href || pathname.startsWith(link.href + '/');
            return (
              <li key={link.name} className="mb-2">
                <Link href={link.href}
                  className={`block py-2 px-3 rounded transition-colors ${isActive ? 'bg-indigo-600' : 'hover:bg-gray-700'}`}>
                  {link.name}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      {/* Add a footer for user info or logout button later */}
      <div className="mt-auto">
          <p className="text-xs text-gray-400">Logged in as:</p>
          <p className="font-semibold truncate">{userProfile?.email}</p>
      </div>
    </aside>
  );
}