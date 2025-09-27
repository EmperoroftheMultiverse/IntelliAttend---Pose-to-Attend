'use client';

import { useState, useEffect } from 'react';
import { db } from '../../../../lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import Link from 'next/link';
import { useAuth } from '../../../../context/AuthContext';

interface Subject {
  id: string;
  subjectName: string;
  subjectCode: string;
  professorId: string;
}

// NEW: Interface for our user lookup map
interface UserMap {
  [id: string]: string; // Maps UID to Name
}

export default function AdminSubjectsPage() {
  const { instituteId } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [usersMap, setUsersMap] = useState<UserMap>({}); // NEW: State for the user map
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!instituteId) return;
    const fetchAllData = async () => {
      setLoading(true);
      
      // 1. Fetch all users to create the name map
      const usersSnapshot = await getDocs(collection(db, 'institutes', instituteId, 'users'));
      const userMap: UserMap = {};
      usersSnapshot.forEach(doc => {
        userMap[doc.id] = doc.data().name;
      });
      setUsersMap(userMap);

      // 2. Fetch all subjects
      const subjectsSnapshot = await getDocs(collection(db, 'institutes', instituteId, 'subjects'));
      const subjectsList = subjectsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Subject));
      setSubjects(subjectsList);

      setLoading(false);
    };

    fetchAllData();
  }, [instituteId]);

  if (loading) return <div>Loading all subjects...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">All Institute Subjects</h1>
      <div className="bg-white shadow-md rounded-lg">
        <ul className="divide-y divide-gray-200">
          {subjects.map((subject) => (
            <li key={subject.id}>
              {/* FIX: Wrap the content in a Link component */}
              <Link href={`/dashboard/subjects/${subject.id}`}>
                <div className="block p-4 hover:bg-gray-50 transition-colors">
                  <p className="font-semibold text-indigo-600">{subject.subjectName}</p>
                  <p className="text-sm text-gray-500">{subject.subjectCode}</p>
                  {/* FIX: Look up the professor's name from the map */}
                  <p className="text-xs text-gray-400 mt-1">
                    Professor: {usersMap[subject.professorId] || '...'}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}