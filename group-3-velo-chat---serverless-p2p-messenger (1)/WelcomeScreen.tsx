
import React, { useState } from 'react';
import { UserProfile } from './types.ts';

interface WelcomeScreenProps {
  onProfileComplete: (user: UserProfile) => void;
  isInitializing: boolean;
  error?: string | null;
  onRetry?: () => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onProfileComplete, isInitializing, error, onRetry }) => {
  const [name, setName] = useState('');
  const [seed, setSeed] = useState(Math.random().toString(36).substring(7));
  const avatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`;

  return (
    <div className="h-screen bg-teal-800 flex items-center justify-center p-6 relative">
      <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-md p-10 relative z-10">
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-teal-600 rounded-3xl flex items-center justify-center mx-auto mb-6 text-white shadow-xl">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h1 className="text-4xl font-black text-gray-900">Velo Chat</h1>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-2">Nexus Node Hub</p>
        </div>

        {isInitializing ? (
          <div className="py-12 flex flex-col items-center">
            <div className="w-12 h-12 border-4 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-6 text-xs font-black text-teal-800 uppercase tracking-widest">Initializing Node...</p>
          </div>
        ) : (
          <form onSubmit={(e) => { e.preventDefault(); if(name.trim()) onProfileComplete({ id: '', name: name.trim(), avatar }); }} className="space-y-8">
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <img src={avatar} className="w-24 h-24 rounded-3xl border-4 border-gray-50 shadow-lg object-cover" />
                <button type="button" onClick={() => setSeed(Math.random().toString(36).substring(7))} className="absolute -bottom-2 -right-2 bg-white p-2 rounded-xl shadow-md border"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg></button>
              </div>
            </div>
            <input autoFocus type="text" placeholder="Your Username..." className="w-full p-5 bg-gray-50 border rounded-2xl outline-none focus:border-teal-500 font-bold text-lg" value={name} onChange={(e) => setName(e.target.value)} required />
            <button type="submit" className="w-full bg-teal-600 text-white py-5 rounded-2xl font-black shadow-xl hover:bg-teal-700 active:scale-95 transition-all">Enter Mesh</button>
          </form>
        )}
      </div>
    </div>
  );
};

export default WelcomeScreen;
