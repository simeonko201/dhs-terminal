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
      
      {/* Enhanced Pro Homeland Security Background with Grid Lines & Fully Visible Watermark */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden flex items-center justify-center pt-16">
        {/* Tactical Matrix Grid Overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293d10_1px,transparent_1px),linear-gradient(to_bottom,#1f293d10_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>
        
        {/* Glowing Radial Vignette for Depth */}
        <div className="absolute inset-0 bg-radial from-cyan-950/20 via-transparent to-[#05070a] opacity-90"></div>

        {/* Fully Visible Homeland Security Emblem Watermark (zmenšená veľkosť aby sa zmestila celá aj s vrchnou časťou) */}
        <div 
          className="w-[600px] h-[600px] bg-no-repeat bg-center opacity-[0.08] filter drop-shadow-[0_0_35px_rgba(6,182,212,0.15)] transition-all duration-1000 select-none transform translate-y-6"
          style={{ backgroundImage: `url('https://cdn.discordapp.com/attachments/971121607504453672/1544332893675982928/Homeland_Security_logo_icon.png?ex=6a981f96&is=6a96ce16&hm=59d37b3269342c9e7e3bfc75a239cc4244745e6ec071cf41893239d913ef43dc&')`, backgroundSize: 'contain' }}
        ></div>
      </div>

      {/* Top Classified Security Ticker Banner */}
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
                            <span className="text-[10px] text-neutral-500 uppercase tracking-widest block font-semibold">Agent Name</span>
                            <span className="font-bold text-white text-sm">{selectedUser.username}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-neutral-500 uppercase tracking-widest block font-semibold">Designation</span>
                            <span className="text-cyan-400 font-semibold">[{selectedUser.code}] {selectedUser.rank_name}</span>
                          </div>
                          <div className="pt-3 border-t border-neutral-800">
                            <span className="text-[10px] text-neutral-500 uppercase tracking-widest block mb-1.5 font-semibold">Encrypted Password</span>
                            <div className="flex items-center justify-between bg-neutral-950 p-3 rounded-lg border border-neutral-800">
                              <span className="tracking-widest text-yellow-400 font-bold">
                                {showPassword ? (selectedUser.password || 'No Password Stored') : '••••••••'}
                              </span>
                              <button
                                onClick={() => setShowPassword(!showPassword)}
                                className="bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-[10px] px-3 py-1 rounded uppercase tracking-wider font-semibold"
                              >
                                {showPassword ? 'Hide' : 'Reveal'}
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-neutral-500 italic py-10 text-center">
                          Select an agent from the roster list to inspect secure clearance credentials.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* BLACKLISTS TAB */}
            {activeTab === 'blacklists' && (
              <div className="space-y-6">
                <div className="border-b border-neutral-800 pb-4">
                  <h2 className="text-base font-mono font-bold text-neutral-100 tracking-widest uppercase flex items-center space-x-2">
                    <span className="text-red-500">❖</span>
                    <span>BLACKLISTS</span>
                  </h2>
                  <p className="text-xs font-mono text-neutral-400 mt-1">
                    {userIsHicom ? 'Manage Agency Threat List & Watchlist' : 'Watchlist Registry (View Only)'}
                  </p>
                </div>

                {userIsHicom ? (
                  <form onSubmit={handleAddBlacklist} className="bg-neutral-900/80 backdrop-blur-xl border border-red-900/50 p-6 rounded-xl space-y-4 shadow-[0_8px_30px_rgba(0,0,0,0.5)]">
                    <h3 className="text-xs font-mono font-bold text-red-400 uppercase tracking-[0.2em]">
                      [+] FILE NEW BLACKLIST ENTRY
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <input
                        type="text"
                        placeholder="Roblox Username"
                        value={targetUsername}
                        onChange={(e) => setTargetUsername(e.target.value)}
                        required
                        className="bg-neutral-950 border border-neutral-800 rounded-lg px-3.5 py-2.5 text-xs font-mono text-white focus:outline-none focus:border-red-500 shadow-inner"
                      />
                      <input
                        type="text"
                        placeholder="Roblox ID (Optional)"
                        value={targetRobloxId}
                        onChange={(e) => setTargetRobloxId(e.target.value)}
                        className="bg-neutral-950 border border-neutral-800 rounded-lg px-3.5 py-2.5 text-xs font-mono text-white focus:outline-none focus:border-red-500 shadow-inner"
                      />
                      <input
                        type="text"
                        placeholder="Duration (e.g. Permanent)"
                        value={blacklistDuration}
                        onChange={(e) => setBlacklistDuration(e.target.value)}
                        required
                        className="bg-neutral-950 border border-neutral-800 rounded-lg px-3.5 py-2.5 text-xs font-mono text-white focus:outline-none focus:border-red-500 shadow-inner"
                      />
                    </div>

                    <textarea
                      placeholder="Detailed threat reason..."
                      value={blacklistReason}
                      onChange={(e) => setBlacklistReason(e.target.value)}
                      required
                      rows={2}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3.5 py-2.5 text-xs font-mono text-white focus:outline-none focus:border-red-500 shadow-inner"
                    />

                    <button
                      type="submit"
                      disabled={submittingBlacklist}
                      className="bg-red-950 hover:bg-red-900 border border-red-500/60 text-red-200 text-xs font-mono px-6 py-3 rounded-lg transition-all uppercase tracking-widest font-bold shadow-[0_0_15px_rgba(239,68,68,0.3)]"
                    >
                      {submittingBlacklist ? 'Filing Entry...' : 'Submit Blacklist Entry'}
                    </button>
                  </form>
                ) : (
                  <div className="bg-amber-950/30 border border-amber-500/40 p-4 rounded-xl text-xs font-mono text-amber-300 flex items-center space-x-3 shadow-md">
                    <span>⚠️</span>
                    <span>Blacklist modifications are restricted to High Command (O7-O10). You have viewing rights only.</span>
                  </div>
                )}

                <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl overflow-hidden backdrop-blur-xl shadow-2xl">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-neutral-950/90 text-neutral-400 uppercase tracking-[0.15em] border-b border-neutral-800">
                      <tr>
                        <th className="px-5 py-3.5">Roblox User</th>
                        <th className="px-5 py-3.5">Roblox ID</th>
                        <th className="px-5 py-3.5">Duration</th>
                        <th className="px-5 py-3.5">Reason</th>
                        <th className="px-5 py-3.5">Issued By</th>
                        {userIsHicom && <th className="px-5 py-3.5 text-right">Action</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-800/60 text-neutral-300">
                      {blacklists.map((item) => (
                        <tr key={item.id} className="hover:bg-red-950/20 transition-colors">
                          <td className="px-5 py-3.5 font-semibold text-red-400">{item.roblox_username}</td>
                          <td className="px-5 py-3.5 text-neutral-400">{item.roblox_id}</td>
                          <td className="px-5 py-3.5 text-yellow-400 font-bold">{item.duration || 'Permanent'}</td>
                          <td className="px-5 py-3.5 text-neutral-200">{item.reason}</td>
                          <td className="px-5 py-3.5 font-mono text-cyan-400 font-semibold">{item.blacklisted_by}</td>
                          {userIsHicom && (
                            <td className="px-5 py-3.5 text-right">
                              <button
                                onClick={() => handleRemoveBlacklist(item)}
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

            {/* DOCUMENTS TAB */}
            {activeTab === 'documents' && (
              <div className="space-y-6">
                <div className="border-b border-neutral-800 pb-4">
                  <h2 className="text-base font-mono font-bold text-neutral-100 tracking-widest uppercase flex items-center space-x-2">
                    <span className="text-cyan-400">❖</span>
                    <span>OFFICIAL DHS DOCUMENTS</span>
                  </h2>
                  <p className="text-xs font-mono text-neutral-400 mt-1">
                    {userIsHicom ? 'Link External Secure Documents & Set Target Ranks' : 'Authorized Document Registry'}
                  </p>
                </div>

                {userIsHicom && (
                  <form onSubmit={handleCreateDocument} className="bg-neutral-900/80 backdrop-blur-xl border border-cyan-900/50 p-6 rounded-xl space-y-5 shadow-[0_8px_30px_rgba(0,0,0,0.5)]">
                    <h3 className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-[0.2em]">
                      [+] LINK EXTERNAL DOCUMENT
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-[10px] font-mono text-neutral-400 uppercase tracking-widest mb-1.5 font-semibold">Document Title</label>
                        <input
                          type="text"
                          placeholder="e.g. O6-O10 Tryout Guidelines"
                          value={docTitle}
                          onChange={(e) => setDocTitle(e.target.value)}
                          required
                          className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3.5 py-2.5 text-xs font-mono text-white focus:outline-none focus:border-cyan-400 shadow-inner"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-mono text-neutral-400 uppercase tracking-widest mb-1.5 font-semibold">Document URL (Google Doc, Notion, etc.)</label>
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
                      <label className="block text-[10px] font-mono text-neutral-400 uppercase tracking-widest mb-2 font-semibold">Select Ranks Permitted to View This Document</label>
                      <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 space-y-4 shadow-inner">
                        {['HIGH COMMAND', 'MIDDLE COMMAND', 'LOW COMMAND'].map((cat) => {
                          const catRanks = RANKS.filter((r) => r.category === cat);
                          return (
                            <div key={cat} className="space-y-2">
                              <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-[0.2em] block font-semibold">{cat}</span>
                              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                                {catRanks.map((r) => {
                                  const isChecked = docSelectedRanks.includes(r.code);
                                  return (
                                    <label key={r.code} className="flex items-center space-x-2.5 text-xs font-mono cursor-pointer select-none bg-neutral-900/60 px-3 py-2.5 rounded-lg border border-neutral-800 hover:border-neutral-700 transition-colors">
                                      <input
                                        type="checkbox"
                                        checked={isChecked}
                                        onChange={() => handleToggleRankPermission(r.code)}
                                        className="rounded bg-neutral-900 border-neutral-700 text-cyan-400 focus:ring-0"
                                      />
                                      <span className={isChecked ? 'text-cyan-300 font-bold' : 'text-neutral-400'}>
                                        {r.code}
                                      </span>
                                    </label>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={submittingDoc}
                      className="bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/60 text-cyan-200 text-xs font-mono px-6 py-3 rounded-lg transition-all uppercase tracking-widest font-bold shadow-[0_0_15px_rgba(6,182,212,0.3)]"
                    >
                      {submittingDoc ? 'Publishing Link...' : 'Publish Document Link with Target Ranks'}
                    </button>
                  </form>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 bg-neutral-900/60 border border-neutral-800 rounded-xl overflow-hidden backdrop-blur-xl shadow-2xl">
                    <div className="px-5 py-3.5 bg-neutral-950/90 border-b border-neutral-800 flex justify-between items-center">
                      <span className="text-xs font-mono font-bold text-neutral-300 uppercase tracking-widest">
                        Available Document Links ({visibleDocuments.length})
                      </span>
                    </div>

                    <div className="divide-y divide-neutral-800/60">
                      {visibleDocuments.length === 0 ? (
                        <div className="p-8 text-center text-xs font-mono text-neutral-500 italic">
                          No authorized document links available for your clearance level.
                        </div>
                      ) : (
                        visibleDocuments.map((doc) => {
                          const isSelected = selectedDocument?.id === doc.id;
                          return (
                            <div
                              key={doc.id}
                              onClick={() => setSelectedDocument(doc)}
                              className={`p-4.5 cursor-pointer transition-colors ${
                                isSelected ? 'bg-cyan-950/60 border-l-4 border-cyan-400' : 'hover:bg-cyan-950/20'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <h4 className="text-xs font-mono font-bold text-cyan-400">{doc.title}</h4>
                                <span className="text-[10px] font-mono text-neutral-500">{new Date(doc.created_at).toLocaleDateString()}</span>
                              </div>
                              <div className="flex flex-wrap gap-1.5 mt-3">
                                {doc.allowed_ranks?.map((code) => (
                                  <span key={code} className="bg-neutral-950 text-yellow-400 text-[9px] font-mono px-2.5 py-0.5 rounded-md border border-neutral-800 font-semibold">
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

                  <div className="bg-neutral-900/80 border border-neutral-800 rounded-xl p-5 font-mono space-y-4 backdrop-blur-xl self-start shadow-2xl">
                    <h3 className="text-xs font-bold text-yellow-400 uppercase tracking-[0.2em] border-b border-neutral-800 pb-3">
                      Document Reader
                    </h3>
                    {selectedDocument ? (
                      <div className="space-y-4 text-xs">
                        <div>
                          <span className="text-[10px] text-neutral-500 uppercase tracking-widest block font-semibold">Title</span>
                          <span className="font-bold text-white text-sm">{selectedDocument.title}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-neutral-500 uppercase tracking-widest block font-semibold">Linked By (HICOM)</span>
                          <span className="text-cyan-400 font-semibold">{selectedDocument.created_by}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-neutral-500 uppercase tracking-widest block mb-1.5 font-semibold">Secure External Link</span>
                          <a
                            href={selectedDocument.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block bg-cyan-950/90 hover:bg-cyan-900 border border-cyan-500/60 text-cyan-200 p-3 rounded-lg text-center font-bold tracking-widest uppercase transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)]"
                          >
                            Open Document ↗
                          </a>
                        </div>

                        {userIsHicom && (
                          <button
                            onClick={() => handleRemoveDocument(selectedDocument)}
                            className="w-full bg-red-950/60 hover:bg-red-900 border border-red-600/50 text-red-300 text-[10px] font-mono px-3.5 py-2.5 rounded-lg transition-all uppercase tracking-wider font-semibold mt-4 shadow-sm"
                          >
                            Delete Document Link
                          </button>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-neutral-500 italic py-10 text-center">
                        Select a document from the list to open its link.
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