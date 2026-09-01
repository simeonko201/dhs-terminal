'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// COMPLETE DHS RANK HIERARCHY
const RANKS = [
  { code: 'O10', name: 'Director', level: 16, category: 'HIGH COMMAND' },
  { code: 'O9', name: 'Deputy Director', level: 15, category: 'HIGH COMMAND' },
  { code: 'O8', name: 'Assistant Director', level: 14, category: 'HIGH COMMAND' },
  { code: 'O7', name: 'Special Agent in Charge', level: 13, category: 'HIGH COMMAND' },
  { code: 'O6', name: 'Assistant Special Agent in Charge', level: 12, category: 'MIDDLE COMMAND' },
  { code: 'O5', name: 'Executive Inspector', level: 11, category: 'MIDDLE COMMAND' },
  { code: 'O4', name: 'Supervisory Special Agent', level: 10, category: 'MIDDLE COMMAND' },
  { code: 'O3', name: 'Supervisory Agent', level: 9, category: 'MIDDLE COMMAND' },
  { code: 'O2', name: 'Senior Special Agent', level: 8, category: 'MIDDLE COMMAND' },
  { code: 'O1', name: 'Special Agent', level: 7, category: 'MIDDLE COMMAND' },
  { code: 'E7', name: 'Field Supervisor', level: 6, category: 'LOW COMMAND' },
  { code: 'E6', name: 'Senior Agent', level: 5, category: 'LOW COMMAND' },
  { code: 'E4', name: 'Agent', level: 4, category: 'LOW COMMAND' },
  { code: 'E3', name: 'Junior Agent', level: 3, category: 'LOW COMMAND' },
  { code: 'E2', name: 'Cadet', level: 2, category: 'LOW COMMAND' },
];

const isHicom = (rankCode) => {
  return ['O7', 'O8', 'O9', 'O10'].includes(rankCode);
};

