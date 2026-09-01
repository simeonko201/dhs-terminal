'use client';

import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function Home() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Query the custom users table directly by username
      const { data: userRecord, error: dbError } = await supabase
        .from('users')
        .select('*')
        .eq('username', username.trim())
        .maybeSingle();

      if (dbError || !userRecord) {
        setError('Invalid username or password.');
        setLoading(false);
        return;
      }

      // Check if password matches
      if (userRecord.password === password) {
        // Store user profile matching what dashboard expects
        localStorage.setItem('dhs_user', JSON.stringify(userRecord));
        router.push('/dashboard');
      } else {
        setError('Invalid username or password.');
      }
    } catch (err) {
      setError('An unexpected error occurred: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4 font-mono">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold tracking-wider text-slate-100 uppercase">
          Department of Homeland Security
        </h1>
        <p className="text-xs text-yellow-500/80 mt-1 tracking-widest">
          SECURE PERSONNEL ACCESS PORTAL
        </p>
      </div>

      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-lg p-6 shadow-2xl">
        <h2 className="text-lg font-semibold mb-4 text-center border-b border-slate-800 pb-3 tracking-wider">
          AUTHENTICATE ACCESS
        </h2>

        {error && (
          <div className="mb-4 p-3 bg-red-950/50 border border-red-500/50 text-red-400 text-xs rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1 uppercase">Username</label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
              placeholder="e.g. simeonko201"
            />
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1 uppercase">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
              placeholder="DHS-XXXXXXXX"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-yellow-600 hover:bg-yellow-500 text-slate-950 font-bold py-2 rounded text-sm transition-colors mt-2 uppercase tracking-wider"
          >
            {loading ? 'AUTHENTICATING...' : 'LOGIN TO DASHBOARD'}
          </button>
        </form>
      </div>
    </div>
  );
}