'use client';

import { useState, useRef, useEffect } from 'react';
import * as faceapi from 'face-api.js';
import { useAuth } from '../../../../context/AuthContext';
import { db } from '../../../../lib/firebase';
import { doc, getDoc, addDoc, collection, Timestamp } from 'firebase/firestore';
import { useRouter } from 'next/navigation';

// --- GEOLOCATION CONFIGURATION ---
// Coordinates for Barkatullah University Institute of Technology, Bhopal
const CAMPUS_COORDS = { latitude: 23.218421, longitude: 77.390896 };
const MAX_ALLOWED_DISTANCE_METERS = 500; // 0.5 km radius

// --- HELPER FUNCTIONS ---
const getDistance = (p1: faceapi.Point, p2: faceapi.Point) => {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
};

const getEyeAspectRatio = (eye: faceapi.Point[]) => {
  const dV1 = getDistance(eye[1], eye[5]);
  const dV2 = getDistance(eye[2], eye[4]);
  const dH = getDistance(eye[0], eye[3]);
  return (dV1 + dV2) / (2.0 * dH);
};

const getDistanceBetweenCoords = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3; // Earth's radius in metres
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;
    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // in metres
};

export default function CheckInPage({ params: { subjectId } }: { params: { subjectId: string } }) {
  const { user, userProfile } = useAuth();
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const [status, setStatus] = useState("Please wait, loading AI models...");
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [livenessCheckPassed, setLivenessCheckPassed] = useState(false);
  const [geolocationPassed, setGeolocationPassed] = useState(false);
  const [recognitionPassed, setRecognitionPassed] = useState(false);

  useEffect(() => {
    const loadModels = async () => {
      const MODEL_URL = '/models';
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
      ]);
      setModelsLoaded(true);
      setStatus("Models loaded. Ready to start verification.");
    };
    loadModels();
  }, []);

  const startCamera = async () => {
    setStatus("Requesting camera access...");
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      setStatus("Camera access denied. Please enable permissions.");
    }
  };
  
  const performFaceRecognition = async () => {
    setStatus("Verifying identity...");
    if (!videoRef.current || !user || !userProfile) {
      setStatus("Error: User data not found.");
      return;
    }

    const userDocSnap = await getDoc(doc(db, 'users', user.uid));
    const storedDescriptorArray = userDocSnap.data()?.faceDescriptor;

    if (!storedDescriptorArray || storedDescriptorArray.length === 0) {
      setStatus("Error: No registered face found for your profile.");
      return;
    }
    const storedDescriptor = new Float32Array(storedDescriptorArray);

    const detection = await faceapi.detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceDescriptor();
    if (!detection) {
      setStatus("Could not detect your face. Please try again.");
      return;
    }

    const faceMatcher = new faceapi.FaceMatcher([storedDescriptor]);
    const bestMatch = faceMatcher.findBestMatch(detection.descriptor);

    if (bestMatch.label === 'person 1' && bestMatch.distance < 0.5) {
      setStatus("✅ Verification Successful! Marking you present.");
      setRecognitionPassed(true);
      await addDoc(collection(db, 'attendance'), {
        studentId: user.uid,
        studentName: userProfile.name,
        subjectId: subjectId,
        timestamp: Timestamp.now(),
        date: new Date().toISOString().split('T')[0],
      });
      setTimeout(() => router.push('/dashboard'), 2000);
    } else {
      setStatus("❌ Face does not match registered profile. Please try again.");
    }
  };

  const verifyLocation = () => {
    setStatus("Liveness check passed! Verifying location...");
    if (!navigator.geolocation) {
      setStatus("Geolocation is not supported by your browser.");
      return;
    }

    const options = {
      enableHighAccuracy: true,
      timeout: 10000, // Wait 10 seconds
      maximumAge: 0,
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const distance = getDistanceBetweenCoords(
          position.coords.latitude, position.coords.longitude,
          CAMPUS_COORDS.latitude, CAMPUS_COORDS.longitude
        );

        if (distance <= MAX_ALLOWED_DISTANCE_METERS) {
          setGeolocationPassed(true);
          performFaceRecognition();
        } else {
          setStatus(`Verification failed. You are ${Math.round(distance)} meters away from campus.`);
        }
      },
      (error) => {
        console.error("Geolocation Error:", error);
        setStatus(`Location Error: ${error.message}`);
      }
    );
  };

  const handleVideoPlay = () => {
    if (livenessCheckPassed) return;
    
    intervalRef.current = setInterval(async () => {
      const video = videoRef.current;
      if (!video || video.paused || video.ended || !canvasRef.current) return;
      
      faceapi.matchDimensions(canvasRef.current, { width: video.videoWidth, height: video.videoHeight });
      
      const detections = await faceapi.detectSingleFace(video, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks();

      if (detections) {
        const resizedDetections = faceapi.resizeResults(detections, { width: video.videoWidth, height: video.videoHeight });
        canvasRef.current.getContext('2d')?.clearRect(0, 0, video.videoWidth, video.videoHeight);
        faceapi.draw.drawDetections(canvasRef.current, resizedDetections);
        
        const EAR_THRESHOLD = 0.27;
        const leftEye = detections.landmarks.getLeftEye();
        const rightEye = detections.landmarks.getRightEye();
        const averageEAR = (getEyeAspectRatio(leftEye) + getEyeAspectRatio(rightEye)) / 2.0;

        // console.log("Current EAR:", averageEAR.toFixed(2));

        if (averageEAR < EAR_THRESHOLD) {
            setLivenessCheckPassed(true);
            if (intervalRef.current) clearInterval(intervalRef.current);
            verifyLocation();
        } else {
            setStatus("Face detected. Now, please blink to verify.");
        }
      } else {
        setStatus("Position your face in the frame.");
      }
    }, 200);
  };
  
  useEffect(() => {
    return () => {
      stream?.getTracks().forEach(track => track.stop());
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [stream]);

  const getStatusColor = () => {
      if (recognitionPassed) return 'text-green-600';
      if (geolocationPassed) return 'text-blue-600';
      if (livenessCheckPassed) return 'text-blue-600';
      return '';
  }

  return (
    <div className="flex flex-col items-center">
      <h1 className="text-2xl font-bold mb-4">Secure Attendance Check-in</h1>
      <div className="relative w-full max-w-lg mb-4">
        <video 
          ref={videoRef} 
          onPlay={handleVideoPlay}
          autoPlay 
          playsInline 
          muted
          className="w-full h-auto rounded-lg shadow-lg bg-black"
        />
        <canvas ref={canvasRef} className="absolute top-0 left-0" />
      </div>

      <div className="text-center h-12">
        {!stream ? (
          <button 
            onClick={startCamera} 
            disabled={!modelsLoaded}
            className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 disabled:bg-gray-400"
          >
            {modelsLoaded ? 'Start Verification' : 'Loading Models...'}
          </button>
        ) : (
          <p className={`font-semibold text-lg ${getStatusColor()}`}>
            {status}
          </p>
        )}
      </div>
    </div>
  );
}

