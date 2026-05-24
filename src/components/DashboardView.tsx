import React, { useState } from 'react';
import { 
  Bot, RefreshCw, Layers, Shield, ToggleLeft, ToggleRight, CheckSquare, Square, 
  Play, AlertCircle, Plus, Send, ShieldCheck, Calendar, HardDrive, FileText, 
  Sparkles, Clock, TrendingUp, Activity, LogOut, Check, ChevronRight, Loader2, 
  ArrowRight, ExternalLink, Lock, Database
} from 'lucide-react';
import { KarmaState, Agent, Task, CronMetric } from '../types';
import { updateGoogleTaskStatus, GoogleTask } from '../lib/googleAuth';

interface DashboardViewProps {
  state: KarmaState;
  onUpdateState: (newState: KarmaState) => void;
  onSyncCrons: () => void;
  syncInProgress: boolean;
  onDeployAgent: (agentData: Partial<Agent>) => void;
  googleUser: any;
  googleToken: string | null;
  googleTasks: GoogleTask[];
  googleCalendarEvents: any[];
  googleDriveFiles: any[];
  googleSyncing: string | null;
  loadingGoogleAuth: boolean;
  onGoogleSignIn: () => Promise<void>;
  onGoogleSignOut: () => Promise<void>;
  onReloadGoogle: (token: string) => Promise<void>;
}

