'use client';

import { useState, useEffect } from 'react';
import { db } from '../../../lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import Link from 'next/link';

interface Student {
  id: string; // This will be the user's UID
  name: string;
  email: string;
}

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStudents = async () => {
      setLoading(true);
      // Query to get all documents from the 'users' collection where the role is 'student'
      const q = query(collection(db, 'users'), where('role', '==', 'student'));
      
      const querySnapshot = await getDocs(q);
      const studentsList: Student[] = [];
      querySnapshot.forEach((doc) => {
        studentsList.push({ id: doc.id, ...doc.data() } as Student);
      });
      
      setStudents(studentsList);
      setLoading(false);
    };

    fetchStudents();
  }, []);

  if (loading) {
    return <div>Loading student list...</div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">All Students</h1>
      <div className="bg-white shadow-md rounded-lg">
        <ul className="divide-y divide-gray-200">
          {students.map((student) => (
            <li key={student.id}>
              <Link href={`/dashboard/students/${student.id}`}>
                <div className="block p-4 hover:bg-gray-50 transition-colors">
                  <p className="font-semibold text-indigo-600">{student.name}</p>
                  <p className="text-sm text-gray-500">{student.email}</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}