
import React, { useState } from 'react';
import { UserProfile } from '../types';

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onProfileComplete({ id: '', name: name.trim(), avatar });
    }
  };

  return (
    <div className="h-screen bg-teal-800 flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-teal-500/30 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-emerald-500/20 rounded-full blur-[120px] animate-pulse duration-[5000ms]" />
      
      <div className="bg-white/95 rounded-[3.5rem] shadow-[0_32px_64px_rgba(0,0,0,0.15)] w-full max-w-md p-10 md:p-12 backdrop-blur-2xl border border-white/50 animate-in fade-in zoom-in duration-700 relative z-10">
        <div className="text-center mb-10 md:mb-12">
          <div className="w-20 h-20 md:w-24 md:h-24 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 md:mb-8 text-white shadow-2xl shadow-teal-500/40 rotate-6 hover:rotate-0 transition-transform duration-500">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 md:h-14 md:w-14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tighter mb-2">Velo Chat</h1>
          <p className="text-gray-400 font-bold uppercase tracking-[0.2em] text-[10px]">Pure Distributed Messaging</p>
        </div>

        {error ? (
          <div className="flex flex-col items-center py-6 text-center">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-xl font-black text-gray-900 mb-2">Calibration Failed</h3>
            <p className="text-gray-500 text-sm mb-8 px-4 leading-relaxed">{error}</p>
            <button 
              onClick={onRetry}
              className="w-full bg-gray-900 text-white py-4 rounded-2xl font-bold hover:bg-gray-800 transition-all active:scale-95 shadow-xl shadow-gray-900/10"
            >
              Retry Connection
            </button>
            <button 
              onClick={() => { localStorage.clear(); window.location.reload(); }}
              className="mt-6 text-[10px] text-gray-400 font-bold uppercase tracking-widest hover:text-red-500 transition-colors"
            >
              Reset All Node Data
            </button>
          </div>
        ) : isInitializing ? (
          <div className="flex flex-col items-center py-10 md:py-12">
            <div className="relative">
               <div className="w-16 h-16 md:w-20 md:h-20 border-[6px] border-teal-600/10 rounded-full" />
               <div className="absolute inset-0 w-16 h-16 md:w-20 md:h-20 border-[6px] border-teal-600 border-t-transparent rounded-full animate-spin" />
            </div>
            <p className="text-teal-800 font-black mt-8 tracking-[0.2em] uppercase text-xs">Calibrating Nexus Node</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-8 md:space-y-10">
            <div className="flex flex-col items-center gap-4">
              <div className="relative group">
                <div className="w-28 h-28 md:w-32 md:h-32 rounded-[2.5rem] overflow-hidden border-4 border-white shadow-2xl group-hover:scale-110 transition-all duration-500 rotate-2 group-hover:rotate-0">
                  <img src={avatar} alt="Profile" className="w-full h-full object-cover bg-teal-50" />
                </div>
                <button 
                  type="button"
                  onClick={() => setSeed(Math.random().toString(36).substring(7))}
                  className="absolute -bottom-2 -right-2 bg-white shadow-2xl p-3 rounded-2xl hover:bg-teal-50 hover:text-teal-600 transition-all border border-gray-100 active:scale-90"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[11px] font-black text-gray-400 uppercase tracking-[0.25em] px-2">Chosen Handle</label>
              <input 
                autoFocus
                type="text" 
                placeholder="Ex: Neo"
                className="w-full px-6 py-4 md:px-8 md:py-5 bg-gray-50 border-2 border-transparent focus:border-teal-500 focus:bg-white rounded-[1.5rem] outline-none transition-all text-xl md:text-2xl font-black text-gray-900 shadow-inner placeholder:text-gray-200"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <button 
              type="submit"
              className="w-full bg-teal-600 text-white py-4 md:py-5 rounded-[1.5rem] text-lg md:text-xl font-black hover:bg-teal-700 transition-all shadow-2xl shadow-teal-600/40 active:scale-[0.98] tracking-tight"
            >
              Enter the Nexus
            </button>
          </form>
        )}
        
        <div className="mt-10 md:mt-12 text-center text-[10px] text-gray-300 font-bold uppercase tracking-[0.2em]">
          End-to-End P2P Privacy
        </div>
      </div>
    </div>
  );
};

export default WelcomeScreen;