export default function DashboardView({
  state,
  onUpdateState,
  onSyncCrons,
  syncInProgress,
  onDeployAgent,
  googleUser,
  googleToken,
  googleTasks,
  googleCalendarEvents,
  googleDriveFiles,
  googleSyncing,
  loadingGoogleAuth,
  onGoogleSignIn,
  onGoogleSignOut,
  onReloadGoogle
}: DashboardViewProps) {
  const [showDeployModal, setShowDeployModal] = useState(false);
  const [newAgent, setNewAgent] = useState({
    name: '',
    platform: 'HuggingFace Space',
    role: '',
    model: 'groq/llama-3.3-70b-versatile',
    endpoint: ''
  });

  const [commandText, setCommandText] = useState('');
  const [googleToggling, setGoogleToggling] = useState<string | null>(null);

  const handleToggleGoogleTask = async (task: GoogleTask) => {
    if (!googleToken) return;
    const nextStatus = task.status === 'completed' ? 'needsAction' : 'completed';
    setGoogleToggling(task.id);
    try {
      await updateGoogleTaskStatus(googleToken, task.id, nextStatus);
      await onReloadGoogle(googleToken);
    } catch (e) {
      console.error(e);
    } finally {
      setGoogleToggling(null);
    }
  };

  // Handle task checkbox click to toggle state
  const handleToggleTask = async (task: Task) => {
    const nextStatus = task.status === 'done' ? 'pending' : 'done';
    try {
      const response = await fetch(`/api/v1/tasks/${task.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (response.ok) {
        // Fetch fresh state to update UI
        const refreshedResponse = await fetch('/api/v1/state');
        if (refreshedResponse.ok) {
          const freshData = await refreshedResponse.json();
          onUpdateState(freshData);
        }
      }
    } catch (err) {
      console.error("Failed to toggle task:", err);
    }
  };

  const submitDeployAgent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAgent.name) return;
    onDeployAgent(newAgent);
    setNewAgent({ name: '', platform: 'HuggingFace Space', role: '', model: 'groq/llama-3.3-70b-versatile', endpoint: '' });
    setShowDeployModal(false);
  };

  const handleSendCommand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commandText.trim()) return;

    // Simulate sending task command to API
    try {
      const resp = await fetch('/api/v1/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: commandText,
          priority: 'medium',
          context: 'shell'
        })
      });
      if (resp.ok) {
        setCommandText('');
        const stateResp = await fetch('/api/v1/state');
        if (stateResp.ok) {
          onUpdateState(await stateResp.json());
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Avatar lookup to give agents beautiful avatars
  const getAgentAvatar = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes('hermes')) {
      return 'https://lh3.googleusercontent.com/aida-public/AB6AXuBbibQLvPgIewO-ucQtN50F3EzZqGUP9rOZOwzF7GDoQeDYTSqUpf7QKAuG5w8my3tHrLabYvbM_zcRBx1FsxFfhTP-MwL0B9s6Q-bZ3h1OA5YsEXMY6r9YzyhtdPSTYR2hB5HXRlfXM5ulPxrsm3afim3oJUGSzubUZkxJUPoi-IB9G-cT4ojz7qUs0iVeJClts-iwni_QaNI_V080PpTk4UWCdsyPe82rLfQAlJLF7kbxg7SqB6tOS3cLcHGMK9YVEXdejZ0P5M9B';
    }
    if (n.includes('antigravity')) {
      return 'https://lh3.googleusercontent.com/aida-public/AB6AXuDEb_xoVyVJU1j-dWDwCLGEgnM5nkJf3Fq3wplwAXeRcpUWFM0fgUsMDJn1KJtQPf4A-smOYD_wsefZf15F29vdNmcAokzY78Vzwx3np81f27wlZaRvvzszZ2d90LOaQT6CcuEJvytZ9USzo6ImTvmMdVRtYrrBuF1uJN9i9qeyDk_zHoiMl4JDhlZAndYL0tgr8IcWr78WIV4R7AMsXN8UO0SoruDDsCy3bhiWiG3CEnuHDNoWRulMRnuQwdg4ZLgICDhlcVI59xtI';
    }
    if (n.includes('gemini')) {
      return 'https://lh3.googleusercontent.com/aida-public/AB6AXuAtww-XpWwXSmuzGgq6SHgM7bJwRZG9kHcZyp7DHjSKjEf6gsV9Y8Ni845PhFYoBpSDKW3WFTC01f0WS0kJcaM8a-WDNGcWcDO1x6ez8ToKVAlPtcG4fexnBupyR2oNyr-NEVF7yMYGBdQY6csLXriWJjQcUw5tlz2EW2tZhiOm36Jv2j6F7ZZ1hYNvJ8b5od5IRkUMEA2I85CFXm11Dl8jq5XuThIJ1cerHsw7U1kDXKKp5FFEqotJem1dZ9gXR2Cz4OThuN8ZopdB';
    }
    return 'https://lh3.googleusercontent.com/aida-public/AB6AXuAtL1kLgZHgdn8fuJfeUhE3vI1OELtF3k8sUwwCDm6P2mFzZXGCSLNEgd5pEZcr2nlQZY670FKhmml5PA6edrhtwW_NzVymDMk9OcOc5dLQfl1vJ7AYF9G6PkeFruexUhNkBRpxTe7l8GTm8x-fLNb4sLYWkREVCmBuqxrWeVBXIHZf1MHXfvnN7u3bw4uUJXk3WCc7Y140BiKyTYrWuxy_-HUIM67T90nqMRKuHQ9f-UkTiWfU1pnNEeWLeQZmEsQoJ_d5Aji84neh';
  };

  const getCronStatusColor = (status: string) => {
    switch (status) {
      case 'SUCCESS': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      case 'RUNNING': return 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20';
      case 'FAILED': return 'text-red-400 bg-red-400/10 border-red-400/20';
      case 'CRITICAL': return 'text-amber-400 bg-amber-500/10 border-amber-500/30 font-bold';
      case 'SCHEDULED': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
      default: return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
    }
  };

  const totalDoneTasks = state.tasks.filter(t => t.status === 'done').length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12" id="dashboard-view-root">
      {/* Top Banner Row */}
      <section className="bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-6 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6" id="dashboard-banner">
        <div className="space-y-2 max-w-lg z-20">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-primary border border-primary/20 bg-primary/5 px-2 py-0.5 rounded uppercase tracking-wider font-semibold">COGNITIVE COMPUTE</span>
            <span className="text-[10px] font-mono text-secondary border border-secondary/10 bg-secondary/5 px-2 py-0.5 rounded uppercase tracking-wider font-semibold">T1 NODE ACTIVE</span>
          </div>
          <h1 className="font-headline text-2xl font-bold tracking-tight text-on-surface">KARMA-OS Mission Control</h1>
          <p className="text-xs text-on-surface-variant leading-relaxed">
            Personal AI orchestration cluster active. Hermes delivers summaries, Antigravity tracks code repos, data is safely indexed onto Obsidian.
          </p>
        </div>

        {/* Rapid Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800 z-20" id="header-counters">
          <div className="p-3 text-center md:text-left">
            <div className="text-[9px] font-mono text-on-surface-variant font-medium uppercase tracking-wider">TASKS TODAY</div>
            <div className="font-mono text-md font-bold text-primary mt-1">{totalDoneTasks}/{state.tasks.length}</div>
            <div className="w-full bg-slate-800 h-1 rounded-full mt-1.5 overflow-hidden">
              <div 
                className="bg-primary h-full transition-all duration-500" 
                style={{ width: `${(totalDoneTasks / Math.max(1, state.tasks.length)) * 100}%` }}
              ></div>
            </div>
          </div>
          <div className="p-3 text-center md:text-left border-l border-slate-800/60">
            <div className="text-[9px] font-mono text-on-surface-variant font-medium uppercase tracking-wider">XP REWARD</div>
            <div className="font-mono text-md font-bold text-emerald-400 mt-1">+{state.stats.xpEarnedToday}</div>
            <div className="text-[9px] font-mono text-emerald-500/70 mt-0.5 font-medium">NOMINAL GAIN</div>
          </div>
          <div className="p-3 text-center md:text-left border-l border-slate-800/60">
            <div className="text-[9px] font-mono text-on-surface-variant font-medium uppercase tracking-wider">CONTEXT IN USE</div>
            <div className="font-mono text-md font-bold text-cyan-400 mt-1">{(state.stats.tokensUsed / 1000).toFixed(1)}K</div>
            <div className="text-[9px] font-mono text-on-surface-variant font-medium mt-0.5">tokens</div>
          </div>
          <div className="p-3 text-center md:text-left border-l border-slate-800/60">
            <div className="text-[9px] font-mono text-on-surface-variant font-medium uppercase tracking-wider">CRONS STATUS</div>
            <div className="font-mono text-md font-bold text-purple-400 mt-1">
              {state.crons.filter(c => c.status === 'SUCCESS' || c.status === 'RUNNING').length}/{state.crons.length} OK
            </div>
            <div className="text-[9px] font-mono text-amber-400 font-semibold mt-0.5">
              {state.crons.filter(c => c.status === 'FAILED' || c.status === 'CRITICAL').length} FAIL
            </div>
          </div>
        </div>

        <div className="scanline" />
      </section>

      {/* Google Workspace Connection Banner */}
      {!googleUser ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4 relative overflow-hidden group shadow-sm text-left" id="dashboard-google-connect-promo">
          <div className="absolute top-0 right-0 w-36 h-36 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-all"></div>
          <div className="flex items-start gap-4 text-left">
            <div className="w-11 h-11 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-primary mt-1 shrink-0">
              <Lock className="w-4.5 h-4.5 text-primary animate-pulse" />
            </div>
            <div className="space-y-1">
              <div className="text-[9px] font-mono text-primary font-bold uppercase tracking-widest flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-primary pulse-dot"></span>
                 INTEGRATIONS SINK DETECTED
              </div>
              <h3 className="font-headline font-semibold text-sm text-on-surface">Link Google Workspace to KARMA-OS</h3>
              <p className="text-[11px] text-on-surface-variant max-w-xl leading-relaxed">
                Connect your account securely to automatically display your daily schedule flow, synchronize task checkboxes, browse vault files with Google Picker, and map smart cognitive workload density charts on Mission Control.
              </p>
            </div>
          </div>
          
          {loadingGoogleAuth ? (
            <div className="flex items-center gap-2 text-xs font-mono text-outline shrink-0">
              <Loader2 className="w-4 h-4 animate-spin" /> Verifying link...
            </div>
          ) : (
            <button
              onClick={onGoogleSignIn}
              className="bg-primary hover:bg-primary-dim text-black font-semibold text-xs py-2.5 px-5 rounded-xl transition-all cursor-pointer flex items-center gap-2 shrink-0 select-none shadow-md uppercase font-mono tracking-wider"
              id="dash-google-sign-in-promo-btn"
            >
              <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-4 h-4 shrink-0">
                <path fill="#020617" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                <path fill="#020617" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                <path fill="#020617" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                <path fill="#020617" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
              </svg>
              Connect Accounts
            </button>
          )}
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-5 relative overflow-hidden" id="dashboard-google-workspace-widget">
          
          {/* Header row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/60 pb-3" id="dash-g-header">
            <div className="text-left">
              <h3 className="font-headline font-bold text-sm text-on-surface flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary animate-pulse shrink-0" />
                Google Workspace Live Highlights
              </h3>
              <p className="text-[10px] text-on-surface-variant font-mono">
                Linked Account: <span className="text-[#a5ffc1] font-bold select-all">{googleUser.email}</span> · Heartbeat synced
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button 
                onClick={() => onReloadGoogle(googleToken!)}
                disabled={!!googleSyncing}
                className="p-1 px-3 border border-slate-800 rounded-lg bg-slate-950 hover:bg-slate-800 text-outline cursor-pointer transition-all flex items-center gap-1.5 text-[10px] font-mono"
                title="Reload Google Workspace data"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${googleSyncing ? 'animate-spin text-primary' : 'text-outline'}`} />
                {googleSyncing ? 'SYNCING...' : 'RELOAD FEED'}
              </button>

              <button 
                onClick={onGoogleSignOut}
                className="p-1.5 border border-slate-800 bg-slate-950 hover:bg-rose-950/70 hover:border-rose-900 hover:text-rose-400 text-outline rounded-lg text-xs"
                title="Disconnect Google Account"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Aggregate Stats Section */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3" id="dash-g-aggregates">
            
            {/* Health Score Calculation */}
            {(() => {
              const taskScore = googleTasks.length > 0 ? (googleTasks.filter(t => t.status === 'completed').length / googleTasks.length) * 40 : 20;
              const calScore = Math.min(40, googleCalendarEvents.length * 4);
              const driveScore = Math.min(20, googleDriveFiles.length * 2);
              const totalHealth = Math.round(taskScore + calScore + driveScore);

              return (
                <div className="bg-slate-950 border border-slate-850 rounded-xl p-3 flex items-center justify-between text-left">
                  <div>
                    <div className="text-[9px] font-mono text-outline uppercase tracking-wider">Sync Integrity</div>
                    <div className="text-md font-mono font-bold text-primary mt-1">{totalHealth}%</div>
                  </div>
                  <Activity className="w-4.5 h-4.5 text-primary animate-pulse shrink-0" />
                </div>
              );
            })()}

            <div className="bg-slate-950 border border-slate-850 rounded-xl p-3 flex items-center justify-between text-left">
              <div>
                <div className="text-[9px] font-mono text-outline uppercase tracking-wider">Meetings / Events</div>
                <div className="text-md font-mono font-bold text-cyan-400 mt-1">{googleCalendarEvents.length} Sessions</div>
              </div>
              <Calendar className="w-4.5 h-4.5 text-cyan-400 shrink-0" />
            </div>

            <div className="bg-slate-950 border border-slate-850 rounded-xl p-3 flex items-center justify-between text-left">
              <div>
                <div className="text-[9px] font-mono text-outline uppercase tracking-wider">Tasks Resolution</div>
                <div className="text-md font-mono font-bold text-emerald-400 mt-1">
                  {googleTasks.filter(t => t.status === 'completed').length}/{googleTasks.length} Done
                </div>
              </div>
              <CheckSquare className="w-4.5 h-4.5 text-emerald-400 shrink-0" />
            </div>

            <div className="bg-slate-950 border border-slate-850 rounded-xl p-3 flex items-center justify-between text-left">
              <div>
                <div className="text-[9px] font-mono text-outline uppercase tracking-wider">Storage Files</div>
                <div className="text-md font-mono font-bold text-purple-400 mt-1">{googleDriveFiles.length} Indexed</div>
              </div>
              <HardDrive className="w-4.5 h-4.5 text-purple-400 shrink-0" />
            </div>
          </div>

          {/* Double Column Graphs & Feed view */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5" id="dash-g-bento-sub">
            
            {/* Left Box: SVG Area chart and timeline list */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-4 lg:col-span-2 text-left" id="dash-g-charts-column">
              <div className="flex items-center justify-between pb-1 border-b border-slate-850">
                <div className="flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  <span className="text-[9px] font-mono text-on-surface uppercase tracking-wider font-bold">Workspace load density curve</span>
                </div>
                <span className="text-[8px] font-mono text-outline uppercase">TIMETABLE ANOMALIES</span>
              </div>

              {/* Area Line Chart render */}
              <div className="h-40 w-full flex items-center justify-center bg-slate-900 border border-slate-850 rounded-xl p-2.5" id="dash-g-svg-canvas">
                {googleCalendarEvents.length === 0 ? (
                  <div className="text-center font-mono text-[9px] text-outline">
                    Please populate your calendar events to render workload density.
                  </div>
                ) : (
                  <svg viewBox="0 0 380 130" className="w-full h-full text-slate-400" id="dash-g-area-line-map">
                    <line x1="25" y1="105" x2="355" y2="105" stroke="#1e293b" strokeWidth="1" />
                    <line x1="25" y1="15" x2="25" y2="105" stroke="#1e293b" strokeWidth="1" />
                    
                    {(() => {
                      const counts = [0, 0, 0, 0, 0, 0, 0]; // Mon-Sun
                      googleCalendarEvents.forEach(evt => {
                        const dateStr = evt.start.dateTime || evt.start.date;
                        if (dateStr) {
                          const d = new Date(dateStr);
                          let dayIndex = d.getDay();
                          dayIndex = dayIndex === 0 ? 6 : dayIndex - 1;
                          if (dayIndex >= 0 && dayIndex < 7) {
                            counts[dayIndex]++;
                          }
                        }
                      });

                      const maxEventsVal = Math.max(...counts, 1);
                      const coords = counts.map((v, idx) => ({
                        x: 30 + idx * 52,
                        y: 105 - (v / maxEventsVal) * 75,
                        val: v
                      }));

                      const ariaPts = [
                        `30`, `105`,
                        ...coords.map(c => `${c.x},${c.y}`),
                        `342`, `105`
                      ].join(' ');

                      const linePts = coords.map(c => `${c.x},${c.y}`).join(' ');

                      return (
                        <>
                          <defs>
                            <linearGradient id="widgetGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#d2f232" stopOpacity="0.22" />
                              <stop offset="100%" stopColor="#d2f232" stopOpacity="0.00" />
                            </linearGradient>
                          </defs>

                          <polygon points={ariaPts} fill="url(#widgetGradient)" />
                          <polyline points={linePts} fill="none" stroke="#d2f232" strokeWidth="2" />

                          {coords.map((c, idx) => {
                            const labels = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
                            return (
                              <g key={idx}>
                                <circle cx={c.x} cy={c.y} r="3.5" fill="#020617" stroke="#d2f232" strokeWidth="1.5" />
                                {c.val > 0 && (
                                  <text x={c.x} y={c.y - 7} textAnchor="middle" fill="#ffffff" fontSize="7" fontFamily="monospace" fontWeight="bold">
                                    {c.val}
                                  </text>
                                )}
                                <text x={c.x} y="117" textAnchor="middle" fill="#64748b" fontSize="7" fontFamily="monospace">
                                  {labels[idx]}
                                </text>
                              </g>
                            );
                          })}
                        </>
                      );
                    })()}
                  </svg>
                )}
              </div>

              {/* Items lists row */}
              <div className="space-y-1.5" id="dash-g-upcoming-items">
                <div className="text-[9px] font-mono text-outline uppercase tracking-wider">Timeline queue feed:</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-[110px] overflow-y-auto pr-1">
                  {googleCalendarEvents.slice(0, 4).map(evt => {
                    const dt = evt.start.dateTime || evt.start.date || 'All-Day';
                    const friendlyTime = dt.includes('T') ? new Date(dt).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit' }) : dt;
                    return (
                      <div key={evt.id} className="bg-slate-900 border border-slate-850 rounded-lg p-2.5 flex items-center justify-between gap-1.5 hover:border-slate-800 transition-all">
                        <div className="min-w-0 flex-grow text-left">
                          <div className="text-[11px] font-semibold text-on-surface truncate font-sans">{evt.summary}</div>
                          <div className="text-[8.5px] font-mono text-outline mt-0.5">{friendlyTime}</div>
                        </div>
                        <Calendar className="w-3.5 h-3.5 text-cyan-400 opacity-60 shrink-0" />
                      </div>
                    );
                  })}
                  {googleCalendarEvents.length === 0 && (
                    <div className="text-[9.5px] font-mono text-outline col-span-2 py-4 text-center select-none">No events retrieved. Active scheduler is clean.</div>
                  )}
                </div>
              </div>

            </div>

            {/* Right Box: Live Google Tasks List checkboxes with status updates */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col justify-between text-left" id="dash-g-tasks-column">
              <div className="space-y-3.5">
                <div className="flex items-center justify-between pb-1 border-b border-slate-850">
                  <div className="flex items-center gap-1.5">
                    <CheckSquare className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="text-[9px] font-mono text-on-surface uppercase tracking-wider font-bold">Cloud Checklist stream</span>
                  </div>
                  <span className="text-[8.5px] font-mono text-outline uppercase">{googleTasks.filter(t => t.status !== 'completed').length} pending</span>
                </div>

                <div className="space-y-2 max-h-[170px] overflow-y-auto pr-1" id="dash-google-tasks-scroll">
                  {googleTasks.slice(0, 4).map(task => {
                    const doneState = task.status === 'completed';
                    const toggling = googleToggling === task.id;
                    return (
                      <div 
                        key={task.id} 
                        onClick={() => !toggling && handleToggleGoogleTask(task)}
                        className={`p-2.5 rounded-lg border flex items-center justify-between gap-2.5 cursor-pointer select-none transition-all ${
                          doneState 
                            ? 'bg-slate-900/40 border-slate-850 opacity-55' 
                            : 'bg-slate-900 border border-slate-850 hover:border-emerald-500/30 hover:bg-slate-900/80'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0 text-left">
                          {toggling ? (
                            <Loader2 className="w-3.5 h-3.5 text-emerald-400 animate-spin shrink-0" />
                          ) : doneState ? (
                            <span className="w-3.5 h-3.5 rounded bg-emerald-500/10 border border-emerald-500 flex items-center justify-center text-emerald-400 text-[10px] shrink-0 font-bold font-mono">
                              ✓
                            </span>
                          ) : (
                            <span className="w-3.5 h-3.5 rounded border border-slate-700 hover:border-emerald-400 shrink-0 block"></span>
                          )}
                          <div className="min-w-0">
                            <div className={`text-[11px] font-semibold truncate leading-tight ${doneState ? 'line-through text-outline font-normal' : 'text-on-surface'}`}>
                              {task.title}
                            </div>
                            {task.notes && <p className="text-[8.5px] text-outline truncate select-all">{task.notes}</p>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {googleTasks.length === 0 && (
                    <div className="text-[9.5px] font-mono text-outline py-8 text-center select-none">No pending google tasks located. Checklist clear!</div>
                  )}
                </div>
              </div>

              {/* Redirection detail */}
              <div className="border-t border-slate-800/40 pt-2.5 mt-2 flex items-center justify-between" id="dash-g-cta">
                <span className="text-[8.5px] font-mono text-outline flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
                  G-VAULT STREAM ACTIVE
                </span>
                <span className="text-primary text-[10px] font-mono uppercase inline-flex items-center gap-1 font-bold">
                  GO TO DATA HUB FOR PICKER
                </span>
              </div>

            </div>

          </div>

        </div>
      )}

      {/* Agents Cluster Rows */}
      <section className="space-y-3" id="agents-grid-container">
        <h2 className="text-[11px] font-mono uppercase tracking-widest text-on-surface-variant font-semibold flex items-center gap-2">
          <Bot className="w-3.5 h-3.5" />
          ACTIVE DEPLOYED AGENTS ({state.agents.length})
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4" id="dashboard-agents-grid">
          {state.agents.map((agent) => (
            <div key={agent.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 glow-card flex flex-col justify-between h-[155px]" id={`agent-card-${agent.id}`}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full border border-primary/20 overflow-hidden bg-[#020617]">
                    <img src={getAgentAvatar(agent.name)} alt={agent.name} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h3 className="font-headline font-semibold text-sm text-on-surface">{agent.name}</h3>
                    <p className="text-[10px] font-mono text-on-surface-variant">{agent.category}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${
                    agent.status === 'ONLINE' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' :
                    agent.status === 'ACTIVE' ? 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20' :
                    'text-amber-400 bg-amber-500/10 border-amber-500/20'
                  }`}>
                    {agent.status}
                  </span>
                </div>
              </div>

              <div className="my-2 text-[11px] font-sans text-on-surface/90 line-clamp-1">
                {agent.role}
              </div>

              <div id="agent-mini-metrics" className="border-t border-outline-variant/10 pt-2 flex items-center justify-between text-[10px] font-mono">
                <div>
                  <span className="text-on-surface-variant">CPU: </span>
                  <span className="text-secondary-dim font-bold">{agent.cpu}%</span>
                </div>
                <div>
                  <span className="text-on-surface-variant">PING: </span>
                  <span className="text-on-surface font-semibold">{agent.lastPing}</span>
                </div>
              </div>
            </div>
          ))}

          {/* Add New Agent Card Trigger */}
          <button 
            onClick={() => setShowDeployModal(true)}
            className="border border-dashed border-indigo-500/20 hover:border-indigo-500/60 bg-indigo-500/5 hover:bg-indigo-500/10 rounded-2xl p-4 flex flex-col items-center justify-center text-center gap-2 h-[155px] cursor-pointer group transition-all"
            id="btn-trigger-deploy-modal"
          >
            <div className="w-10 h-10 rounded-full border border-dashed border-indigo-500/30 group-hover:border-indigo-500/70 flex items-center justify-center text-primary-dim group-hover:text-primary transition-all">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-headline font-semibold text-primary">Deploy Agent</div>
              <div className="text-[10px] font-mono text-on-surface-variant mt-0.5">Sprout new local or remote node</div>
            </div>
          </button>
        </div>
      </section>

      {/* Middle Grid - Crons, XP Meter, Privacy */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" id="dashboard-mid-panel">
        
        {/* Crons Health Column */}
        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between" id="cron-health-sec">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-secondary" />
                <h3 className="text-xs font-headline font-bold text-on-surface uppercase tracking-wide">Cron Scheduler Matrix</h3>
              </div>
              <button 
                onClick={onSyncCrons}
                disabled={syncInProgress}
                className="text-[10px] font-mono text-secondary hover:text-primary border border-secondary/30 hover:border-primary/50 bg-slate-950 px-3 py-1 rounded-lg inline-flex items-center gap-1.5 transition-all cursor-pointer"
                id="btn-sync-action-cron"
              >
                <RefreshCw className={`w-3 h-3 ${syncInProgress ? 'animate-spin' : ''}`} />
                {syncInProgress ? 'SYNCING...' : 'RUN METRIC SYNCS'}
              </button>
            </div>

            <p className="text-[11px] text-on-surface-variant leading-relaxed">
              Diagnostic heartbeat trackers checking raw API streams, feeds, and DB dumps. Failures trigger local system warnings.
            </p>

            {/* Crons List grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2" id="cron-grid">
              {state.crons.map((cron) => (
                <div key={cron.id} className="bg-slate-950 border border-slate-800 rounded-xl p-2 flex flex-col justify-between h-[58px]" id={`cron-${cron.id}`}>
                  <span className="text-[10px] font-mono text-on-surface truncate font-semibold">@{cron.name}</span>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[9px] font-mono text-outline">{cron.time}</span>
                    <span className={`text-[8px] font-mono font-bold px-1 rounded-sm border ${getCronStatusColor(cron.status)}`}>
                      {cron.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 border-t border-slate-800/60 pt-3 flex items-center justify-between" id="cron-connection-foot">
            <div className="text-[10px] font-mono text-outline">
              BACKEND: <span className="text-[#96e3ff] font-bold">SUPABASE DB SYNC ACTIVE</span>
            </div>
            <div className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 pulse-dot"></div>
              PING OK · 18ms
            </div>
          </div>
        </section>

        {/* XP meters & Privacy Tiers Column */}
        <section className="space-y-4" id="dashboard-xp-privacy-column">
          {/* XP Progress Dashboard */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3" id="xp-meter-block">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-headline font-bold text-on-surface uppercase tracking-wide">Cognitive Progression Metrics</h3>
              <span className="text-[10px] font-mono text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-md">WEEKLY CAP: 2000 XP</span>
            </div>

            <div className="flex items-end gap-4" id="xp-charts-wrapper">
              <div className="flex-grow space-y-2.5">
                <div>
                  <div className="flex justify-between text-[11px] font-mono mb-1">
                    <span className="text-outline">COGNITIVE XP (research, notes)</span>
                    <span className="text-secondary font-bold">{state.stats.cognitiveXp} XP</span>
                  </div>
                  <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                    <div className="bg-secondary h-full transition-all duration-500" style={{ width: `${Math.min(100, (state.stats.cognitiveXp / 250) * 100)}%` }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] font-mono mb-1">
                    <span className="text-outline">TECHNICAL XP (coding, crons, terminals)</span>
                    <span className="text-tertiary-fixed-dim font-bold">{state.stats.technicalXp} XP</span>
                  </div>
                  <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                    <div className="bg-tertiary h-full transition-all duration-500" style={{ width: `${Math.min(100, (state.stats.technicalXp / 250) * 100)}%` }}></div>
                  </div>
                </div>
              </div>

              {/* Total Box */}
              <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl text-center min-w-[100px]" id="xp-aggregate-box">
                <div className="text-[9px] font-mono text-outline uppercase tracking-wider">TOTAL EXP</div>
                <div className="font-mono text-xl font-bold text-primary mt-1">{state.stats.weeklyTotalXp}</div>
                <div className="text-[8px] font-mono text-indigo-400 mt-0.5 font-bold">LEVEL 14</div>
              </div>
            </div>
          </div>

          {/* Privacy Tiers Indicator Row */}
          <div className="grid grid-cols-3 gap-2" id="privacy-row">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 text-center transition-all hover:bg-slate-950 hover:border-indigo-500/30" id="tier-cloud">
              <div className="font-mono text-[10px] font-bold text-primary">TIER 1 CLOUD</div>
              <div className="text-[8px] font-mono text-outline mt-1 font-semibold">GEMINI PRO · HOSTED</div>
              <div className="mt-1.5 flex justify-center text-primary-fixed">
                <Shield className="w-3.5 h-3.5" />
              </div>
            </div>
            
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 text-center transition-all hover:bg-slate-950 hover:border-cyan-500/30" id="tier-gateways">
              <div className="font-mono text-[10px] font-bold text-cyan-400">TIER 2 GROQ</div>
              <div className="text-[8px] font-mono text-outline mt-1 font-semibold">VERSATILE LLAMA·GATE</div>
              <div className="mt-1.5 flex justify-center text-cyan-400">
                <Layers className="w-3.5 h-3.5" />
              </div>
            </div>

            <div className="bg-slate-900 border-2 border-emerald-500/20 rounded-2xl p-3.5 text-center transition-all hover:bg-slate-950 hover:border-emerald-500/40 relative overflow-hidden" id="tier-local">
              <div className="absolute right-1.5 top-1.5 w-1.5 h-1.5 rounded-full bg-emerald-400 pulse-dot"></div>
              <div className="font-mono text-[10px] font-bold text-emerald-400">TIER 3 LOCAL</div>
              <div className="text-[8px] font-mono text-outline mt-1 font-semibold">OLLAMA MCP · OFFLINE</div>
              <div className="mt-1.5 flex justify-center text-emerald-400">
                <ShieldCheck className="w-3.5 h-3.5 animate-pulse" />
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Bottom Row - Checklists or Logs Terminal */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" id="dashboard-bottom-panel">
        
        {/* Recent Tasks Interactive Checklist */}
        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between" id="dashboard-tasks-panel">
          <div className="space-y-3">
            <h3 className="text-xs font-headline font-bold text-on-surface uppercase tracking-wide flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-primary" />
              Active Workspace Tasks
            </h3>
            
            <p className="text-[11px] text-on-surface-variant">
              Quick status check. Clack checklist to mark completed states and pull dynamic cognitive XP immediately.
            </p>

            <div className="space-y-2 max-h-[190px] overflow-y-auto pr-1" id="recent-tasks-checker">
              {state.tasks.slice(0, 5).map((task) => {
                const isCompleted = task.status === 'done';
                return (
                  <div 
                    key={task.id} 
                    onClick={() => handleToggleTask(task)}
                    className={`flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer ${
                      isCompleted 
                        ? 'bg-slate-950/40 border-slate-800/40 opacity-60' 
                        : 'bg-slate-950 border border-slate-800/60 hover:border-primary/40'
                    }`}
                    id={`checker-task-${task.id}`}
                  >
                    <div className="flex items-center gap-3">
                      {isCompleted ? (
                        <CheckSquare className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Square className="w-4 h-4 text-outline" />
                      )}
                      <div>
                        <span className={`text-[11px] font-sans font-medium text-on-surface ${isCompleted ? 'line-through text-outline' : ''}`}>
                          {task.title}
                        </span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[8px] font-mono uppercase bg-slate-900 px-1.5 py-0.5 border border-slate-800 rounded text-outline">
                            @{task.context}
                          </span>
                        </div>
                      </div>
                    </div>

                    <span className={`text-[8px] font-mono uppercase px-1.5 py-0.5 rounded ${
                      task.priority === 'urgent' ? 'text-red-400 border border-red-500/20 bg-red-500/5' :
                      task.priority === 'high' ? 'text-amber-400 border border-amber-500/20 bg-amber-500/5' :
                      'text-outline border border-slate-800 bg-slate-950'
                    }`}>
                      {task.priority}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <p className="text-[10px] text-on-surface-variant font-mono text-right mt-3">
            * Check status parameters directly on the <b>Data Hub</b> tab
          </p>
        </section>

        {/* System Logs CLI Terminal */}
        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between" id="dashboard-terminal-panel">
          <div className="space-y-3">
            <h3 className="text-xs font-headline font-bold text-on-surface uppercase tracking-wide flex items-center gap-1.5">
              <span className="terminal-cursor w-2 h-3.5 inline-block"></span>
              Inter-Agent Events Shell
            </h3>

            {/* Event console log logbox */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 h-[160px] overflow-y-auto font-mono text-[10px] leading-relaxed select-text space-y-1 scrollbar-thin" id="dashboard-console-feed">
              {state.events.slice(-8).map((evt) => (
                <div key={evt.id} className="flex gap-2">
                  <span className="text-slate-500 shrink-0">[{evt.time}]</span>
                  <span className="text-secondary shrink-0">{evt.agent}</span>
                  <span className="text-on-surface truncate">{evt.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick interactive command shell */}
          <form onSubmit={handleSendCommand} className="flex gap-2 mt-3.5" id="cli-shell-trigger">
            <div className="flex-grow flex items-center bg-slate-950 border border-slate-800 rounded-xl px-2.5">
              <span className="text-primary font-mono text-xs mr-1">{'>'}</span>
              <input 
                type="text" 
                value={commandText}
                onChange={(e) => setCommandText(e.target.value)}
                placeholder="Trigger tasks directly (e.g., Update doc parser notes)" 
                className="w-full bg-transparent border-0 ring-0 outline-none font-mono text-[11px] text-on-surface placeholder:text-slate-500 py-2.5"
                id="text-cli-shell-input"
              />
            </div>
            <button 
              type="submit"
              className="bg-primary hover:bg-primary-dim text-white font-semibold text-[11px] px-3.5 py-2.5 rounded-xl flex items-center gap-1 hover:shadow-md cursor-pointer transition-colors"
              id="btn-cli-submit"
            >
              <Send className="w-3.5 h-3.5" />
              INJECT
            </button>
          </form>
        </section>
      </div>

      {/* Deploy Agent Modal Drawer */}
      {showDeployModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 animate-fade-in" id="deploy-agent-drawer">
          <div className="bg-[#141418] border border-outline-variant/40 rounded-xl w-full max-w-md overflow-hidden relative" id="deploy-drawer-body">
            <div className="border-b border-outline-variant/20 p-4 bg-[#1a191f] flex items-center justify-between">
              <h3 className="font-headline font-bold text-sm text-on-surface">Deploy New Agent Node</h3>
              <button 
                onClick={() => setShowDeployModal(false)}
                className="text-outline hover:text-on-surface cursor-pointer text-xs"
              >
                ✕
              </button>
            </div>

            <form onSubmit={submitDeployAgent} className="p-5 space-y-4">
              <div>
                <label className="block text-[10px] font-mono text-outline uppercase tracking-wider mb-1">Agent Name *</label>
                <input 
                  type="text" 
                  value={newAgent.name}
                  onChange={(e) => setNewAgent({ ...newAgent, name: e.target.value })}
                  placeholder="e.g. Hevy-mcp" 
                  required
                  className="w-full bg-[#0d0d0f] border border-outline-variant/25 rounded-md px-3 py-2 text-xs text-on-surface outline-none focus:border-primary placeholder:text-outline"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono text-outline uppercase tracking-wider mb-1">Environment / Platform</label>
                <select 
                  value={newAgent.platform} 
                  onChange={(e) => setNewAgent({ ...newAgent, platform: e.target.value })}
                  className="w-full bg-[#0d0d0f] border border-outline-variant/25 rounded-md px-3 py-2 text-xs text-on-surface outline-none focus:border-primary"
                >
                  <option value="HuggingFace Space">HuggingFace Space (Remote)</option>
                  <option value="Claude Code">Claude Code (Local)</option>
                  <option value="WSL2">WSL2 CLI</option>
                  <option value="Google Cloud">Google Cloud (Serverless)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-mono text-outline uppercase tracking-wider mb-1">Primary Role *</label>
                <input 
                  type="text" 
                  value={newAgent.role}
                  onChange={(e) => setNewAgent({ ...newAgent, role: e.target.value })}
                  placeholder="e.g. Synergize fitness data to Supabase" 
                  required
                  className="w-full bg-[#0d0d0f] border border-outline-variant/25 rounded-md px-3 py-2 text-xs text-on-surface outline-none focus:border-primary placeholder:text-outline"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono text-outline uppercase tracking-wider mb-1">Inference Model</label>
                <input 
                  type="text" 
                  value={newAgent.model}
                  onChange={(e) => setNewAgent({ ...newAgent, model: e.target.value })}
                  placeholder="e.g. gemini-2.5-flash" 
                  className="w-full bg-[#0d0d0f] border border-outline-variant/25 rounded-md px-3 py-2 text-xs text-on-surface outline-none focus:border-primary placeholder:text-outline"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3.5">
                <button 
                  type="button"
                  onClick={() => setShowDeployModal(false)}
                  className="border border-outline-variant text-[11px] font-medium px-4 py-2 rounded-md hover:bg-neutral-800 text-outline cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="bg-primary hover:bg-primary-dim text-black font-semibold text-[11px] px-5 py-2 rounded-md hover:shadow-lg cursor-pointer transition-colors"
                >
                  Spin Up Deployed Agent
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