export default function Dashboard() {
  const [userProfile, setUserProfile] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [blacklists, setBlacklists] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('personnel');

  const [newUsername, setNewUsername] = useState('');
  const [selectedRankCode, setSelectedRankCode] = useState('E2');
  const [submittingUser, setSubmittingUser] = useState(false);
  const [generatedCredentials, setGeneratedCredentials] = useState(null);

  const [targetUsername, setTargetUsername] = useState('');
  const [targetRobloxId, setTargetRobloxId] = useState('');
  const [blacklistReason, setBlacklistReason] = useState('');
  const [blacklistDuration, setBlacklistDuration] = useState('Permanent');
  const [submittingBlacklist, setSubmittingBlacklist] = useState(false);

  // Document creation states
  const [docTitle, setDocTitle] = useState('');
  const [docContent, setDocContent] = useState('');
  const [docSelectedRanks, setDocSelectedRanks] = useState(['O6', 'O7', 'O8', 'O9', 'O10']);
  const [submittingDoc, setSubmittingDoc] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);

  const [selectedUser, setSelectedUser] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  const router = useRouter();

  useEffect(() => {
    const storedUser = localStorage.getItem('dhs_user');
    if (!storedUser) {
      router.push('/');
      return;
    }

    try {
      const profile = JSON.parse(storedUser);
      setUserProfile(profile);
    } catch (e) {
      router.push('/');
      return;
    }

    async function fetchData() {
      await loadPersonnel();
      await loadBlacklists();
      await loadDocuments();
      setLoading(false);
    }

    fetchData();
  }, [router]);

  const loadPersonnel = async () => {
    const { data: usersData } = await supabase
      .from('users')
      .select('*')
      .order('rank', { ascending: false });

    if (usersData) {
      setAllUsers(usersData);
      if (selectedUser) {
        const updated = usersData.find((u) => u.id === selectedUser.id);
        if (updated) setSelectedUser(updated);
      }
    }
  };

  const loadBlacklists = async () => {
    const { data: blacklistData } = await supabase
      .from('blacklists')
      .select('*')
      .order('created_at', { ascending: false });

    if (blacklistData) setBlacklists(blacklistData);
  };

  const loadDocuments = async () => {
    const { data: docData } = await supabase
      .from('documents')
      .select('*')
      .order('created_at', { ascending: false });

    if (docData) setDocuments(docData);
  };

  const generatePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let randStr = '';
    for (let i = 0; i < 8; i++) {
      randStr += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `DHS-${randStr}`;
  };

  const handleAddPersonnel = async (e) => {
    e.preventDefault();
    if (!userProfile || !isHicom(userProfile.code)) return;
    if (!newUsername) return;

    setSubmittingUser(true);
    setGeneratedCredentials(null);

    const rankObj = RANKS.find((r) => r.code === selectedRankCode) || RANKS[RANKS.length - 1];
    const generatedPassword = generatePassword();

    try {
      const { data: existingUser } = await supabase
        .from('users')
        .select('username')
        .eq('username', newUsername.trim())
        .maybeSingle();

      if (existingUser) {
        alert('An agent with this username already exists in the roster!');
        setSubmittingUser(false);
        return;
      }

      const newEntry = {
        username: newUsername.trim(),
        password: generatedPassword,
        code: rankObj.code,
        rank_name: rankObj.name,
        rank: rankObj.level,
      };

      const { error: dbError } = await supabase.from('users').insert([newEntry]);
      if (dbError) throw dbError;

      setGeneratedCredentials({
        username: newUsername.trim(),
        password: generatedPassword,
        rankDisplay: `${newUsername.trim()} [${rankObj.code}] ${rankObj.name}`,
      });

      setNewUsername('');
      setSelectedRankCode('E2');
      await loadPersonnel();
    } catch (err) {
      alert('Error adding personnel: ' + err.message);
    } finally {
      setSubmittingUser(false);
    }
  };

  const handleRemoveAgent = async (agent) => {
    if (!userProfile || !isHicom(userProfile.code)) return;
    const confirmDelete = confirm(
      `Are you sure you want to terminate & remove agent "${agent.username}" [${agent.code}] from the DHS Roster?`
    );

    if (!confirmDelete) return;

    try {
      let query = supabase.from('users').delete();
      if (agent.id) {
        query = query.eq('id', agent.id);
      } else {
        query = query.eq('username', agent.username);
      }

      const { error } = await query;
      if (error) throw error;

      if (selectedUser?.id === agent.id || selectedUser?.username === agent.username) {
        setSelectedUser(null);
      }

      await loadPersonnel();
    } catch (err) {
      alert('Error removing agent: ' + err.message);
    }
  };

  const handleAddBlacklist = async (e) => {
    e.preventDefault();
    if (!userProfile || !isHicom(userProfile.code)) return;
    if (!targetUsername || !blacklistReason) return;

    setSubmittingBlacklist(true);

    const newEntry = {
      roblox_username: targetUsername,
      roblox_id: targetRobloxId || 'N/A',
      reason: blacklistReason,
      duration: blacklistDuration || 'Permanent',
      blacklisted_by: userProfile?.username || 'simeonko201',
    };

    const { error } = await supabase.from('blacklists').insert([newEntry]);

    if (!error) {
      setTargetUsername('');
      setTargetRobloxId('');
      setBlacklistReason('');
      setBlacklistDuration('Permanent');
      await loadBlacklists();
    } else {
      alert('Error adding blacklist entry: ' + error?.message);
    }

    setSubmittingBlacklist(false);
  };

  const handleRemoveBlacklist = async (item) => {
    if (!userProfile || !isHicom(userProfile.code)) return;
    const confirmDelete = confirm(
      `Are you sure you want to remove "${item.roblox_username}" from the National Security Blacklist?`
    );

    if (!confirmDelete) return;

    try {
      let query = supabase.from('blacklists').delete();
      if (item.id) {
        query = query.eq('id', item.id);
      } else {
        query = query.eq('roblox_username', item.roblox_username);
      }

      const { error } = await query;
      if (error) throw error;
      await loadBlacklists();
    } catch (err) {
      alert('Error removing blacklist entry: ' + err.message);
    }
  };

  const handleToggleRankPermission = (code) => {
    if (docSelectedRanks.includes(code)) {
      setDocSelectedRanks(docSelectedRanks.filter((r) => r !== code));
    } else {
      setDocSelectedRanks([...docSelectedRanks, code]);
    }
  };

  const handleCreateDocument = async (e) => {
    e.preventDefault();
    if (!userProfile || !isHicom(userProfile.code)) return;
    if (!docTitle || !docContent) return;

    setSubmittingDoc(true);

    const newDoc = {
      title: docTitle,
      content: docContent,
      allowed_ranks: docSelectedRanks,
      created_by: userProfile?.username || 'HICOM',
    };

    const { error } = await supabase.from('documents').insert([newDoc]);

    if (!error) {
      setDocTitle('');
      setDocContent('');
      setDocSelectedRanks(['O6', 'O7', 'O8', 'O9', 'O10']);
      await loadDocuments();
    } else {
      alert('Error creating document: ' + error.message);
    }

    setSubmittingDoc(false);
  };

  const handleRemoveDocument = async (doc) => {
    if (!userProfile || !isHicom(userProfile.code)) return;
    const confirmDelete = confirm(`Are you sure you want to delete document "${doc.title}"?`);
    if (!confirmDelete) return;

    try {
      const { error } = await supabase.from('documents').delete().eq('id', doc.id);
      if (error) throw error;
      if (selectedDocument?.id === doc.id) setSelectedDocument(null);
      await loadDocuments();
    } catch (err) {
      alert('Error removing document: ' + err.message);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('dhs_user');
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-cyan-500 flex flex-col items-center justify-center font-mono space-y-4">
        <div className="w-10 h-10 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin"></div>
        <p className="tracking-widest text-xs uppercase animate-pulse">
          Connecting to DHS Secure Database...
        </p>
      </div>
    );
  }

  const userIsHicom = isHicom(userProfile?.code);

  // Filter documents: HICOM can see all, others can only see documents where their rank code is included in allowed_ranks
  const visibleDocuments = documents.filter((doc) => {
    if (userIsHicom) return true;
    return doc.allowed_ranks && doc.allowed_ranks.includes(userProfile?.code);
  });

  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-cyan-500 selection:text-black flex flex-col">
      <div className="bg-red-950/80 border-b border-red-900/50 text-red-400 text-[10px] font-mono tracking-widest uppercase text-center py-1 z-10">
        TOP SECRET // ROBLOX DHS PERSONNEL NETWORK // FOR OFFICIAL USE ONLY
      </div>

      <header className="bg-slate-900/80 backdrop-blur border-b border-cyan-900/30 px-6 py-3 flex items-center justify-between z-10">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded bg-cyan-950 border border-cyan-500/40 flex items-center justify-center">
            <span className="text-cyan-400 font-mono font-bold text-xs">DHS</span>
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-wider text-slate-100 uppercase font-mono">
              Department of Homeland Security
            </h1>
            <p className="text-[10px] font-mono text-cyan-400/70 tracking-widest">
              OFFICIAL PERSONNEL TERMINAL
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-6">
          <div className="text-right border-r border-slate-800 pr-6">
            <div className="flex items-center justify-end space-x-2">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <p className="text-xs font-mono font-semibold text-cyan-400 uppercase">
                {userProfile?.username || 'User'}
              </p>
            </div>
            <p className="text-[10px] font-mono text-slate-400">
              [{userProfile?.code || 'E2'}] {userProfile?.rank_name || 'Cadet'}
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="bg-red-950/40 hover:bg-red-900/60 border border-red-500/40 text-red-400 font-mono text-xs px-3 py-1.5 rounded transition-all uppercase tracking-wider"
          >
            LOGOUT
          </button>
        </div>
      </header>

      <div className="flex flex-1 z-10">
        <aside className="w-64 bg-slate-900/40 border-r border-slate-800/80 p-4 flex flex-col justify-between">
          <div className="space-y-2">
            <p className="text-[10px] font-mono uppercase text-slate-500 tracking-wider px-3 mb-2">
              Agency Modules
            </p>
            
            <button
              onClick={() => setActiveTab('personnel')}
              className={`w-full text-left px-3 py-2 rounded text-xs font-mono flex items-center space-x-2 transition-all ${
                activeTab === 'personnel'
                  ? 'bg-cyan-950/60 border border-cyan-500/50 text-cyan-400 font-bold'
                  : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
              }`}
            >
              <span>►</span>
              <span>Personnel</span>
            </button>

            <button
              onClick={() => setActiveTab('blacklists')}
              className={`w-full text-left px-3 py-2 rounded text-xs font-mono flex items-center space-x-2 transition-all ${
                activeTab === 'blacklists'
                  ? 'bg-cyan-950/60 border border-cyan-500/50 text-cyan-400 font-bold'
                  : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
              }`}
            >
              <span>►</span>
              <span>Blacklists</span>
            </button>

            <button
              onClick={() => setActiveTab('documents')}
              className={`w-full text-left px-3 py-2 rounded text-xs font-mono flex items-center space-x-2 transition-all ${
                activeTab === 'documents'
                  ? 'bg-cyan-950/60 border border-cyan-500/50 text-cyan-400 font-bold'
                  : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
              }`}
            >
              <span>►</span>
              <span>Documents ({visibleDocuments.length})</span>
            </button>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 p-3 rounded text-[11px] font-mono text-slate-400 space-y-1">
            <div className="text-slate-500 uppercase tracking-wider text-[9px]">Authorization Level</div>
            <div className={userIsHicom ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
              {userIsHicom ? 'HICOM (Full Access)' : 'Standard Access'}
            </div>
          </div>
        </aside>

        <main className="flex-1 p-8 overflow-y-auto">
          <div className="max-w-6xl mx-auto space-y-6">

            {activeTab === 'personnel' && (
              <div className="space-y-6">
                <div className="border-b border-slate-800 pb-4 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-mono font-bold text-slate-100 tracking-wider uppercase">
                      PERSONNEL REGISTRATION
                    </h2>
                    <p className="text-xs font-mono text-slate-400 mt-0.5">
                      {userIsHicom ? 'Create Agent Accounts & Manage Hierarchy' : 'Secure Roster View'}
                    </p>
                  </div>
                  <div className="text-xs font-mono bg-cyan-950/50 border border-cyan-500/30 text-cyan-400 px-3 py-1.5 rounded">
                    ACTIVE ROSTER: {allUsers.length}
                  </div>
                </div>

                {userIsHicom ? (
                  <form onSubmit={handleAddPersonnel} className="bg-slate-900/80 border border-cyan-900/40 p-5 rounded-lg space-y-4 backdrop-blur-sm">
                    <h3 className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider">
                      + Register New Agent (Auto-Generate Password)
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">Roblox Username</label>
                        <input
                          type="text"
                          placeholder="e.g. AgentJohn"
                          value={newUsername}
                          onChange={(e) => setNewUsername(e.target.value)}
                          required
                          className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">Assigned Rank</label>
                        <select
                          value={selectedRankCode}
                          onChange={(e) => setSelectedRankCode(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
                        >
                          {RANKS.map((r) => (
                            <option key={r.code} value={r.code}>
                              [{r.code}] {r.name} ({r.category})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={submittingUser}
                      className="bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/50 text-cyan-300 text-xs font-mono px-5 py-2.5 rounded transition-all uppercase tracking-wider font-bold"
                    >
                      {submittingUser ? 'Generating Access...' : 'Generate Password & Register Agent'}
                    </button>
                  </form>
                ) : (
                  <div className="bg-amber-950/20 border border-amber-500/30 p-4 rounded text-xs font-mono text-amber-400">
                    🔒 Personnel registration is restricted to High Command (O7-O10). Your rank level permits viewing only.
                  </div>
                )}

                {generatedCredentials && userIsHicom && (
                  <div className="bg-emerald-950/40 border border-emerald-500/50 p-4 rounded-lg space-y-2 font-mono text-xs">
                    <p className="text-emerald-400 font-bold uppercase tracking-wider">
                      ✓ ACCOUNT SUCCESSFULLY CREATED
                    </p>
                    <div className="bg-slate-950 p-3 rounded border border-slate-800 space-y-1 text-slate-300 select-all">
                      <p><span className="text-slate-500">Chain Title:</span> <span className="text-cyan-400 font-bold">{generatedCredentials.rankDisplay}</span></p>
                      <p><span className="text-slate-500">Login Username:</span> <span className="text-white">{generatedCredentials.username}</span></p>
                      <p><span className="text-slate-500">Generated Password:</span> <span className="text-yellow-400 font-bold">{generatedCredentials.password}</span></p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 bg-slate-900/60 border border-slate-800 rounded-lg overflow-hidden backdrop-blur-sm">
                    <div className="px-4 py-3 bg-slate-950/80 border-b border-slate-800 flex justify-between items-center">
                      <span className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">
                        Chain of Command {userIsHicom ? '(Click Row to Inspect)' : ''}
                      </span>
                    </div>

                    <table className="w-full text-left text-xs font-mono">
                      <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider border-b border-slate-800">
                        <tr>
                          <th className="px-4 py-3">Agent</th>
                          <th className="px-4 py-3">Rank Code</th>
                          {userIsHicom && <th className="px-4 py-3 text-right">Action</th>}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 text-slate-300">
                        {allUsers.map((u) => {
                          const isSelected = selectedUser?.id === u.id;
                          return (
                            <tr 
                              key={u.id || u.username} 
                              onClick={() => {
                                if (userIsHicom) {
                                  setSelectedUser(u);
                                  setShowPassword(false);
                                }
                              }}
                              className={`transition-colors ${userIsHicom ? 'cursor-pointer' : ''} ${
                                isSelected ? 'bg-cyan-950/40 border-l-2 border-cyan-400' : userIsHicom ? 'hover:bg-cyan-950/20' : ''
                              } ${u.rank >= 13 ? 'font-bold' : ''}`}
                            >
                              <td className="px-4 py-3 text-cyan-400">
                                <div className="font-bold text-slate-100">{u.username}</div>
                                <div className="text-[10px] text-slate-400">{u.rank_name}</div>
                              </td>
                              <td className="px-4 py-3">
                                <span className="bg-slate-800 border border-slate-700 text-yellow-400 px-2 py-0.5 rounded text-[10px]">
                                  {u.code}
                                </span>
                              </td>
                              {userIsHicom && (
                                <td className="px-4 py-3 text-right">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleRemoveAgent(u);
                                    }}
                                    className="bg-red-950/60 hover:bg-red-900 border border-red-600/50 text-red-400 text-[10px] font-mono px-2.5 py-1 rounded transition-all uppercase tracking-wider font-semibold"
                                  >
                                    Remove
                                  </button>
                                </td>
                              )}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {userIsHicom && (
                    <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-4 font-mono space-y-4 backdrop-blur-sm self-start">
                      <h3 className="text-xs font-bold text-yellow-500 uppercase tracking-wider border-b border-slate-800 pb-2">
                        Personnel Credentials Inspector
                      </h3>
                      {selectedUser ? (
                        <div className="space-y-3 text-xs">
                          <div>
                            <span className="text-[10px] text-slate-500 uppercase block">Username</span>
                            <span className="font-bold text-white text-sm">{selectedUser.username}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-500 uppercase block">Badge Designation</span>
                            <span className="text-cyan-400">[{selectedUser.code}] {selectedUser.rank_name}</span>
                          </div>
                          <div className="pt-2 border-t border-slate-800">
                            <span className="text-[10px] text-slate-500 uppercase block mb-1">Account Password</span>
                            <div className="flex items-center justify-between bg-slate-950 p-2 rounded border border-slate-800">
                              <span className="tracking-widest text-yellow-400 font-bold">
                                {showPassword ? (selectedUser.password || 'No Password Stored') : '••••••••'}
                              </span>
                              <button
                                onClick={() => setShowPassword(!showPassword)}
                                className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] px-2 py-1 rounded uppercase tracking-wider"
                              >
                                {showPassword ? 'Hide' : 'Reveal'}
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-slate-500 italic py-6 text-center">
                          Click on any agent row in the table to view their secure credentials.
                        </p>
                      )}
                    </div>
                  )}

                </div>
              </div>
            )}

            {activeTab === 'blacklists' && (
              <div className="space-y-6">
                <div className="border-b border-slate-800 pb-4">
                  <h2 className="text-lg font-mono font-bold text-slate-100 tracking-wider uppercase">
                    DEPARTMENT OF HOMELAND SECURITY BLACKLIST
                  </h2>
                  <p className="text-xs font-mono text-slate-400 mt-0.5">
                    {userIsHicom ? 'Manage Restricted Individuals' : 'National Security Watchlist (View Only)'}
                  </p>
                </div>

                {userIsHicom ? (
                  <form onSubmit={handleAddBlacklist} className="bg-slate-900/80 border border-red-900/40 p-4 rounded-lg space-y-4 backdrop-blur-sm">
                    <h3 className="text-xs font-mono font-bold text-red-400 uppercase tracking-wider">
                      + Log New Blacklist Entry
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <input
                        type="text"
                        placeholder="Roblox Username"
                        value={targetUsername}
                        onChange={(e) => setTargetUsername(e.target.value)}
                        required
                        className="bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-red-500"
                      />
                      <input
                        type="text"
                        placeholder="Roblox ID (Optional)"
                        value={targetRobloxId}
                        onChange={(e) => setTargetRobloxId(e.target.value)}
                        className="bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-red-500"
                      />
                      <input
                        type="text"
                        placeholder="Duration (e.g. Permanent)"
                        value={blacklistDuration}
                        onChange={(e) => setBlacklistDuration(e.target.value)}
                        required
                        className="bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-red-500"
                      />
                    </div>

                    <textarea
                      placeholder="Reason for Blacklist..."
                      value={blacklistReason}
                      onChange={(e) => setBlacklistReason(e.target.value)}
                      required
                      rows={2}
                      className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-red-500"
                    />

                    <button
                      type="submit"
                      disabled={submittingBlacklist}
                      className="bg-red-950 hover:bg-red-900 border border-red-500/50 text-red-300 text-xs font-mono px-4 py-2 rounded transition-all uppercase tracking-wider"
                    >
                      {submittingBlacklist ? 'Filing Entry...' : 'Submit Blacklist Entry'}
                    </button>
                  </form>
                ) : (
                  <div className="bg-amber-950/20 border border-amber-500/30 p-4 rounded text-xs font-mono text-amber-400">
                    🔒 Blacklist modifications are restricted to High Command (O7-O10). You have viewing rights only.
                  </div>
                )}

                <div className="bg-slate-900/60 border border-slate-800 rounded-lg overflow-hidden backdrop-blur-sm">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider border-b border-slate-800">
                      <tr>
                        <th className="px-4 py-3">Roblox User</th>
                        <th className="px-4 py-3">Roblox ID</th>
                        <th className="px-4 py-3">Duration</th>
                        <th className="px-4 py-3">Reason</th>
                        <th className="px-4 py-3">Issued By</th>
                        {userIsHicom && <th className="px-4 py-3 text-right">Action</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-slate-300">
                      {blacklists.map((item) => (
                        <tr key={item.id} className="hover:bg-red-950/20 transition-colors">
                          <td className="px-4 py-3 font-semibold text-red-400">{item.roblox_username}</td>
                          <td className="px-4 py-3 text-slate-400">{item.roblox_id}</td>
                          <td className="px-4 py-3 text-yellow-400 font-bold">{item.duration || 'Permanent'}</td>
                          <td className="px-4 py-3 text-slate-200">{item.reason}</td>
                          <td className="px-4 py-3 font-mono text-cyan-400">{item.blacklisted_by}</td>
                          {userIsHicom && (
                            <td className="px-4 py-3 text-right">
                              <button
                                onClick={() => handleRemoveBlacklist(item)}
                                className="bg-red-950/60 hover:bg-red-900 border border-red-600/50 text-red-400 text-[10px] font-mono px-2.5 py-1 rounded transition-all uppercase tracking-wider font-semibold"
                              >
                                Remove
                              </button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'documents' && (
              <div className="space-y-6">
                <div className="border-b border-slate-800 pb-4">
                  <h2 className="text-lg font-mono font-bold text-slate-100 tracking-wider uppercase">
                    OFFICIAL DHS DOCUMENTS & TRYOUTS
                  </h2>
                  <p className="text-xs font-mono text-slate-400 mt-0.5">
                    {userIsHicom ? 'Create and Manage Authorized Document Visibility' : 'Authorized Document Registry'}
                  </p>
                </div>

                {userIsHicom && (
                  <form onSubmit={handleCreateDocument} className="bg-slate-900/80 border border-cyan-900/40 p-5 rounded-lg space-y-4 backdrop-blur-sm">
                    <h3 className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider">
                      + Create New Secure Document
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">Document Title</label>
                        <input
                          type="text"
                          placeholder="e.g. O6-O10 Tryout Guidelines"
                          value={docTitle}
                          onChange={(e) => setDocTitle(e.target.value)}
                          required
                          className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">Document Content / Instructions</label>
                      <textarea
                        placeholder="Enter the secure briefing or tryout notes..."
                        value={docContent}
                        onChange={(e) => setDocContent(e.target.value)}
                        required
                        rows={4}
                        className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono text-slate-400 uppercase mb-2">Select Ranks Permitted to View This Document</label>
                      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 bg-slate-950 p-3 rounded border border-slate-800">
                        {RANKS.map((r) => {
                          const isChecked = docSelectedRanks.includes(r.code);
                          return (
                            <label key={r.code} className="flex items-center space-x-2 text-xs font-mono cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => handleToggleRankPermission(r.code)}
                                className="rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-0"
                              />
                              <span className={isChecked ? 'text-cyan-400 font-bold' : 'text-slate-500'}>
                                {r.code}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={submittingDoc}
                      className="bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/50 text-cyan-300 text-xs font-mono px-5 py-2.5 rounded transition-all uppercase tracking-wider font-bold"
                    >
                      {submittingDoc ? 'Publishing...' : 'Publish Document with Target Ranks'}
                    </button>
                  </form>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 bg-slate-900/60 border border-slate-800 rounded-lg overflow-hidden backdrop-blur-sm">
                    <div className="px-4 py-3 bg-slate-950/80 border-b border-slate-800 flex justify-between items-center">
                      <span className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">
                        Available Documents ({visibleDocuments.length})
                      </span>
                    </div>

                    <div className="divide-y divide-slate-800/60">
                      {visibleDocuments.length === 0 ? (
                        <div className="p-6 text-center text-xs font-mono text-slate-500 italic">
                          No authorized documents available for your clearance level.
                        </div>
                      ) : (
                        visibleDocuments.map((doc) => {
                          const isSelected = selectedDocument?.id === doc.id;
                          return (
                            <div
                              key={doc.id}
                              onClick={() => setSelectedDocument(doc)}
                              className={`p-4 cursor-pointer transition-colors ${
                                isSelected ? 'bg-cyan-950/40 border-l-2 border-cyan-400' : 'hover:bg-cyan-950/20'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <h4 className="text-xs font-mono font-bold text-cyan-400">{doc.title}</h4>
                                <span className="text-[10px] font-mono text-slate-500">{new Date(doc.created_at).toLocaleDateString()}</span>
                              </div>
                              <div className="flex flex-wrap gap-1 mt-2">
                                {doc.allowed_ranks?.map((code) => (
                                  <span key={code} className="bg-slate-800 text-yellow-400 text-[9px] font-mono px-1.5 py-0.5 rounded border border-slate-700">
                                    {code}
                                  </span>
                                ))}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-4 font-mono space-y-4 backdrop-blur-sm self-start">
                    <h3 className="text-xs font-bold text-yellow-500 uppercase tracking-wider border-b border-slate-800 pb-2">
                      Document Reader
                    </h3>
                    {selectedDocument ? (
                      <div className="space-y-3 text-xs">
                        <div>
                          <span className="text-[10px] text-slate-500 uppercase block">Title</span>
                          <span className="font-bold text-white text-sm">{selectedDocument.title}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 uppercase block">Author / HICOM</span>
                          <span className="text-cyan-400">{selectedDocument.created_by}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 uppercase block mb-1">Content</span>
                          <div className="bg-slate-950 p-3 rounded border border-slate-800 text-slate-300 whitespace-pre-wrap leading-relaxed">
                            {selectedDocument.content}
                          </div>
                        </div>

                        {userIsHicom && (
                          <button
                            onClick={() => handleRemoveDocument(selectedDocument)}
                            className="w-full bg-red-950/60 hover:bg-red-900 border border-red-600/50 text-red-400 text-[10px] font-mono px-3 py-2 rounded transition-all uppercase tracking-wider font-semibold mt-4"
                          >
                            Delete Document
                          </button>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500 italic py-6 text-center">
                        Select a document from the list to read its contents.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

          </div>
        </main>
      </div>
    </div>
  );
}