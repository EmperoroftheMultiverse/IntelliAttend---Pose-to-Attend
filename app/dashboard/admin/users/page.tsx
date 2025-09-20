'use client';

import { useState, useEffect, FormEvent, useRef, useCallback } from 'react';
import { db } from '../../../../lib/firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import * as faceapi from 'face-api.js';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  
  // State for Create User modal
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student');
  const [year, setYear] = useState<number>(1);
  const [faceDescriptor, setFaceDescriptor] = useState<Float32Array | null>(null);
  const [feedback, setFeedback] = useState('');
  
  // Loading states for actions
  const [isCreating, setIsCreating] = useState(false);
  const [deletingUid, setDeletingUid] = useState<string | null>(null);

  useEffect(() => {
    const loadModels = async () => {
      const MODEL_URL = '/models';
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
      ]);
    };
    loadModels();
    
    const unsubscribe = onSnapshot(collection(db, 'users'), (snapshot) => {
      const usersList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
      setUsers(usersList);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const processImageForDescriptor = async (imageElement: HTMLImageElement) => {
    setFeedback("Processing image...");

    const canvas = document.createElement('canvas');
    const MAX_WIDTH = 600;
    const scale = MAX_WIDTH / imageElement.width;
    canvas.width = MAX_WIDTH;
    canvas.height = imageElement.height * scale;
    const ctx = canvas.getContext('2d');
    ctx?.drawImage(imageElement, 0, 0, canvas.width, canvas.height);

    const detection = await faceapi
      .detectSingleFace(canvas, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceDescriptor();
    
    if (detection) {
      setFaceDescriptor(detection.descriptor);
      setFeedback("✅ Face encoding captured successfully!");
    } else {
      setFeedback("❌ No face detected. Please try again with a clear photo.");
      setFaceDescriptor(null);
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const img = document.createElement('img');
    img.src = URL.createObjectURL(file);
    img.onload = () => processImageForDescriptor(img);
  };
  
  const resetModalState = () => {
      setShowModal(false);
      setName('');
      setEmail('');
      setPassword('');
      setRole('student');
      setYear(1); // Also reset the year
      setFaceDescriptor(null);
      setFeedback('');
  };

  const handleCreateUser = async (e: FormEvent) => {
    e.preventDefault();
    if (role === 'student' && !faceDescriptor) {
      alert("Please capture a face encoding for the student.");
      return;
    }
    
    setIsCreating(true);
    const functions = getFunctions();
    const createUserCallable = httpsCallable(functions, 'createUser');

    const userData = {
        name, email, password, role, year,
        faceDescriptor: role === 'student' ? Array.from(faceDescriptor || []) : null,
    };

    try {
      await createUserCallable(userData);
      resetModalState();
    } catch (error) {
        console.error("Error creating user:", error);
        alert((error as any).message);
    } finally {
      setIsCreating(false);
    }
  };
  
  const handleDeleteUser = async (uidToDelete: string) => {
    if (confirm('Are you sure you want to permanently delete this user?')) {
        setDeletingUid(uidToDelete);
        const functions = getFunctions();
        const deleteUserCallable = httpsCallable(functions, 'deleteUser');
        try {
            await deleteUserCallable({ uidToDelete });
        } catch (error) {
            console.error("Error deleting user:", error);
            alert((error as any).message);
        } finally {
            setDeletingUid(null);
        }
    }
  };

  if (loading) return <div>Loading all users...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">All Institute Users</h1>
        <button onClick={() => setShowModal(true)} className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700">
            + Create User
        </button>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full text-left text-sm font-light">
          <thead className="border-b bg-gray-100 font-medium">
            <tr>
              <th scope="col" className="px-6 py-4">Name</th>
              <th scope="col" className="px-6 py-4">Email</th>
              <th scope="col" className="px-6 py-4">Role</th>
              <th scope="col" className="px-6 py-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b">
                <td className="whitespace-nowrap px-6 py-4 font-medium">{user.name}</td>
                <td className="whitespace-nowrap px-6 py-4">{user.email}</td>
                <td className="whitespace-nowrap px-6 py-4">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${user.role === 'admin' ? 'bg-red-100 text-red-800' : user.role === 'professor' ? 'bg-indigo-100 text-indigo-800' : 'bg-green-100 text-green-800'}`}>
                    {user.role.toUpperCase()}
                  </span>
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                    <button 
                      onClick={() => handleDeleteUser(user.id)} 
                      disabled={deletingUid === user.id}
                      className="text-red-500 hover:text-red-700 font-semibold disabled:text-gray-400 disabled:cursor-wait"
                    >
                      {deletingUid === user.id ? 'Deleting...' : 'Delete'}
                    </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
            <h2 className="text-2xl font-bold mb-4">Create New User</h2>
            <form onSubmit={handleCreateUser}>
              <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">Full Name</label>
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full mt-1 p-2 border rounded-md" required />
              </div>
              <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">Email Address</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full mt-1 p-2 border rounded-md" required />
              </div>
              <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">Password</label>
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full mt-1 p-2 border rounded-md" required minLength={6}/>
              </div>
              <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">Role</label>
                  <select value={role} onChange={(e) => setRole(e.target.value)} className="w-full mt-1 p-2 border rounded-md" required>
                      <option value="student">Student</option>
                      <option value="professor">Professor</option>
                      <option value="admin">Admin</option>
                  </select>
              </div>

              {role === 'student' && (
                <>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700">Year</label>
                        <input type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} className="w-full mt-1 p-2 border rounded-md" required min="1" max="5"/>
                    </div>
                    <div className="p-4 border rounded-lg">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Student Face Registration</label>
                        <input type="file" accept="image/jpeg, image/png" onChange={handleImageUpload} className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" />
                        <p className={`mt-2 text-sm font-semibold ${feedback.includes('✅') ? 'text-green-600' : 'text-red-600'}`}>{feedback || 'Upload a clear, forward-facing photo.'}</p>
                    </div>
                </>
              )}
              
              <div className="flex justify-end space-x-4 mt-6">
                  <button type="button" onClick={resetModalState} disabled={isCreating} className="px-4 py-2 bg-gray-200 rounded-lg">Cancel</button>
                  <button type="submit" disabled={isCreating} className="px-4 py-2 bg-indigo-600 text-white rounded-lg disabled:bg-indigo-300 disabled:cursor-wait">
                    {isCreating ? 'Creating...' : 'Create'}
                  </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

