'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { db } from '../../../lib/firebase';
import { collection, addDoc, serverTimestamp, doc, updateDoc } from 'firebase/firestore';
import * as faceapi from 'face-api.js';

export default function ProfilePage() {
  const { user, userProfile } = useAuth();
  const [faceDescriptor, setFaceDescriptor] = useState<Float32Array | null>(null);
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    const loadModels = async () => {
      const MODEL_URL = '/models';
      await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
      await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
      await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
    };
    loadModels();
  }, []);

  const handleRequestUpdate = async () => {
    if (!user || !userProfile) return;
    try {
      await addDoc(collection(db, 'grievances'), {
        studentId: user.uid,
        studentName: userProfile.name,
        requestDate: serverTimestamp(),
        status: 'pending',
      });
      alert('Your request has been submitted for review.');
    } catch (error) {
      console.error("Error submitting request:", error);
      alert('Failed to submit request.');
    }
  };

  // 👇 THIS FUNCTION IS NOW OPTIMIZED
  const processImageForDescriptor = async (imageElement: HTMLImageElement) => {
    setFeedback("Processing new image...");

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
      setFeedback("✅ New face encoding captured successfully! Click Save to confirm.");
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

  const handleSaveNewFace = async () => {
    if (!user || !faceDescriptor) {
      alert("No new face encoding has been captured.");
      return;
    }
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        faceDescriptor: Array.from(faceDescriptor),
        updateFaceAllowed: false,
      });
      alert('Your face encoding has been updated successfully!');
      setFeedback('');
      setFaceDescriptor(null);
    } catch (error) {
      console.error("Error updating face encoding:", error);
      alert("Failed to update face encoding.");
    }
  };


  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">My Profile</h1>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <p className="mb-2"><strong>Name:</strong> {userProfile?.name}</p>
        <p className="mb-4"><strong>Email:</strong> {userProfile?.email}</p>
        <hr className="my-4"/>
        <h2 className="text-xl font-semibold mb-2">Face Encoding Management</h2>

        {userProfile?.updateFaceAllowed ? (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <h3 className="font-bold text-green-800">Your request was approved!</h3>
            <p className="text-sm text-gray-600 mb-4">You can now upload a new photo to update your face encoding.</p>
            <input 
              type="file" 
              accept="image/jpeg, image/png" 
              onChange={handleImageUpload} 
              className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
            />
            <p className={`mt-2 text-sm font-semibold ${feedback.includes('✅') ? 'text-green-600' : 'text-red-600'}`}>
              {feedback}
            </p>
            {faceDescriptor && (
              <button onClick={handleSaveNewFace} className="mt-4 px-4 py-2 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700">
                Save New Face
              </button>
            )}
          </div>
        ) : (
          <div>
            <p className="text-sm text-gray-600 mb-4">
              If your appearance has changed, you can request to update your registered face photo.
            </p>
            <button onClick={handleRequestUpdate} className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700">
              Request Face Update
            </button>
          </div>
        )}
      </div>
    </div>
  );
}