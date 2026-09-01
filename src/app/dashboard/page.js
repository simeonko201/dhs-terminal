'use client';
import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    const { data: userRecord, error: dbError } = await supabase
      .from('users')
      .select('*')
      .eq('username', username.trim())
      .maybeSingle();

    if (dbError || !userRecord) {
      setError('Invalid username or password.');
      return;
    }

    if (userRecord.password === password) {
      localStorage.setItem('dhs_user', JSON.stringify(userRecord));
      router.push('/dashboard');
    } else {
      setError('Invalid username or password.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex items-center justify-center font-mono">
      <div className="bg-slate-900 border border-cyan-900/40 p-8 rounded-lg w-full max-w-md shadow-2xl space-y-6">
        <div>
          <h1 className="text-lg font-bold text-slate-100 uppercase tracking-wider">DHS Terminal Login</h1>
          <p className="text-xs text-cyan-400/70 tracking-widest mt-1">RESTRICTED ACCESS ONLY</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-[10px] uppercase text-slate-400 mb-1">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
              placeholder="e.g. simeonko201"
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase text-slate-400 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
              placeholder="DHS-XXXXXXXX"
            />
          </div>

          {error && <p className="text-red-400 text-xs">{error}</p>}

          <button
            type="submit"
            className="w-full bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/50 text-cyan-300 text-xs font-bold py-2.5 rounded transition-all uppercase tracking-wider"
          >
            Authenticate
          </button>
        </form>
      </div>
    </div>
  );
}