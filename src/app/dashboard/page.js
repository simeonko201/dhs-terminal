'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

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

const getClearanceDetails = (rankCode) => {
  if (['O10', 'O9', 'O8', 'O7'].includes(rankCode)) {
    return {
      levelText: 'LEVEL-5 SECURE NETWORK',
      bannerBg: 'from-red-950/90 via-neutral-950 to-red-950/90',
      borderColor: 'border-red-600/40',
      textColor: 'text-red-400',
      dotColor: 'bg-red-500',
    };
  } else if (['O6', 'O5', 'O4', 'O3', 'O2', 'O1'].includes(rankCode)) {
    return {
      levelText: 'LEVEL-3 CLASSIFIED OPERATIONS',
      bannerBg: 'from-amber-950/90 via-neutral-950 to-amber-950/90',
      borderColor: 'border-amber-600/40',
      textColor: 'text-amber-400',
      dotColor: 'bg-amber-500',
    };
  } else {
    return {
      levelText: 'LEVEL-1 STANDARD FIELD NETWORK',
      bannerBg: 'from-cyan-950/90 via-neutral-950 to-cyan-950/90',
      borderColor: 'border-cyan-600/40',
      textColor: 'text-cyan-400',
      dotColor: 'bg-cyan-500',
    };
  }
};

