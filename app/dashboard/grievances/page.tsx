'use client';

import { useState, useEffect } from 'react';
import { db } from '../../../lib/firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, Timestamp } from 'firebase/firestore';
import { useAuth } from '../../../context/AuthContext';

interface Grievance {
  id: string;
  studentName: string;
  studentId: string;
  requestDate: Timestamp;
  status: string;
}

export default function GrievancePage() {
  const { userProfile } = useAuth();
  const [grievances, setGrievances] = useState<Grievance[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const q = query(collection(db, 'grievances'), where('status', '==', 'pending'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setGrievances(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Grievance)));
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleApprove = async (grievance: Grievance) => {
    if (!userProfile) return;
    try {
      // Grant permission on the user's document
      await updateDoc(doc(db, 'users', grievance.studentId), {
        updateFaceAllowed: true
      });
      // Update the grievance status
      await updateDoc(doc(db, 'grievances', grievance.id), {
        status: 'approved',
        reviewedBy: userProfile.name,
      });
      alert(`${grievance.studentName}'s request has been approved.`);
    } catch (error) {
      console.error("Error approving grievance:", error);
      alert("Failed to approve request.");
    }
  };

  const handleReject = async (grievance: Grievance) => {
    if (!userProfile) return;
    try {
      // Update the grievance status
      await updateDoc(doc(db, 'grievances', grievance.id), {
        status: 'rejected',
        reviewedBy: userProfile.name,
      });
      alert(`${grievance.studentName}'s request has been rejected.`);
    } catch (error) {
      console.error("Error rejecting grievance:", error);
       alert("Failed to reject request.");
    }
  };

  if (loading) {
    return <div>Loading pending grievances...</div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Review Face Update Requests</h1>
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full text-left text-sm font-light">
          <thead className="border-b bg-gray-100 font-medium">
            <tr>
              <th scope="col" className="px-6 py-4">Student Name</th>
              <th scope="col" className="px-6 py-4">Request Date</th>
              <th scope="col" className="px-6 py-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {grievances.length > 0 ? (
              grievances.map((grievance) => (
                <tr key={grievance.id} className="border-b">
                  <td className="whitespace-nowrap px-6 py-4 font-medium">{grievance.studentName}</td>
                  <td className="whitespace-nowrap px-6 py-4">
                    {grievance.requestDate?.toDate().toLocaleString() || '...'}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 space-x-4">
                    <button 
                      onClick={() => handleApprove(grievance)}
                      className="font-semibold text-green-600 hover:text-green-800"
                    >
                      Approve
                    </button>
                    <button 
                      onClick={() => handleReject(grievance)}
                      className="font-semibold text-red-600 hover:text-red-800"
                    >
                      Reject
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={3} className="text-center p-6 text-gray-500">
                  No pending grievances found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}