'use client';

import { useState, useEffect, useMemo } from 'react';
import { db } from '../../lib/firebase';
import { collection, onSnapshot, query, orderBy, where, Timestamp, getDocs } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import StatCard from '../../components/StatCard';
import AttendanceChart from '../../components/AttendanceChart';

// Define the shape of our data
interface AttendanceRecord {
  id: string;
  studentName: string;
  studentId: string;
  subjectId: string;
  date: string;
  timestamp: Timestamp;
}

// ===================================================================
// ==                   NEW: ADMIN DASHBOARD COMPONENT              ==
// ===================================================================
function AdminDashboard() {
  const [stats, setStats] = useState({ userCount: 0, subjectCount: 0, attendanceToday: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdminStats = async () => {
      // Fetch total users
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const userCount = usersSnapshot.size;

      // Fetch total subjects
      const subjectsSnapshot = await getDocs(collection(db, 'subjects'));
      const subjectCount = subjectsSnapshot.size;
      
      // Fetch attendance for today
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      const attendanceQuery = query(collection(db, 'attendance'), where('date', '==', today));
      const attendanceSnapshot = await getDocs(attendanceQuery);
      const attendanceToday = attendanceSnapshot.size;
      
      setStats({ userCount, subjectCount, attendanceToday });
      setLoading(false);
    };
    
    fetchAdminStats();
  }, []);

  if (loading) return <div>Loading Admin Dashboard...</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Total Registered Users" value={stats.userCount} />
        <StatCard title="Total Institute Subjects" value={stats.subjectCount} />
        <StatCard title="Attendance Records Today" value={stats.attendanceToday} />
    </div>
  );
}

