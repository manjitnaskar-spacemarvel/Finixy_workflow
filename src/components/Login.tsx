import React, { useState, useEffect } from 'react';
import { useAuth } from '../store/AuthContext';
import { authService } from '../services/api';
import { Loader2, Lock, Sparkles } from 'lucide-react';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('test@example.com');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();

  // --- SPLASH SCREEN STATE ---
  // Stages: 'hidden' (start) -> 'entering' (fade in) -> 'exiting' (fade out) -> 'done' (show login)
  const [splashStage, setSplashStage] = useState<'hidden' | 'entering' | 'exiting' | 'done'>('hidden');

  useEffect(() => {
    // 1. Trigger the fade-in slightly after mount for a smooth start
    const enterTimer = setTimeout(() => setSplashStage('entering'), 100);
    
    // 2. Hold the text on screen, then start the fade-out
    const exitTimer = setTimeout(() => setSplashStage('exiting'), 3000);
    
    // 3. Unmount the splash screen entirely and reveal the login form
    const doneTimer = setTimeout(() => setSplashStage('done'), 3700);

    return () => {
      clearTimeout(enterTimer);
      clearTimeout(exitTimer);
      clearTimeout(doneTimer);
    };
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await authService.login(email, password);
      if (response.access_token) {
        login(response.access_token);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  // --- 1. RENDER SPLASH SCREEN ---
  if (splashStage !== 'done') {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center bg-gray-900 px-4 transition-all duration-800 ease-in-out
        ${splashStage === 'entering' ? 'opacity-100' : 'opacity-0'}
      `}>
        <div className={`text-center transition-all duration-700 delay-100 ease-out transform
          ${splashStage === 'entering' ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-8 opacity-0 scale-95'}
        `}>
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(37,99,235,0.5)]">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-6xl md:text-7xl font-extrabold text-white tracking-tight mb-4">
            Welcome to Finixy
          </h1>
          <p className="text-blue-200 text-lg md:text-xl font-medium max-w-md mx-auto leading-relaxed">
            Your finance automation buddy. <br/>
            <span className="opacity-80">Making your financial workflows effortless.</span>
          </p>
        </div>
      </div>
    );
  }

  // --- 2. RENDER LOGIN FORM ---
  return (
    <div className="min-h-screen flex items-center justify-center bg-black px-4 transition-opacity duration-1000 animate-in fade-in">
      {/* Note: The wrapper div here will smoothly fade in once the splash screen is unmounted 
      */}
      <div className="max-w-md w-full bg-black p-8 rounded-xl shadow-lg border border-white transform transition-all duration-700 ease-out translate-y-0 opacity-100">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mb-4 shadow-sm">
            <Lock className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white">Welcome to Finixy</h2>
          <p className="text-sm text-gray-500 mt-1">Sign in to your account</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-shadow"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-shadow"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all shadow-sm hover:shadow-md flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
};