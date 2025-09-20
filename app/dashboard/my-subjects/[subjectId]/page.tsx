'use client';

import { useState, useEffect, useMemo } from 'react';
import { db } from '../../../../lib/firebase';
import { collection, query, where, onSnapshot, doc, getDoc, Timestamp, orderBy, limit } from 'firebase/firestore';
import { useAuth } from '../../../../context/AuthContext';
import AttendanceChart from '../../../../components/AttendanceChart';
import Link from 'next/link';

// Interfaces
interface AttendanceRecord { id: string; timestamp: Timestamp; }
interface SubjectDetails { subjectName: string; subjectCode: string; }

export default function MySubjectDetailPage({ params: { subjectId } }: { params: { subjectId: string } }) {
  const { user } = useAuth();
  const [subjectDetails, setSubjectDetails] = useState<SubjectDetails | null>(null);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [timePeriod, setTimePeriod] = useState('daily');
  const [isSessionActive, setIsSessionActive] = useState(false); // NEW state for session status

  useEffect(() => {
    if (!user || !subjectId) return;

    // Listener for subject details (name, code)
    const subjectUnsubscribe = onSnapshot(doc(db, 'subjects', subjectId), (docSnap) => {
      if (docSnap.exists()) setSubjectDetails(docSnap.data() as SubjectDetails);
    });

    // Listener for this student's attendance in this subject
    const attendanceQuery = query(
      collection(db, 'attendance'),
      where('studentId', '==', user.uid),
      where('subjectId', '==', subjectId),
      orderBy('timestamp', 'desc')
    );
    const attendanceUnsubscribe = onSnapshot(attendanceQuery, (snapshot) => {
      setAttendance(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AttendanceRecord)));
      setLoading(false);
    });

    // NEW: Listener for the active session, just like the professor's page
    const sessionsQuery = query(
      collection(db, 'subjects', subjectId, 'sessions'),
      where('isActive', '==', true),
      limit(1)
    );
    const sessionUnsubscribe = onSnapshot(sessionsQuery, (snapshot) => {
      setIsSessionActive(!snapshot.empty); // If the query finds a document, a session is active
    });

    // Cleanup all listeners
    return () => {
      subjectUnsubscribe();
      attendanceUnsubscribe();
      sessionUnsubscribe();
    };
  }, [user, subjectId]);
  
  const chartData = useMemo(() => {
    const counts: { [key: string]: number } = {};
    attendance.forEach(record => {
      const date = record.timestamp.toDate();
      let key = '';
      switch (timePeriod) {
        case 'weekly':
          const weekStart = new Date(date.setDate(date.getDate() - date.getDay()));
          key = weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          break;
        case 'monthly':
          key = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
          break;
        default:
          key = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          break;
      }
      if (counts[key]) counts[key]++; else counts[key] = 1;
    });
    return Object.keys(counts).map(key => ({ date: key, present: counts[key] })).reverse();
  }, [attendance, timePeriod]);
  
  if (loading) return <div>Loading subject analysis...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">{subjectDetails?.subjectName}</h1>
          <p className="text-lg text-gray-600">{subjectDetails?.subjectCode} - My Attendance</p>
        </div>
        {/* FIX: Use the new isSessionActive state to render the button */}
        {isSessionActive && (
          <Link href={`/dashboard/check-in/${subjectId}`}>
            <div className="px-6 py-3 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 animate-pulse">
              Mark My Attendance
            </div>
          </Link>
        )}
      </div>
      
      <div className="my-6 bg-white p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-gray-700">My Attendance Trend</h3>
            <div className="flex space-x-2">
                <button onClick={() => setTimePeriod('daily')} className={`px-3 py-1 text-sm rounded-md ${timePeriod === 'daily' ? 'bg-indigo-600 text-white' : 'bg-gray-200'}`}>Daily</button>
                <button onClick={() => setTimePeriod('weekly')} className={`px-3 py-1 text-sm rounded-md ${timePeriod === 'weekly' ? 'bg-indigo-600 text-white' : 'bg-gray-200'}`}>Weekly</button>
                <button onClick={() => setTimePeriod('monthly')} className={`px-3 py-1 text-sm rounded-md ${timePeriod === 'monthly' ? 'bg-indigo-600 text-white' : 'bg-gray-200'}`}>Monthly</button>
            </div>
        </div>
        <AttendanceChart data={chartData} />
      </div>

      <div className="w-full bg-white shadow-md rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b"><h2 className="text-xl font-semibold">My Check-in History</h2></div>
        <table className="min-w-full text-left text-sm font-light">
          <thead className="border-b bg-gray-100 font-medium">
            <tr><th scope="col" className="px-6 py-4">Date & Time</th></tr>
          </thead>
          <tbody>
            {attendance.map(record => (
              <tr key={record.id} className="border-b">
                <td className="whitespace-nowrap px-6 py-4">{record.timestamp.toDate().toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

