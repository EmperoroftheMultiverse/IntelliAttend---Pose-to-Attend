'use client';

import { useState, useEffect, useMemo } from 'react';
import { db } from '../../../../lib/firebase';
import { collection, query, where, onSnapshot, doc, getDoc, Timestamp, orderBy, getDocs } from 'firebase/firestore';
import AttendanceChart from '../../../../components/AttendanceChart'; // Import the chart
import { useAuth } from '../../../../context/AuthContext';

interface AttendanceRecord {
  id: string;
  subjectId: string;
  timestamp: Timestamp;
}

interface StudentDetails {
  name: string;
  email: string;
}

export default function StudentDetailPage({ params: { studentId } }: { params: { studentId: string } }) {
  const { instituteId } = useAuth();
  const [studentDetails, setStudentDetails] = useState<StudentDetails | null>(null);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [subjectsMap, setSubjectsMap] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(true);
  const [timePeriod, setTimePeriod] = useState('daily');

  useEffect(() => {
    if (!instituteId) return;
    if (!studentId) return;

    const fetchSubjectsMap = async () => {
      const querySnapshot = await getDocs(collection(db, 'institutes', instituteId, "subjects"));
      const map: { [key: string]: string } = {};
      querySnapshot.forEach((doc) => {
        map[doc.id] = doc.data().subjectName;
      });
      setSubjectsMap(map);
    };

    fetchSubjectsMap();

    // Fetch the student's details (name, email)
    const fetchStudentDetails = async () => {
      const docRef = doc(db, 'institutes', instituteId, 'users', studentId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setStudentDetails(docSnap.data() as StudentDetails);
      }
    };

    fetchStudentDetails();

    // Set up a real-time listener for this student's attendance
    const q = query(
      collection(db, 'institutes', instituteId, 'attendance'),
      where('studentId', '==', studentId),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const records: AttendanceRecord[] = [];
      querySnapshot.forEach((doc) => {
        records.push({ id: doc.id, ...doc.data() } as AttendanceRecord);
      });
      setAttendance(records);
      setLoading(false);
    });

    return () => unsubscribe(); // Cleanup the listener
  }, [studentId]);

  const chartData = useMemo(() => {
    const counts: { [key: string]: number } = {};

    if (!attendance) return [];

    attendance.forEach(record => {
      const date = record.timestamp.toDate();
      let key = '';

      switch (timePeriod) {
        case 'weekly':
          // Group by week number and year
          const weekStart = new Date(date.setDate(date.getDate() - date.getDay()));
          key = weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          break;
        case 'monthly':
          // Group by month and year
          key = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
          break;
        case 'daily':
        default:
          // Group by specific day
          key = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          break;
      }

      if (counts[key]) {
        counts[key]++;
      } else {
        counts[key] = 1;
      }
    });

    return Object.keys(counts).map(key => ({
      date: key,
      present: counts[key],
    })).reverse();
  }, [attendance, timePeriod]); // Re-run only when attendance data or timePeriod changes



  if (loading) {
    return <div>Loading student's attendance data...</div>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold">{studentDetails?.name}</h1>
      <p className="text-lg text-gray-600 mb-6">{studentDetails?.email} - Attendance History</p>
      <div className="mb-6 bg-white p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-gray-700">Attendance Trend</h3>
          <div className="flex space-x-2">
            <button onClick={() => setTimePeriod('daily')} className={`px-3 py-1 text-sm rounded-md ${timePeriod === 'daily' ? 'bg-indigo-600 text-white' : 'bg-gray-200'}`}>Daily</button>
            <button onClick={() => setTimePeriod('weekly')} className={`px-3 py-1 text-sm rounded-md ${timePeriod === 'weekly' ? 'bg-indigo-600 text-white' : 'bg-gray-200'}`}>Weekly</button>
            <button onClick={() => setTimePeriod('monthly')} className={`px-3 py-1 text-sm rounded-md ${timePeriod === 'monthly' ? 'bg-indigo-600 text-white' : 'bg-gray-200'}`}>Monthly</button>
          </div>
        </div>
        <AttendanceChart data={chartData} />
      </div>

      <div className="w-full bg-white shadow-md rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
        </div>
      </div>
      <table className="min-w-full text-left text-sm font-light">
        <thead className="border-b bg-gray-100 font-medium">
          <tr>
            <th scope="col" className="px-6 py-4">Date & Time</th>
            <th scope="col" className="px-6 py-4">Subject</th> {/* 👈 Change column header */}
          </tr>
        </thead>
        <tbody>
          {attendance.map((record) => (
            <tr key={record.id} className="border-b">
              <td className="whitespace-nowrap px-6 py-4">{record.timestamp.toDate().toLocaleString()}</td>
              {/* 👇 Use the map to look up the name */}
              <td className="whitespace-nowrap px-6 py-4 font-medium">{subjectsMap[record.subjectId] || record.subjectId}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}