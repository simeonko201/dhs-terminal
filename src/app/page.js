'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [code, setCode] = useState('DHS-001');
  const [rankName, setRankName] = useState('Special Agent');
  const [rankNumber, setRankNumber] = useState(5);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleAuth = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (isSignUp) {
      // 1. Register in Supabase Auth
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signUpError) {
        setError(signUpError.message);
        setLoading(false);
        return;
      }

      // 2. Insert into your existing users table
      if (data.user) {
        const { error: insertError } = await supabase
          .from('users')
          .insert([
            {
              username: username,
              code: code,
              rank: parseInt(rankNumber),
              rank_name: rankName,
            },
          ]);

        if (insertError) {
          setError(insertError.message);
          setLoading(false);
          return;
        }
      }

      router.push('/dashboard');
    } else {
      // Log in existing user
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(signInError.message);
        setLoading(false);
        return;
      }

      router.push('/dashboard');
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold tracking-wider text-slate-100 uppercase">
          Department of Homeland Security
        </h1>
        <p className="text-xs text-yellow-500/80 font-mono mt-1">
          SECURE PERSONNEL ACCESS PORTAL
        </p>
      </div>

      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-lg p-6 shadow-2xl">
        <h2 className="text-lg font-semibold mb-4 text-center border-b border-slate-800 pb-3">
          {isSignUp ? 'REGISTER PERSONNEL' : 'AUTHENTICATE ACCESS'}
        </h2>

        {error && (
          <div className="mb-4 p-3 bg-red-950/50 border border-red-500/50 text-red-400 text-xs rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-4">
          {isSignUp && (
            <>
              <div>
                <label className="block text-xs text-slate-400 mb-1">ROBLOX USERNAME</label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm text-white"
                  placeholder="e.g. simeonko201"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">DHS CODE</label>
                <input
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm text-white"
                  placeholder="e.g. DHS-001"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">RANK NAME</label>
                <select
                  value={rankName}
                  onChange={(e) => {
                    setRankName(e.target.value);
                    if (e.target.value === 'Director') setRankNumber(10);
                    else if (e.target.value === 'Special Agent') setRankNumber(5);
                    else setRankNumber(1);
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm text-white"
                >
                  <option value="Agent">Agent (Rank 1)</option>
                  <option value="Special Agent">Special Agent (Rank 5)</option>
                  <option value="Director">Director (Rank 10)</option>
                </select>
              </div>
            </>
          )}

          <div>
            <label className="block text-xs text-slate-400 mb-1">EMAIL ADDRESS</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm text-white"
              placeholder="agent@dhs.gov"
            />
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">PASSWORD</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm text-white"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-yellow-600 hover:bg-yellow-500 text-slate-950 font-bold py-2 rounded text-sm transition-colors mt-2"
          >
            {loading ? 'PROCESSING...' : isSignUp ? 'CREATE ACCOUNT' : 'LOGIN TO DASHBOARD'}
          </button>
        </form>

        <div className="mt-4 text-center">
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-xs text-slate-400 hover:text-yellow-500 underline"
          >
            {isSignUp ? 'Already have access? Log in' : 'Need account registration? Click here'}
          </button>
        </div>
      </div>
    </div>
  );
}