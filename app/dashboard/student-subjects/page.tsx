'use client';

import { useState, useEffect } from 'react';
import { db } from '../../../lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useAuth } from '../../../context/AuthContext';
import Link from 'next/link';

interface Subject {
  id: string;
  subjectName: string;
  subjectCode: string;
}

export default function StudentSubjectsPage() {
  const { userProfile } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userProfile || userProfile.role !== 'student') return;

    const fetchSubjects = async () => {
      setLoading(true);
      const q = query(collection(db, 'subjects'), where('year', '==', userProfile.year));
      const querySnapshot = await getDocs(q);
      const subjectsList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Subject));
      setSubjects(subjectsList);
      setLoading(false);
    };

    fetchSubjects();
  }, [userProfile]);

  if (loading) return <div>Loading subjects for your year...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Subjects for Year {userProfile?.year}</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {subjects.map((subject) => (
          <Link key={subject.id} href={`/dashboard/my-subjects/${subject.id}`}>
            <div className="block p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
              <h2 className="text-xl font-semibold text-indigo-600">{subject.subjectName}</h2>
              <p className="text-gray-500">{subject.subjectCode}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}