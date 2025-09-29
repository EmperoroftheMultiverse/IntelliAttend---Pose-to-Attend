'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { useRouter } from 'next/navigation';

interface LoginModalProps {
  closeModal: () => void;
}

export default function LoginModal({ closeModal }: LoginModalProps) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            await signInWithEmailAndPassword(auth, email, password);
            router.push('/dashboard');
        } catch (err) {
            setError('Failed to log in. Please check your credentials.');
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="w-full max-w-md p-8 space-y-6 bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg"
        >
            <h1 className="text-2xl font-bold text-center">Login to IntelliAttend</h1>
            <form onSubmit={handleLogin} className="space-y-6">
                <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full p-3 border rounded-lg" required />
                <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full p-3 border rounded-lg" required />
                {error && <p className="text-sm text-red-600">{error}</p>}
                <button type="submit" className="w-full px-4 py-3 font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700">Log In</button>
            </form>
        </motion.div>
    );
}