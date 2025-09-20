'use client';

import { useState, useEffect, useMemo } from 'react';
import { db } from '../../lib/firebase';
import { collection, onSnapshot, query, orderBy, where, Timestamp, getDocs, documentId } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import StatCard from '../../components/StatCard';
import AttendanceChart from '../../components/AttendanceChart';

// --- INTERFACES ---
interface AttendanceRecord {
  id: string;
  studentName: string;
  studentId: string;
  subjectId: string;
  date: string;
  timestamp: Timestamp;
}

interface Subject {
  id: string;
  subjectName: string;
  subjectCode: string;
}

// ===================================================================
// ==                   ADMIN DASHBOARD COMPONENT                   ==
// ===================================================================
function AdminDashboard() {
  const [stats, setStats] = useState({ userCount: 0, subjectCount: 0, attendanceToday: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdminStats = async () => {
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const subjectsSnapshot = await getDocs(collection(db, 'subjects'));
      const today = new Date().toISOString().split('T')[0];
      const attendanceQuery = query(collection(db, 'attendance'), where('date', '==', today));
      const attendanceSnapshot = await getDocs(attendanceQuery);
      
      setStats({
        userCount: usersSnapshot.size,
        subjectCount: subjectsSnapshot.size,
        attendanceToday: attendanceSnapshot.size,
      });
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
  const { user } = useAuth();
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [subjectCount, setSubjectCount] = useState(0);
  const [timePeriod, setTimePeriod] = useState('daily');

  useEffect(() => {
    if (!user) return;

    const fetchSubjectCount = async () => {
      const q = query(collection(db, 'subjects'), where('professorId', '==', user.uid));
      const querySnapshot = await getDocs(q);
      setSubjectCount(querySnapshot.size);
    };
    fetchSubjectCount();

    const q_attendance = query(collection(db, 'attendance'), orderBy('timestamp', 'desc'));
    const unsubscribe = onSnapshot(q_attendance, (querySnapshot) => {
      const records = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AttendanceRecord));
      setAttendance(records);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

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

  const getTodaysUniqueAttendees = () => {
    const today = new Date().toDateString();
    const todaysRecords = attendance.filter(record => record.timestamp.toDate().toDateString() === today);
    return new Set(todaysRecords.map(rec => rec.studentName)).size;
  };

  if (loading) return <div className="text-center">Loading Professor Dashboard...</div>;

  return (
    <section>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <StatCard title="Students Present Today" value={getTodaysUniqueAttendees()} />
        <StatCard title="Total Attendance Records" value={attendance.length} />
        <StatCard title="Active Subjects" value={subjectCount} />
      </div>
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
        <div className="px-6 py-4 border-b"><h2 className="text-xl font-semibold">Full Attendance Log</h2></div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm font-light">
             <thead className="border-b bg-gray-100 font-medium">
              <tr><th scope="col" className="px-6 py-4">Student Name</th><th scope="col" className="px-6 py-4">Timestamp</th></tr>
            </thead>
            <tbody>
              {attendance.map((record) => (
                <tr key={record.id} className="border-b"><td className="px-6 py-4 font-medium">{record.studentName}</td><td className="px-6 py-4">{record.timestamp.toDate().toLocaleString()}</td></tr>
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
  const [mySubjects, setMySubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, 'attendance'), where('studentId', '==', user.uid));
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const records = snapshot.docs.map(doc => doc.data() as AttendanceRecord);
      setMyAttendance(records);

      const uniqueSubjectIds = [...new Set(records.map(rec => rec.subjectId))];
      
      if (uniqueSubjectIds.length > 0) {
        const subjectsQuery = query(collection(db, 'subjects'), where(documentId(), 'in', uniqueSubjectIds));
        const subjectsSnapshot = await getDocs(subjectsQuery);
        const subjectsList = subjectsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Subject));
        setMySubjects(subjectsList);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  if (loading) return <div>Loading Your Dashboard...</div>;

  return (
    <section>
       <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <StatCard title="My Total Check-ins" value={myAttendance.length} />
        <StatCard title="Enrolled Subjects" value={mySubjects.length} />
       </div>
       
       <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2">My Subjects</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mySubjects.map((subject) => (
                <Link key={subject.id} href={`/dashboard/my-subjects/${subject.id}`}>
                    <div className="block p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
                        <h3 className="text-lg font-semibold text-indigo-600">{subject.subjectName}</h3>
                        <p className="text-gray-500">{subject.subjectCode}</p>
                    </div>
                </Link>
            ))}
            </div>
       </div>

       <div className="w-full bg-white shadow-md rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b"><h2 className="text-xl font-semibold">Recent Activity</h2></div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm font-light">
             <thead className="border-b bg-gray-100 font-medium"><tr><th scope="col" className="px-6 py-4">Date & Time</th></tr></thead>
            <tbody>
              {myAttendance.slice(0, 5).map((record) => (
                <tr key={record.id} className="border-b"><td className="px-6 py-4">{record.timestamp.toDate().toLocaleString()}</td></tr>
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
        return <ProfessorDashboard />; 
      case 'student':
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

