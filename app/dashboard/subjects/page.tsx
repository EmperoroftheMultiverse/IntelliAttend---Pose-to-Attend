'use client';

import { useState, useEffect, FormEvent, useCallback } from 'react';
import { db } from '../../../lib/firebase';
import { collection, query, where, getDocs, addDoc, doc, deleteDoc } from 'firebase/firestore';
import { useAuth } from '../../../context/AuthContext';
import Link from 'next/link';

interface Subject {
  id: string;
  subjectName: string;
  subjectCode: string;
}

export default function SubjectsPage() {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newSubjectCode, setNewSubjectCode] = useState('');

  // Function to fetch subjects
  const fetchSubjects = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const q = query(collection(db, 'subjects'), where('professorId', '==', user.uid));
    const querySnapshot = await getDocs(q);
    const subjectsList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Subject));
    setSubjects(subjectsList);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchSubjects();
  }, [fetchSubjects]);

  // Handle form submission to create a new subject
  const handleCreateSubject = async (e: FormEvent) => {
    e.preventDefault();
    if (!user || !newSubjectName || !newSubjectCode) return;

    try {
      await addDoc(collection(db, 'subjects'), {
        subjectName: newSubjectName,
        subjectCode: newSubjectCode,
        professorId: user.uid,
      });
      // Reset form and close modal
      setShowModal(false);
      setNewSubjectName('');
      setNewSubjectCode('');
      // Refresh the list of subjects
      fetchSubjects();
    } catch (error) {
      console.error("Error adding document: ", error);
    }
  };
  
  // Handle deleting a subject
  const handleDeleteSubject = async (subjectId: string) => {
    if(confirm('Are you sure you want to delete this subject and all its records?')) {
        try {
            await deleteDoc(doc(db, 'subjects', subjectId));
            // Note: In a production app, you would also delete all associated attendance records.
            fetchSubjects(); // Refresh the list
        } catch (error) {
            console.error("Error deleting document: ", error);
        }
    }
  };


  if (loading) return <div>Loading your subjects...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Subjects</h1>
        <button onClick={() => setShowModal(true)} className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700">
          + Create Subject
        </button>
      </div>

      {/* Subject List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {subjects.map((subject) => (
          <div key={subject.id} className="p-6 bg-white rounded-lg shadow-md flex flex-col justify-between">
            <Link href={`/dashboard/subjects/${subject.id}`}>
                <h2 className="text-xl font-semibold text-indigo-600 hover:underline">{subject.subjectName}</h2>
                <p className="text-gray-500">{subject.subjectCode}</p>
            </Link>
            <button onClick={() => handleDeleteSubject(subject.id)} className="mt-4 text-sm text-red-500 hover:text-red-700 self-end">
                Delete
            </button>
          </div>
        ))}
      </div>

      {/* Create Subject Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
            <h2 className="text-2xl font-bold mb-4">Create New Subject</h2>
            <form onSubmit={handleCreateSubject}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Subject Name</label>
                <input type="text" value={newSubjectName} onChange={(e) => setNewSubjectName(e.target.value)} className="w-full mt-1 p-2 border rounded-md" required />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700">Subject Code</label>
                <input type="text" value={newSubjectCode} onChange={(e) => setNewSubjectCode(e.target.value)} className="w-full mt-1 p-2 border rounded-md" required />
              </div>
              <div className="flex justify-end space-x-4">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 bg-gray-200 rounded-lg">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}