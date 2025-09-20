'use client';

import { useState, useEffect, FormEvent, useMemo } from 'react';
import { db } from '../../../../lib/firebase';
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  getDoc,
  getDocs,
  Timestamp,
  orderBy,
  addDoc,
  deleteDoc,
  updateDoc,
  limit
} from 'firebase/firestore';
import AttendanceChart from '../../../../components/AttendanceChart';

// TypeScript Interfaces for our data structures
interface AttendanceRecord {
  id: string;
  studentName: string;
  timestamp: Timestamp;
}

interface SubjectDetails {
  subjectName: string;
  subjectCode: string;
}

interface Student {
  id: string;
  name: string;
}

export default function SubjectDetailPage({ params: { subjectId } }: { params: { subjectId: string } }) {
  const [subjectDetails, setSubjectDetails] = useState<SubjectDetails | null>(null);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [timePeriod, setTimePeriod] = useState('daily');
  
  // State for the "Add Entry" modal
  const [showModal, setShowModal] = useState(false);
  const [studentList, setStudentList] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [entryTimestamp, setEntryTimestamp] = useState('');

  // NEW: State for year selection and the active session
  const [selectedYear, setSelectedYear] = useState<number>(1);
  const [activeSession, setActiveSession] = useState<{ id: string; year: number } | null>(null);

  // --- Functions for Session Control (New Model) ---
  const startSession = async () => {
    // Create a new session document in the subcollection
    await addDoc(collection(db, 'subjects', subjectId, 'sessions'), {
      isActive: true,
      year: selectedYear,
      startTime: Timestamp.now(),
    });
  };

  const stopSession = async () => {
    if (activeSession) {
      const sessionRef = doc(db, 'subjects', subjectId, 'sessions', activeSession.id);
      await updateDoc(sessionRef, {
        isActive: false,
        endTime: Timestamp.now(),
      });
    }
  };

  // --- Functions for Manual Editing ---
  const handleDeleteEntry = async (recordId: string) => {
    if (confirm('Are you sure you want to delete this attendance record?')) {
      await deleteDoc(doc(db, 'attendance', recordId));
    }
  };

  const handleAddEntry = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedStudent || !entryTimestamp) {
      alert('Please select a student and a timestamp.');
      return;
    }

    const student = studentList.find(s => s.id === selectedStudent);
    if (!student) return;

    const timestamp = new Date(entryTimestamp);
    
    await addDoc(collection(db, 'attendance'), {
      studentId: student.id,
      studentName: student.name,
      subjectId: subjectId,
      timestamp: Timestamp.fromDate(timestamp),
      date: timestamp.toISOString().split('T')[0],
    });

    setShowModal(false);
    setSelectedStudent('');
    setEntryTimestamp('');
  };

  // --- Main Data Fetching and Real-time Listeners ---
  useEffect(() => {
    if (!subjectId) return;
    setLoading(true);

    const fetchStudents = async () => {
      const q = query(collection(db, 'users'), where('role', '==', 'student'));
      const querySnapshot = await getDocs(q);
      setStudentList(querySnapshot.docs.map(doc => ({ id: doc.id, name: doc.data().name } as Student)));
    };
    fetchStudents();
    
    const subjectDocRef = doc(db, 'subjects', subjectId);
    const subjectUnsubscribe = onSnapshot(subjectDocRef, (doc) => {
        if (doc.exists()) {
            setSubjectDetails(doc.data() as SubjectDetails);
        }
    });

    const attendanceQuery = query(collection(db, 'attendance'), where('subjectId', '==', subjectId), orderBy('timestamp', 'desc'));
    const attendanceUnsubscribe = onSnapshot(attendanceQuery, (snapshot) => {
        setAttendance(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AttendanceRecord)));
        setLoading(false);
    });

    const sessionsQuery = query(collection(db, 'subjects', subjectId, 'sessions'), where('isActive', '==', true), limit(1));
    const sessionUnsubscribe = onSnapshot(sessionsQuery, (snapshot) => {
      if (!snapshot.empty) {
        const sessionDoc = snapshot.docs[0];
        setActiveSession({ id: sessionDoc.id, ...sessionDoc.data() } as { id: string; year: number });
      } else {
        setActiveSession(null);
      }
    });

    return () => {
      subjectUnsubscribe();
      attendanceUnsubscribe();
      sessionUnsubscribe();
    };
  }, [subjectId]);

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

  if (loading) {
    return <div>Loading attendance data for subject...</div>;
  }

  return (
    <div>
      <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold">{subjectDetails?.subjectName}</h1>
          <p className="text-lg text-gray-600">{subjectDetails?.subjectCode}</p>
        </div>
        <div className="flex items-center space-x-2">
          {activeSession ? (
            <>
              <span className="text-sm font-semibold px-3 py-1 rounded-full bg-green-100 text-green-800">
                SESSION ACTIVE FOR YEAR {activeSession.year}
              </span>
              <button onClick={stopSession} className="px-4 py-2 bg-red-600 text-white font-semibold rounded-lg shadow-md hover:bg-red-700">
                Stop Session
              </button>
            </>
          ) : (
            <>
              <select 
                value={selectedYear} 
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="p-2 border rounded-md"
              >
                <option value={1}>Year 1</option>
                <option value={2}>Year 2</option>
                <option value={3}>Year 3</option>
                <option value={4}>Year 4</option>
              </select>
              <button onClick={startSession} className="px-4 py-2 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700">
                Start Session
              </button>
            </>
          )}
          <button onClick={() => setShowModal(true)} className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg">
            + Add Manual Entry
          </button>
        </div>
      </div>

      <div className="my-6 bg-white p-6 rounded-lg shadow-md">
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
        <div className="px-6 py-4 border-b"><h2 className="text-xl font-semibold">Full Attendance Log</h2></div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm font-light">
             <thead className="border-b bg-gray-100 font-medium">
              <tr>
                <th scope="col" className="px-6 py-4">Student Name</th>
                <th scope="col" className="px-6 py-4">Date & Time</th>
                <th scope="col" className="px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {attendance.length > 0 ? (
                attendance.map((record) => (
                  <tr key={record.id} className="border-b transition duration-300 ease-in-out hover:bg-neutral-100">
                    <td className="whitespace-nowrap px-6 py-4 font-medium">{record.studentName}</td>
                    <td className="whitespace-nowrap px-6 py-4">{record.timestamp.toDate().toLocaleString()}</td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <button onClick={() => handleDeleteEntry(record.id)} className="text-red-500 hover:text-red-700 font-semibold">
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="text-center p-6 text-gray-500">No attendance records found for this subject.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
            <h2 className="text-2xl font-bold mb-4">Add Manual Entry</h2>
            <form onSubmit={handleAddEntry}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Select Student</label>
                <select value={selectedStudent} onChange={(e) => setSelectedStudent(e.target.value)} className="w-full mt-1 p-2 border rounded-md" required>
                  <option value="" disabled>-- Select a student --</option>
                  {studentList.map(student => (
                    <option key={student.id} value={student.id}>{student.name}</option>
                  ))}
                </select>
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700">Date and Time</label>
                <input type="datetime-local" value={entryTimestamp} onChange={(e) => setEntryTimestamp(e.target.value)} className="w-full mt-1 p-2 border rounded-md" required />
              </div>
              <div className="flex justify-end space-x-4">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 bg-gray-200 rounded-lg">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg">Add Entry</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