// ===================================================================
// ==                  PROFESSOR DASHBOARD COMPONENT                ==
// ===================================================================
function ProfessorDashboard() {
  const { user } = useAuth(); // Get the current user
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [subjectCount, setSubjectCount] = useState(0);
  const [timePeriod, setTimePeriod] = useState('daily');

  useEffect(() => {
    const fetchSubjectCount = async () => {
      if (!user) return;
      const q = query(collection(db, 'subjects'), where('professorId', '==', user.uid));
      const querySnapshot = await getDocs(q);
      setSubjectCount(querySnapshot.size); // Get the number of documents
    };

    fetchSubjectCount();

    

    // In a real app, you might filter by professorId: where('professorId', '==', user.uid)
    const q_attendance = query(collection(db, 'attendance'), orderBy('timestamp', 'desc'));
    
    const unsubscribe = onSnapshot(q_attendance, (querySnapshot) => {
      const records: AttendanceRecord[] = [];
      querySnapshot.forEach((doc) => {
        records.push({ id: doc.id, ...doc.data() } as AttendanceRecord);
      });
      setAttendance(records);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

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

  const getTodaysUniqueAttendees = () => {
    const today = new Date().toDateString();
    const todaysRecords = attendance.filter(record => record.timestamp.toDate().toDateString() === today);
    const uniqueNames = new Set(todaysRecords.map(rec => rec.studentName));
    return uniqueNames.size;
  };

  if (loading) return <div className="text-center">Loading Professor Dashboard...</div>;

  return (
    <section>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <StatCard title="Students Present Today" value={getTodaysUniqueAttendees()} />
        <StatCard title="Total Attendance Records" value={attendance.length} />
        <StatCard title="Active Subjects" value={subjectCount} /> {/* Example static value */}
      </div>
      <div className="mb-6 bg-white p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-gray-700">Attendance Trend</h3>
            {/* 👇 Add buttons to control the time period */}
            <div className="flex space-x-2">
                <button onClick={() => setTimePeriod('daily')} className={`px-3 py-1 text-sm rounded-md ${timePeriod === 'daily' ? 'bg-indigo-600 text-white' : 'bg-gray-200'}`}>Daily</button>
                <button onClick={() => setTimePeriod('weekly')} className={`px-3 py-1 text-sm rounded-md ${timePeriod === 'weekly' ? 'bg-indigo-600 text-white' : 'bg-gray-200'}`}>Weekly</button>
                <button onClick={() => setTimePeriod('monthly')} className={`px-3 py-1 text-sm rounded-md ${timePeriod === 'monthly' ? 'bg-indigo-600 text-white' : 'bg-gray-200'}`}>Monthly</button>
            </div>
        </div>
        {/* We will pass processed data to the chart component below */}
        <AttendanceChart data={chartData} /> 
      </div>
      <div className="w-full bg-white shadow-md rounded-lg overflow-hidden">
        <div className="px-6 py-4">
          <h2 className="text-xl font-semibold text-gray-700">Full Attendance Log</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm font-light">
             <thead className="border-b bg-gray-100 font-medium">
              <tr>
                <th scope="col" className="px-6 py-4">Student Name</th>
                <th scope="col" className="px-6 py-4">Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {attendance.map((record) => (
                <tr key={record.id} className="border-b transition duration-300 ease-in-out hover:bg-neutral-100">
                  <td className="whitespace-nowrap px-6 py-4 font-medium">{record.studentName}</td>
                  <td className="whitespace-nowrap px-6 py-4">{record.timestamp.toDate().toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}


// ===================================================================
// ==                   STUDENT DASHBOARD COMPONENT                 ==
// ===================================================================
function StudentDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [myAttendance, setMyAttendance] = useState<AttendanceRecord[]>([]);
  const [subjectsMap, setSubjectsMap] = useState<{[key: string]: string}>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return; // Don't run query if user is not loaded yet

    const fetchSubjectsMap = async () => {
        const querySnapshot = await getDocs(collection(db, "subjects"));
        const map: {[key: string]: string} = {};
        querySnapshot.forEach((doc) => {
            map[doc.id] = doc.data().subjectName;
        });
        setSubjectsMap(map);
    };
    fetchSubjectsMap();

    // Query for attendance records where studentId matches the current user's UID
    const q = query(
      collection(db, 'attendance'), 
      where('studentId', '==', user.uid),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const records: AttendanceRecord[] = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AttendanceRecord));
      setMyAttendance(records);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]); // Rerun effect if user object changes

  if (loading) return <div className="text-center">Loading Your Attendance...</div>;

  return (
    <section>
       <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <StatCard title="My Total Check-ins" value={myAttendance.length} />
       </div>
       <div className="w-full bg-white shadow-md rounded-lg overflow-hidden">
        <div className="px-6 py-4">
          <h2 className="text-xl font-semibold text-gray-700">My Attendance History</h2>
          <p className="text-sm text-gray-500">Click on a record to view subject-specific analysis.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm font-light">
             <thead className="border-b bg-gray-100 font-medium">
              <tr>
                <th scope="col" className="px-6 py-4">Date</th>
                <th scope="col" className="px-6 py-4">Time</th>
                <th scope="col" className="px-6 py-4">Subject</th>
              </tr>
            </thead>
            <tbody>
              {myAttendance.map((record) => (
                <tr 
                  key={record.id} 
                  className="border-b transition duration-300 ease-in-out hover:bg-neutral-100 cursor-pointer"
                  onClick={() => router.push(`/dashboard/my-subjects/${record.subjectId}`)}
                >
                  <td className="whitespace-nowrap px-6 py-4">{record.timestamp.toDate().toLocaleDateString()}</td>
                  <td className="whitespace-nowrap px-6 py-4 font-medium">{record.timestamp.toDate().toLocaleTimeString()}</td>
                  <td className="whitespace-nowrap px-6 py-4 font-semibold text-indigo-600">{subjectsMap[record.subjectId] || 'Loading...'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}


// ===================================================================
// ==                       MAIN PAGE COMPONENT                     ==
// ===================================================================
export default function DashboardPage() {
  const { userProfile } = useAuth();

  if (!userProfile) {
    return <div className="text-center p-10">Loading User Profile...</div>;
  }

  const renderDashboard = () => {
    switch (userProfile.role) {
      case 'admin':
        return <AdminDashboard />;
      case 'professor':
        // The ProfessorDashboard component needs to be defined here or imported
        return <ProfessorDashboard />; 
      case 'student':
        // The StudentDashboard component needs to be defined here or imported
        return <StudentDashboard />;
      default:
        return <div>Unknown role. Please contact support.</div>;
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6 text-gray-800">
        Welcome, {userProfile.name} ({userProfile.role})
      </h1>
      {renderDashboard()}
    </div>
  );
}