export default function Dashboard() {
  const [userProfile, setUserProfile] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [blacklists, setBlacklists] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [arrestLogs, setArrestLogs] = useState([]);
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

  const [docTitle, setDocTitle] = useState('');
  const [docUrl, setDocUrl] = useState('');
  const [docSelectedRanks, setDocSelectedRanks] = useState(['O6', 'O7', 'O8', 'O9', 'O10']);
  const [submittingDoc, setSubmittingDoc] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);

  // Arrest Log state
  const [arrestUsername, setArrestUsername] = useState('');
  const [arrestReason, setArrestReason] = useState('');
  const [arrestTimeInSeconds, setArrestTimeInSeconds] = useState('');
  const [submittingArrest, setSubmittingArrest] = useState(false);

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
      await loadArrestLogs();
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

  const loadArrestLogs = async () => {
    const { data: arrestData } = await supabase
      .from('arrest_logs')
      .select('*')
      .order('created_at', { ascending: false });

    if (arrestData) setArrestLogs(arrestData);
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
      `Are you sure you want to remove "${item.roblox_username}" from Blacklist?`
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
    if (!docTitle || !docUrl) return;

    setSubmittingDoc(true);

    const newDoc = {
      title: docTitle,
      url: docUrl,
      allowed_ranks: docSelectedRanks,
      created_by: userProfile?.username || 'HICOM',
    };

    const { error } = await supabase.from('documents').insert([newDoc]);

    if (!error) {
      setDocTitle('');
      setDocUrl('');
      setDocSelectedRanks(['O6', 'O7', 'O8', 'O9', 'O10']);
      await loadDocuments();
    } else {
      alert('Error adding document link: ' + error.message);
    }

    setSubmittingDoc(false);
  };

  const handleRemoveDocument = async (doc) => {
    if (!userProfile || !isHicom(userProfile.code)) return;
    const confirmDelete = confirm(`Are you sure you want to delete document link "${doc.title}"?`);
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

  const handleCreateArrestLog = async (e) => {
    e.preventDefault();
    if (!userProfile || !arrestUsername || !arrestReason || !arrestTimeInSeconds) return;

    setSubmittingArrest(true);

    const newLog = {
      username: arrestUsername,
      reason: arrestReason,
      time_in_seconds: parseInt(arrestTimeInSeconds, 10) || 0,
    };

    const { error } = await supabase.from('arrest_logs').insert([newLog]);

    if (!error) {
      setArrestUsername('');
      setArrestReason('');
      setArrestTimeInSeconds('');
      await loadArrestLogs();
    } else {
      alert('Error logging arrest: ' + error.message);
    }

    setSubmittingArrest(false);
  };

  const handleRemoveArrestLog = async (log) => {
    if (!userProfile) return;
    const confirmDelete = confirm(`Are you sure you want to delete this arrest log?`);
    if (!confirmDelete) return;

    try {
      const { error } = await supabase.from('arrest_logs').delete().eq('id', log.id);
      if (error) throw error;
      await loadArrestLogs();
    } catch (err) {
      alert('Error removing arrest log: ' + err.message);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('dhs_user');
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 text-cyan-400 flex flex-col items-center justify-center font-mono space-y-4">
        <div className="w-12 h-12 border-4 border-cyan-500/20 border-t-cyan-400 rounded-full animate-spin shadow-[0_0_15px_rgba(6,182,212,0.4)]"></div>
        <p className="tracking-[0.3em] text-xs uppercase animate-pulse font-semibold">
          ESTABLISHING SECURE DHS ENCRYPTED UPLINK...
        </p>
      </div>
    );
  }

  const userIsHicom = isHicom(userProfile?.code);
  const clearance = getClearanceDetails(userProfile?.code);

  const visibleDocuments = documents.filter((doc) => {
    if (userIsHicom) return true;
    return doc.allowed_ranks && doc.allowed_ranks.includes(userProfile?.code);
  });

  return (
    <div className="relative min-h-screen bg-[#07090e] text-neutral-100 font-sans selection:bg-cyan-500 selection:text-black flex flex-col overflow-x-hidden">
      
      {/* Background & Watermark */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden flex items-center justify-center pt-16">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293d10_1px,transparent_1px),linear-gradient(to_bottom,#1f293d10_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>
        <div className="absolute inset-0 bg-radial from-cyan-950/20 via-transparent to-[#05070a] opacity-90"></div>
        <div 
          className="w-[600px] h-[600px] bg-no-repeat bg-center opacity-[0.08] filter drop-shadow-[0_0_35px_rgba(6,182,212,0.15)] transition-all duration-1000 select-none transform translate-y-6"
          style={{ backgroundImage: `url('https://cdn.discordapp.com/attachments/971121607504453672/1544332893675982928/Homeland_Security_logo_icon.png?ex=6a981f96&is=6a96ce16&hm=59d37b3269342c9e7e3bfc75a239cc4244745e6ec071cf41893239d913ef43dc&')`, backgroundSize: 'contain' }}
        ></div>
      </div>

      {/* Top Banner */}
      <div className={`bg-gradient-to-r ${clearance.bannerBg} border-b ${clearance.borderColor} ${clearance.textColor} text-[10px] font-mono tracking-[0.3em] uppercase text-center py-2 z-10 shadow-lg flex items-center justify-center space-x-4`}>
        <span className={`inline-block w-2 h-2 ${clearance.dotColor} rounded-full animate-ping`}></span>
        <span className="font-bold">RESTRICTED ACCESS // DEPARTMENT OF HOMELAND SECURITY // {clearance.levelText}</span>
        <span className={`inline-block w-2 h-2 ${clearance.dotColor} rounded-full animate-ping`}></span>
      </div>

      {/* Header */}
      <header className="bg-neutral-900/80 backdrop-blur-xl border-b border-cyan-500/30 px-8 py-4 flex items-center justify-between z-10 shadow-[0_4px_20px_rgba(0,0,0,0.6)]">
        <div className="flex items-center space-x-4">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-cyan-950 via-neutral-900 to-neutral-950 border border-cyan-400/50 flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.3)]">
            <img 
              src="https://cdn.discordapp.com/attachments/971121607504453672/1544332893675982928/Homeland_Security_logo_icon.png?ex=6a981f96&is=6a96ce16&hm=59d37b3269342c9e7e3bfc75a239cc4244745e6ec071cf41893239d913ef43dc&" 
              alt="DHS Emblem" 
              className="w-7 h-7 object-contain filter drop-shadow-[0_0_6px_rgba(6,182,212,0.8)]"
            />
          </div>
          <div>
            <h1 className="text-sm font-black tracking-[0.2em] text-neutral-100 uppercase font-mono flex items-center space-x-3">
              <span>U.S. HOMELAND SECURITY</span>
              <span className="text-[10px] font-bold text-cyan-300 bg-cyan-950/90 border border-cyan-500/40 px-2 py-0.5 rounded shadow-inner">COMMAND v2.4</span>
            </h1>
            <p className="text-[10px] font-mono text-cyan-400/80 tracking-widest mt-0.5">
              FEDERAL LAW ENFORCEMENT & OPERATIONS PORTAL
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-6">
          <div className="text-right border-r border-neutral-800 pr-6">
            <div className="flex items-center justify-end space-x-2">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.9)] animate-pulse"></span>
              <p className="text-xs font-mono font-bold text-cyan-300 uppercase tracking-wider">
                {userProfile?.username || 'User'}
              </p>
            </div>
            <p className="text-[10px] font-mono text-neutral-400 tracking-wider">
              [{userProfile?.code || 'E2'}] {userProfile?.rank_name || 'Cadet'}
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="bg-red-950/50 hover:bg-red-900/80 border border-red-500/50 hover:border-red-400 text-red-300 font-mono text-xs px-4 py-2 rounded transition-all uppercase tracking-widest shadow-sm font-semibold"
          >
            DISCONNECT
          </button>
        </div>
      </header>

      {/* Main Body */}
      <div className="flex flex-1 z-10">
        
        {/* Sidebar */}
        <aside className="w-72 bg-neutral-900/60 backdrop-blur-xl border-r border-neutral-800/80 p-5 flex flex-col justify-between shadow-2xl">
          <div className="space-y-4">
            <p className="text-[10px] font-mono uppercase text-neutral-400 tracking-[0.25em] px-3 mb-2 font-semibold">
              Tactical Navigation
            </p>
            
            <button
              onClick={() => setActiveTab('personnel')}
              className={`w-full text-left px-4 py-3 rounded-lg text-xs font-mono flex items-center space-x-3 transition-all ${
                activeTab === 'personnel'
                  ? 'bg-cyan-950/80 border-l-4 border-cyan-400 text-cyan-200 font-bold shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                  : 'text-neutral-400 hover:bg-neutral-800/50 hover:text-neutral-200'
              }`}
            >
              <span className="text-cyan-400 text-xs">■</span>
              <span className="tracking-wider">PERSONNEL ROSTER</span>
            </button>

            <button
              onClick={() => setActiveTab('blacklists')}
              className={`w-full text-left px-4 py-3 rounded-lg text-xs font-mono flex items-center space-x-3 transition-all ${
                activeTab === 'blacklists'
                  ? 'bg-red-950/70 border-l-4 border-red-500 text-red-200 font-bold shadow-[0_0_15px_rgba(239,68,68,0.2)]'
                  : 'text-neutral-400 hover:bg-neutral-800/50 hover:text-neutral-200'
              }`}
            >
              <span className="text-red-500 text-xs">■</span>
              <span className="tracking-wider">BLACKLISTS</span>
            </button>

            <button
              onClick={() => setActiveTab('arrest_logs')}
              className={`w-full text-left px-4 py-3 rounded-lg text-xs font-mono flex items-center space-x-3 transition-all ${
                activeTab === 'arrest_logs'
                  ? 'bg-cyan-950/80 border-l-4 border-cyan-400 text-cyan-200 font-bold shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                  : 'text-neutral-400 hover:bg-neutral-800/50 hover:text-neutral-200'
              }`}
            >
              <span className="text-cyan-400 text-xs">■</span>
              <span className="tracking-wider">ARREST LOGS ({arrestLogs.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('documents')}
              className={`w-full text-left px-4 py-3 rounded-lg text-xs font-mono flex items-center space-x-3 transition-all ${
                activeTab === 'documents'
                  ? 'bg-cyan-950/80 border-l-4 border-cyan-400 text-cyan-200 font-bold shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                  : 'text-neutral-400 hover:bg-neutral-800/50 hover:text-neutral-200'
              }`}
            >
              <span className="text-cyan-400 text-xs">■</span>
              <span className="tracking-wider">DOCUMENTS ({visibleDocuments.length})</span>
            </button>
          </div>

          <div className="bg-neutral-950/90 border border-neutral-800 p-4 rounded-xl space-y-2 shadow-inner">
            <div className="text-neutral-400 uppercase tracking-[0.2em] text-[9px] font-mono font-semibold">Security Clearance</div>
            <div className={`font-mono text-xs font-bold tracking-wider ${userIsHicom ? 'text-emerald-400' : 'text-amber-400'}`}>
              {userIsHicom ? 'LEVEL 5 - HICOM' : `LEVEL ${userProfile?.code?.startsWith('O') ? '3' : '1'} - STANDARD`}
            </div>
            <div className="text-[9px] font-mono text-cyan-500/80 pt-2 border-t border-neutral-900 tracking-wider">
              SECURE ENCRYPTION: ACTIVE 256-BIT
            </div>
          </div>
        </aside>

        {/* Content Area */}
        <main className="flex-1 p-8 overflow-y-auto">
          <div className="max-w-6xl mx-auto space-y-6">

            {/* PERSONNEL TAB */}
            {activeTab === 'personnel' && (
              <div className="space-y-6">
                <div className="border-b border-neutral-800 pb-4 flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-mono font-bold text-neutral-100 tracking-widest uppercase flex items-center space-x-2">
                      <span className="text-cyan-400">❖</span>
                      <span>ACTIVE PERSONNEL DATABASE</span>
                    </h2>
                    <p className="text-xs font-mono text-neutral-400 mt-1">
                      {userIsHicom ? 'Manage Chain of Command & Agent Credentials' : 'Secure Roster Clearance View'}
                    </p>
                  </div>
                  <div className="text-xs font-mono bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 px-3.5 py-1.5 rounded-lg tracking-wider shadow-sm font-semibold">
                    TOTAL AGENTS: {allUsers.length}
                  </div>
                </div>

                {userIsHicom ? (
                  <form onSubmit={handleAddPersonnel} className="bg-neutral-900/80 backdrop-blur-xl border border-cyan-900/50 p-6 rounded-xl space-y-4 shadow-[0_8px_30px_rgba(0,0,0,0.5)]">
                    <h3 className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-[0.2em] flex items-center space-x-2">
                      <span>[+] REGISTER NEW AGENT ACCOUNT</span>
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-[10px] font-mono text-neutral-400 uppercase tracking-widest mb-1.5 font-semibold">Agent Username (Roblox)</label>
                        <input
                          type="text"
                          placeholder="e.g. AgentJohn"
                          value={newUsername}
                          onChange={(e) => setNewUsername(e.target.value)}
                          required
                          className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3.5 py-2.5 text-xs font-mono text-white focus:outline-none focus:border-cyan-400 shadow-inner"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-mono text-neutral-400 uppercase tracking-widest mb-1.5 font-semibold">Assign Command Rank</label>
                        <select
                          value={selectedRankCode}
                          onChange={(e) => setSelectedRankCode(e.target.value)}
                          className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3.5 py-2.5 text-xs font-mono text-white focus:outline-none focus:border-cyan-400 shadow-inner"
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
                      className="bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/60 text-cyan-200 text-xs font-mono px-6 py-3 rounded-lg transition-all uppercase tracking-widest font-bold shadow-[0_0_15px_rgba(6,182,212,0.3)]"
                    >
                      {submittingUser ? 'Generating Encryption...' : 'Generate Password & Register Agent'}
                    </button>
                  </form>
                ) : (
                  <div className="bg-amber-950/30 border border-amber-500/40 p-4 rounded-xl text-xs font-mono text-amber-300 flex items-center space-x-3 shadow-md">
                    <span>⚠️</span>
                    <span>Personnel registration is restricted to High Command (O7-O10). Your rank level permits viewing only.</span>
                  </div>
                )}

                {generatedCredentials && userIsHicom && (
                  <div className="bg-emerald-950/40 border border-emerald-500/60 p-5 rounded-xl space-y-3 font-mono text-xs shadow-xl backdrop-blur-md">
                    <p className="text-emerald-400 font-bold uppercase tracking-widest flex items-center space-x-2">
                      <span>✓</span>
                      <span>CREDENTIALS SUCCESSFULLY GENERATED</span>
                    </p>
                    <div className="bg-neutral-950 p-4 rounded-lg border border-neutral-800 space-y-2 text-neutral-300 select-all font-mono">
                      <p><span className="text-neutral-500">Assignment:</span> <span className="text-cyan-400 font-bold">{generatedCredentials.rankDisplay}</span></p>
                      <p><span className="text-neutral-500">Username:</span> <span className="text-white">{generatedCredentials.username}</span></p>
                      <p><span className="text-neutral-500">Secure Password:</span> <span className="text-yellow-400 font-bold">{generatedCredentials.password}</span></p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 bg-neutral-900/60 border border-neutral-800 rounded-xl overflow-hidden backdrop-blur-xl shadow-2xl">
                    <div className="px-5 py-3.5 bg-neutral-950/90 border-b border-neutral-800 flex justify-between items-center">
                      <span className="text-xs font-mono font-bold text-neutral-300 uppercase tracking-widest">
                        Chain of Command {userIsHicom ? '(Select Row for Details)' : ''}
                      </span>
                    </div>

                    <table className="w-full text-left text-xs font-mono">
                      <thead className="bg-neutral-950/80 text-neutral-400 uppercase tracking-[0.15em] border-b border-neutral-800">
                        <tr>
                          <th className="px-5 py-3.5">Agent</th>
                          <th className="px-5 py-3.5">Rank Code</th>
                          {userIsHicom && <th className="px-5 py-3.5 text-right">Action</th>}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-800/60 text-neutral-300">
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
                                isSelected ? 'bg-cyan-950/60 border-l-4 border-cyan-400' : userIsHicom ? 'hover:bg-cyan-950/20' : ''
                              } ${u.rank >= 13 ? 'font-bold' : ''}`}
                            >
                              <td className="px-5 py-3.5 text-cyan-400">
                                <div className="font-bold text-neutral-100">{u.username}</div>
                                <div className="text-[10px] text-neutral-400">{u.rank_name}</div>
                              </td>
                              <td className="px-5 py-3.5">
                                <span className="bg-neutral-950 border border-neutral-800 text-yellow-400 px-3 py-1 rounded-md text-[10px] tracking-wider font-semibold">
                                  {u.code}
                                </span>
                              </td>
                              {userIsHicom && (
                                <td className="px-5 py-3.5 text-right">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleRemoveAgent(u);
                                    }}
                                    className="bg-red-950/60 hover:bg-red-900 border border-red-600/50 text-red-300 text-[10px] font-mono px-3.5 py-1 rounded-md transition-all uppercase tracking-wider font-semibold shadow-sm"
                                  >
                                    Terminate
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
                    <div className="bg-neutral-900/80 border border-neutral-800 rounded-xl p-5 font-mono space-y-4 backdrop-blur-xl self-start shadow-2xl">
                      <h3 className="text-xs font-bold text-yellow-400 uppercase tracking-[0.2em] border-b border-neutral-800 pb-3">
                        Credentials Inspector
                      </h3>
                      {selectedUser ? (
                        <div className="space-y-4 text-xs">
                          <div>
                            <span className="text-neutral-500 uppercase text-[10px] block">Selected Agent</span>
                            <span className="text-cyan-300 font-bold">{selectedUser.username}</span>
                          </div>
                          <div>
                            <span className="text-neutral-500 uppercase text-[10px] block">Rank & Assignment</span>
                            <span className="text-neutral-300">[{selectedUser.code}] {selectedUser.rank_name}</span>
                          </div>
                          <div>
                            <span className="text-neutral-500 uppercase text-[10px] block">Stored Password</span>
                            <div className="flex items-center space-x-2 mt-1">
                              <span className="bg-neutral-950 px-3 py-1.5 rounded border border-neutral-800 text-yellow-400 font-mono select-all">
                                {showPassword ? selectedUser.password : '••••••••'}
                              </span>
                              <button
                                onClick={() => setShowPassword(!showPassword)}
                                className="bg-neutral-800 hover:bg-neutral-700 text-neutral-300 px-2.5 py-1.5 rounded text-[10px]"
                              >
                                {showPassword ? 'Hide' : 'Reveal'}
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <p className="text-neutral-500 text-xs italic">Select an agent row from the personnel roster to inspect their credentials.</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* BLACKLISTS TAB */}
            {activeTab === 'blacklists' && (
              <div className="space-y-6">
                <div className="border-b border-neutral-800 pb-4 flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-mono font-bold text-neutral-100 tracking-widest uppercase flex items-center space-x-2">
                      <span className="text-red-500">❖</span>
                      <span>DEPARTMENT BLACKLIST DATABASE</span>
                    </h2>
                    <p className="text-xs font-mono text-neutral-400 mt-1">
                      Restricted personnel and external threat monitoring
                    </p>
                  </div>
                  <div className="text-xs font-mono bg-red-950/60 border border-red-500/40 text-red-300 px-3.5 py-1.5 rounded-lg tracking-wider shadow-sm font-semibold">
                    TOTAL BLACKLISTED: {blacklists.length}
                  </div>
                </div>

                {userIsHicom ? (
                  <form onSubmit={handleAddBlacklist} className="bg-neutral-900/80 backdrop-blur-xl border border-red-900/50 p-6 rounded-xl space-y-4 shadow-[0_8px_30px_rgba(0,0,0,0.5)]">
                    <h3 className="text-xs font-mono font-bold text-red-400 uppercase tracking-[0.2em] flex items-center space-x-2">
                      <span>[+] ADD ENTITY TO BLACKLIST</span>
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-[10px] font-mono text-neutral-400 uppercase tracking-widest mb-1.5 font-semibold">Roblox Username</label>
                        <input
                          type="text"
                          placeholder="e.g. BadUser123"
                          value={targetUsername}
                          onChange={(e) => setTargetUsername(e.target.value)}
                          required
                          className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3.5 py-2.5 text-xs font-mono text-white focus:outline-none focus:border-red-500 shadow-inner"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-mono text-neutral-400 uppercase tracking-widest mb-1.5 font-semibold">Roblox ID (Optional)</label>
                        <input
                          type="text"
                          placeholder="e.g. 12345678"
                          value={targetRobloxId}
                          onChange={(e) => setTargetRobloxId(e.target.value)}
                          className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3.5 py-2.5 text-xs font-mono text-white focus:outline-none focus:border-red-500 shadow-inner"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono text-neutral-400 uppercase tracking-widest mb-1.5 font-semibold">Reason for Blacklist</label>
                      <input
                        type="text"
                        placeholder="e.g. Exploiting / Trolling / Treason"
                        value={blacklistReason}
                        onChange={(e) => setBlacklistReason(e.target.value)}
                        required
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3.5 py-2.5 text-xs font-mono text-white focus:outline-none focus:border-red-500 shadow-inner"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={submittingBlacklist}
                      className="bg-red-950 hover:bg-red-900 border border-red-500/60 text-red-200 text-xs font-mono px-6 py-3 rounded-lg transition-all uppercase tracking-widest font-bold shadow-[0_0_15px_rgba(239,68,68,0.3)]"
                    >
                      {submittingBlacklist ? 'Processing...' : 'Confirm & Add to Blacklist'}
                    </button>
                  </form>
                ) : (
                  <div className="bg-amber-950/30 border border-amber-500/40 p-4 rounded-xl text-xs font-mono text-amber-300 flex items-center space-x-3 shadow-md">
                    <span>⚠️</span>
                    <span>Blacklist management is restricted to High Command (O7-O10).</span>
                  </div>
                )}

                <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl overflow-hidden backdrop-blur-xl shadow-2xl">
                  <div className="px-5 py-3.5 bg-neutral-950/90 border-b border-neutral-800 flex justify-between items-center">
                    <span className="text-xs font-mono font-bold text-neutral-300 uppercase tracking-widest">
                      Active Blacklist Registry
                    </span>
                  </div>

                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-neutral-950/80 text-neutral-400 uppercase tracking-[0.15em] border-b border-neutral-800">
                      <tr>
                        <th className="px-5 py-3.5">Entity</th>
                        <th className="px-5 py-3.5">Reason</th>
                        <th className="px-5 py-3.5">Added By</th>
                        {userIsHicom && <th className="px-5 py-3.5 text-right">Action</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-800/60 text-neutral-300">
                      {blacklists.map((b) => (
                        <tr key={b.id || b.roblox_username} className="hover:bg-red-950/10 transition-colors">
                          <td className="px-5 py-3.5 text-red-400 font-bold">
                            <div>{b.roblox_username}</div>
                            <div className="text-[10px] text-neutral-500">ID: {b.roblox_id}</div>
                          </td>
                          <td className="px-5 py-3.5">{b.reason}</td>
                          <td className="px-5 py-3.5 text-neutral-400">{b.blacklisted_by}</td>
                          {userIsHicom && (
                            <td className="px-5 py-3.5 text-right">
                              <button
                                onClick={() => handleRemoveBlacklist(b)}
                                className="bg-red-950/60 hover:bg-red-900 border border-red-600/50 text-red-300 text-[10px] font-mono px-3.5 py-1 rounded-md transition-all uppercase tracking-wider font-semibold shadow-sm"
                              >
                                Revoke
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

            {/* ARREST LOGS TAB */}
            {activeTab === 'arrest_logs' && (
              <div className="space-y-6">
                <div className="border-b border-neutral-800 pb-4 flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-mono font-bold text-neutral-100 tracking-widest uppercase flex items-center space-x-2">
                      <span className="text-cyan-400">❖</span>
                      <span>ARREST LOGS DATABASE</span>
                    </h2>
                    <p className="text-xs font-mono text-neutral-400 mt-1">
                      Log and review department arrest records
                    </p>
                  </div>
                  <div className="text-xs font-mono bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 px-3.5 py-1.5 rounded-lg tracking-wider shadow-sm font-semibold">
                    TOTAL ARRESTS: {arrestLogs.length}
                  </div>
                </div>

                <form onSubmit={handleCreateArrestLog} className="bg-neutral-900/80 backdrop-blur-xl border border-cyan-900/50 p-6 rounded-xl space-y-4 shadow-[0_8px_30px_rgba(0,0,0,0.5)]">
                  <h3 className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-[0.2em] flex items-center space-x-2">
                    <span>[+] LOG NEW ARREST</span>
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div>
                      <label className="block text-[10px] font-mono text-neutral-400 uppercase tracking-widest mb-1.5 font-semibold">Username</label>
                      <input
                        type="text"
                        placeholder="Suspect Username"
                        value={arrestUsername}
                        onChange={(e) => setArrestUsername(e.target.value)}
                        required
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3.5 py-2.5 text-xs font-mono text-white focus:outline-none focus:border-cyan-400 shadow-inner"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono text-neutral-400 uppercase tracking-widest mb-1.5 font-semibold">Reason</label>
                      <input
                        type="text"
                        placeholder="Reason for arrest"
                        value={arrestReason}
                        onChange={(e) => setArrestReason(e.target.value)}
                        required
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3.5 py-2.5 text-xs font-mono text-white focus:outline-none focus:border-cyan-400 shadow-inner"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono text-neutral-400 uppercase tracking-widest mb-1.5 font-semibold">Time of Arrest (Seconds)</label>
                      <input
                        type="number"
                        placeholder="e.g. 300"
                        value={arrestTimeInSeconds}
                        onChange={(e) => setArrestTimeInSeconds(e.target.value)}
                        required
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3.5 py-2.5 text-xs font-mono text-white focus:outline-none focus:border-cyan-400 shadow-inner"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={submittingArrest}
                    className="bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/60 text-cyan-200 text-xs font-mono px-6 py-3 rounded-lg transition-all uppercase tracking-widest font-bold shadow-[0_0_15px_rgba(6,182,212,0.3)]"
                  >
                    {submittingArrest ? 'Logging Arrest...' : 'Submit Arrest Log'}
                  </button>
                </form>

                <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl overflow-hidden backdrop-blur-xl shadow-2xl">
                  <div className="px-5 py-3.5 bg-neutral-950/90 border-b border-neutral-800 flex justify-between items-center">
                    <span className="text-xs font-mono font-bold text-neutral-300 uppercase tracking-widest">
                      Arrest Records Archive
                    </span>
                  </div>

                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-neutral-950/80 text-neutral-400 uppercase tracking-[0.15em] border-b border-neutral-800">
                      <tr>
                        <th className="px-5 py-3.5">Username</th>
                        <th className="px-5 py-3.5">Reason</th>
                        <th className="px-5 py-3.5">Time (Seconds)</th>
                        <th className="px-5 py-3.5">Timestamp</th>
                        <th className="px-5 py-3.5 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-800/60 text-neutral-300">
                      {arrestLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-cyan-950/20 transition-colors">
                          <td className="px-5 py-3.5 text-cyan-400 font-bold">{log.username}</td>
                          <td className="px-5 py-3.5">{log.reason}</td>
                          <td className="px-5 py-3.5 text-yellow-400 font-semibold">{log.time_in_seconds}s</td>
                          <td className="px-5 py-3.5 text-neutral-400 text-[10px]">
                            {new Date(log.created_at).toLocaleString()}
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <button
                              onClick={() => handleRemoveArrestLog(log)}
                              className="bg-red-950/60 hover:bg-red-900 border border-red-600/50 text-red-300 text-[10px] font-mono px-3.5 py-1 rounded-md transition-all uppercase tracking-wider font-semibold shadow-sm"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                      {arrestLogs.length === 0 && (
                        <tr>
                          <td colSpan="5" className="px-5 py-8 text-center text-neutral-500">
                            No arrest logs recorded.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* DOCUMENTS TAB */}
            {activeTab === 'documents' && (
              <div className="space-y-6">
                <div className="border-b border-neutral-800 pb-4 flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-mono font-bold text-neutral-100 tracking-widest uppercase flex items-center space-x-2">
                      <span className="text-cyan-400">❖</span>
                      <span>SECURE DOCUMENTS & DIRECTIVES</span>
                    </h2>
                    <p className="text-xs font-mono text-neutral-400 mt-1">
                      Classified intelligence files and operational manuals
                    </p>
                  </div>
                  <div className="text-xs font-mono bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 px-3.5 py-1.5 rounded-lg tracking-wider shadow-sm font-semibold">
                    ACCESSIBLE FILES: {visibleDocuments.length}
                  </div>
                </div>

                {userIsHicom && (
                  <form onSubmit={handleCreateDocument} className="bg-neutral-900/80 backdrop-blur-xl border border-cyan-900/50 p-6 rounded-xl space-y-4 shadow-[0_8px_30px_rgba(0,0,0,0.5)]">
                    <h3 className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-[0.2em]">
                      [+] PUBLISH NEW DOCUMENT LINK
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-[10px] font-mono text-neutral-400 uppercase tracking-widest mb-1.5 font-semibold">Document Title</label>
                        <input
                          type="text"
                          placeholder="e.g. Standard Operating Procedures"
                          value={docTitle}
                          onChange={(e) => setDocTitle(e.target.value)}
                          required
                          className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3.5 py-2.5 text-xs font-mono text-white focus:outline-none focus:border-cyan-400 shadow-inner"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-mono text-neutral-400 uppercase tracking-widest mb-1.5 font-semibold">External URL (Google Docs / Imgur)</label>
                        <input
                          type="url"
                          placeholder="https://docs.google.com/..."
                          value={docUrl}
                          onChange={(e) => setDocUrl(e.target.value)}
                          required
                          className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3.5 py-2.5 text-xs font-mono text-white focus:outline-none focus:border-cyan-400 shadow-inner"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono text-neutral-400 uppercase tracking-widest mb-2 font-semibold">Minimum Rank Clearance Access</label>
                      <div className="flex flex-wrap gap-2">
                        {['E2', 'E3', 'E4', 'E6', 'E7', 'O1', 'O2', 'O3', 'O4', 'O5', 'O6', 'O7', 'O8', 'O9', 'O10'].map((code) => {
                          const isSelected = docSelectedRanks.includes(code);
                          return (
                            <button
                              type="button"
                              key={code}
                              onClick={() => handleToggleRankPermission(code)}
                              className={`px-3 py-1.5 rounded text-[10px] font-mono border transition-all ${
                                isSelected 
                                  ? 'bg-cyan-950 border-cyan-400 text-cyan-200 font-bold shadow-sm' 
                                  : 'bg-neutral-950 border-neutral-800 text-neutral-500 hover:text-neutral-300'
                              }`}
                            >
                              {code}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={submittingDoc}
                      className="bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/60 text-cyan-200 text-xs font-mono px-6 py-3 rounded-lg transition-all uppercase tracking-widest font-bold shadow-[0_0_15px_rgba(6,182,212,0.3)]"
                    >
                      {submittingDoc ? 'Publishing...' : 'Publish Document Directive'}
                    </button>
                  </form>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {visibleDocuments.map((doc) => (
                    <div key={doc.id} className="bg-neutral-900/60 border border-neutral-800 p-5 rounded-xl space-y-4 backdrop-blur-xl shadow-xl flex flex-col justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 px-2.5 py-1 rounded border border-cyan-800/40">
                            BY: {doc.created_by}
                          </span>
                          <span className="text-[10px] font-mono text-neutral-500">
                            {new Date(doc.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <h3 className="text-sm font-mono font-bold text-neutral-100">{doc.title}</h3>
                        <div className="flex flex-wrap gap-1 pt-1">
                          {doc.allowed_ranks?.map((r) => (
                            <span key={r} className="text-[9px] font-mono bg-neutral-950 border border-neutral-800 text-neutral-400 px-2 py-0.5 rounded">
                              {r}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-neutral-800/80">
                        <a
                          href={doc.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-cyan-950/60 hover:bg-cyan-900 border border-cyan-500/50 text-cyan-300 text-xs font-mono px-4 py-2 rounded transition-all uppercase tracking-wider font-semibold shadow-sm"
                        >
                          Open Document ↗
                        </a>
                        {userIsHicom && (
                          <button
                            onClick={() => handleRemoveDocument(doc)}
                            className="bg-red-950/40 hover:bg-red-900/80 border border-red-600/40 text-red-300 text-xs font-mono px-3 py-2 rounded transition-all uppercase tracking-wider"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  {visibleDocuments.length === 0 && (
                    <div className="col-span-full py-12 text-center text-neutral-500 font-mono text-xs">
                      No documents available for your clearance level.
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>
        </main>
      </div>
    </div>
  );
}