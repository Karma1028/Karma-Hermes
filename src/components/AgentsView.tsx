import React, { useState } from 'react';
import { Bot, RefreshCw, Layers, Shield, Terminal, Settings, Play, Send, LayoutList, Heart, Star, Cloud } from 'lucide-react';
import { KarmaState, Agent } from '../types';

interface AgentsViewProps {
  state: KarmaState;
  onUpdateState: (newState: KarmaState) => void;
  onDeployAgent: (agentData: Partial<Agent>) => void;
}

export default function AgentsView({ state, onUpdateState, onDeployAgent }: AgentsViewProps) {
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(state.agents[0] || null);
  const [showForm, setShowForm] = useState(false);
  const [customMsg, setCustomMsg] = useState('');
  const [newAgent, setNewAgent] = useState({
    name: '',
    platform: 'HuggingFace Space',
    role: '',
    model: 'groq/llama-3.3-70b-versatile',
    endpoint: '',
    cpu: 25,
    memoryTotal: 16
  });

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

  const handleCreateAgent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAgent.name) return;
    onDeployAgent(newAgent);
    setNewAgent({
      name: '',
      platform: 'HuggingFace Space',
      role: '',
      model: 'groq/llama-3.3-70b-versatile',
      endpoint: '',
      cpu: 10,
      memoryTotal: 8
    });
    setShowForm(false);
  };

  // Terminate an agent
  const handleTerminateAgent = async (agentId: string) => {
    try {
      const resp = await fetch(`/api/v1/agents/${agentId}/terminate`, {
        method: 'POST',
      });
      if (resp.ok) {
        const stateResp = await fetch('/api/v1/state');
        if (stateResp.ok) {
          const fresh = await stateResp.json();
          onUpdateState(fresh);
          const currentInList = fresh.agents.find((a: Agent) => a.id === agentId);
          if (currentInList) {
            setSelectedAgent(currentInList);
          }
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const submitSimulatedCommand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customMsg.trim() || !selectedAgent) return;

    // Simulate pushing an interactive event to state
    const simulatedEvent = {
      id: `ev-${Date.now()}`,
      time: new Date().toLocaleTimeString('en-GB', { hour12: false }),
      agent: `[${selectedAgent.name}]`,
      text: customMsg
    };

    const nextEvents = [...state.events, simulatedEvent];
    onUpdateState({
      ...state,
      events: nextEvents
    });
    setCustomMsg('');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-7xl mx-auto pb-12" id="agents-view-container">
      
      {/* List of Agents Sidebar - 1 Column */}
      <div className="lg:col-span-1 space-y-4" id="agents-list-pane">
        <div className="flex items-center justify-between">
          <h2 className="text-[11px] font-mono uppercase tracking-widest text-[#9C9CA5] font-semibold flex items-center gap-2">
            <Bot className="w-4 h-4 text-primary" />
            DEPLOYMENT TREE
          </h2>
          <button 
            onClick={() => setShowForm(!showForm)}
            className="text-[10px] font-mono text-primary hover:text-primary-dim border border-primary/20 hover:border-primary px-2.5 py-1 rounded-lg bg-slate-950 transition-all cursor-pointer"
            id="btn-toggle-new-agent-form"
          >
            {showForm ? 'Cancel Dev' : '+ Spin Node'}
          </button>
        </div>

        {/* Deploy New Agent Form Block inline */}
        {showForm && (
          <form onSubmit={handleCreateAgent} className="bg-slate-900 border border-primary/20 p-4 rounded-2xl space-y-3 animate-fade-in" id="inline-agent-form">
            <h3 className="font-headline font-semibold text-xs text-on-surface">Spin Up Local or Cloud Host</h3>
            
            <div className="space-y-2">
              <input 
                type="text" 
                placeholder="Agent Name (e.g., fitness-bot)" required
                value={newAgent.name}
                onChange={(e) => setNewAgent({ ...newAgent, name: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-on-surface outline-none focus:border-primary placeholder:text-slate-500"
              />
              <input 
                type="text" 
                placeholder="Platform / Context (e.g. Supabase)" 
                value={newAgent.platform}
                onChange={(e) => setNewAgent({ ...newAgent, platform: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-on-surface outline-none focus:border-primary placeholder:text-slate-500"
              />
              <input 
                type="text" 
                placeholder="Model Context (e.g. llama-3)" 
                value={newAgent.model}
                onChange={(e) => setNewAgent({ ...newAgent, model: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-on-surface outline-none focus:border-primary placeholder:text-slate-500"
              />
              <textarea 
                placeholder="Primary directive description" required
                value={newAgent.role}
                onChange={(e) => setNewAgent({ ...newAgent, role: e.target.value })}
                className="w-full h-16 bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-on-surface outline-none focus:border-primary placeholder:text-slate-500 resize-none"
              />
            </div>

            <button type="submit" className="w-full bg-primary hover:bg-primary-dim text-white font-semibold text-xs py-2 rounded-xl transition-all cursor-pointer">
              Spin Up
            </button>
          </form>
        )}

        {/* Cards mapping list */}
        <div className="space-y-3" id="agents-sidebar-cards">
          {state.agents.map((agent) => {
            const isSel = selectedAgent?.id === agent.id;
            return (
              <div 
                key={agent.id}
                onClick={() => setSelectedAgent(agent)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                  isSel 
                    ? 'bg-gradient-to-r from-slate-900 to-slate-950/80 border-primary/50 shadow-[0_0_15px_rgba(189,157,255,0.06)]' 
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                }`}
                id={`sidebar-agent-${agent.id}`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full border border-primary/20 overflow-hidden bg-slate-950">
                    <img src={getAgentAvatar(agent.name)} alt={agent.name} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h3 className="font-headline font-semibold text-xs text-on-surface">{agent.name}</h3>
                    <p className="text-[9px] font-mono text-on-surface-variant leading-none mt-0.5">{agent.category}</p>
                  </div>
                </div>

                <div className="flex flex-col items-end">
                  <span className={`text-[8px] font-mono font-bold px-1 py-0.2 rounded border ${
                    agent.status === 'ONLINE' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/10' :
                    agent.status === 'ACTIVE' ? 'text-cyan-400 bg-cyan-500/10 border-cyan-500/10' :
                    'text-amber-400 bg-amber-500/10 border-amber-500/10'
                  }`}>
                    {agent.status}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Panel Detail Terminal & Inspector - 2 Columns */}
      <div className="lg:col-span-2 space-y-5" id="agent-detail-terminal">
        {selectedAgent ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-5" id="agent-inspect-card">
            
            {/* Upper Info Head banner */}
            <div className="pb-4 border-b border-slate-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full border border-primary/40 overflow-hidden shadow-lg bg-slate-950">
                  <img src={getAgentAvatar(selectedAgent.name)} alt={selectedAgent.name} className="w-full h-full object-cover" />
                </div>
                <div>
                  <h2 className="font-headline font-bold text-md text-on-surface">{selectedAgent.name} Status Protocol</h2>
                  <p className="text-[10px] font-mono text-[#91e3ff]">{selectedAgent.endpoint}</p>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <button 
                  onClick={() => handleTerminateAgent(selectedAgent.id)}
                  disabled={selectedAgent.status === 'IDLE'}
                  className="text-[10px] font-mono border border-red-500/20 hover:border-red-500/60 text-red-400 hover:bg-red-500/5 px-2.5 py-1.5 rounded-xl transition-colors disabled:opacity-40 cursor-pointer"
                  id={`btn-terminate-${selectedAgent.id}`}
                >
                  TERMINATE INSTANCE
                </button>
                <span className="text-[10px] font-mono bg-primary/10 border border-primary/20 text-primary px-3 py-1.5 rounded-xl font-semibold uppercase">
                  Model: {selectedAgent.model}
                </span>
              </div>
            </div>

            {/* Middle Grid metrics stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3" id="agent-deep-metrics grid">
              <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl">
                <div className="text-[8px] font-mono text-outline uppercase tracking-wider">Node CPU state</div>
                <div className="text-sm font-mono font-bold text-primary mt-1">{selectedAgent.cpu}%</div>
                <div className="w-full bg-neutral-800 h-1 mt-1.5 rounded-full overflow-hidden">
                  <div className="bg-primary h-full" style={{ width: `${selectedAgent.cpu}%` }}></div>
                </div>
              </div>

              <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl">
                <div className="text-[8px] font-mono text-outline uppercase tracking-wider">RAM Allocation</div>
                <div className="text-sm font-mono font-bold text-[#65e1ff] mt-1">{selectedAgent.memoryUsed}G / {selectedAgent.memoryTotal}G</div>
                <div className="w-full bg-neutral-800 h-1 mt-1.5 rounded-full overflow-hidden">
                  <div className="bg-[#65e1ff] h-full" style={{ width: `${(selectedAgent.memoryUsed / selectedAgent.memoryTotal) * 100}%` }}></div>
                </div>
              </div>

              <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl">
                <div className="text-[8px] font-mono text-outline uppercase tracking-wider">Context Window</div>
                <div className="text-sm font-mono font-bold text-on-surface mt-1">{selectedAgent.context}</div>
                <div className="text-[8px] font-mono text-outline mt-0.5">buffer loaded</div>
              </div>

              <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl">
                <div className="text-[8px] font-mono text-outline uppercase tracking-wider">Platform Host</div>
                <div className="text-xs font-mono font-bold text-tertiary mt-1.5 truncate">{selectedAgent.platform}</div>
                <div className="text-[8px] font-mono text-outline mt-0.5">ESTABLISHED</div>
              </div>
            </div>

            {/* Directive description content */}
            <div className="space-y-1.5 bg-slate-950 p-3.5 rounded-xl border border-slate-800" id="agent-directives">
              <div className="text-[9px] font-mono text-[#9C9CA5] uppercase font-bold tracking-wider">AGENT PRIMARY DIRECTIVE</div>
              <p className="text-xs text-on-surface/90 leading-relaxed font-sans">{selectedAgent.role}</p>
            </div>

            {/* Live Interactive Channel Terminal for this Agent */}
            <div className="space-y-2.5 pt-2" id="agent-command-shell">
              <div className="flex items-center justify-between">
                <div className="text-[10px] font-mono text-on-surface-variant font-semibold flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-primary" />
                  INTER-AGENT LOG STREAM
                </div>
                <div className="text-[9px] font-mono text-emerald-400">CONNECT TYPE: WEBHOOK RETRY OK</div>
              </div>

              {/* Logs terminal */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 h-[170px] overflow-y-auto font-mono text-[10px] space-y-1 scrollbar-thin select-text" id="agent-sandbox-logs">
                <div className="text-outline">--- INITIALIZING INTER-AGENT TRACE CHANNEL FOR {selectedAgent.name || 'AGENT'} ---</div>
                {state.events
                  .filter(evt => evt.agent.toLowerCase().includes(selectedAgent.name.toLowerCase()) || evt.agent.toLowerCase().includes('system'))
                  .map((evt) => (
                    <div key={evt.id} className="flex gap-2">
                      <span className="text-outline">[{evt.time}]</span>
                      <span className="text-secondary">{evt.agent}</span>
                      <span className="text-on-surface">{evt.text}</span>
                    </div>
                  ))}
              </div>

              {/* Console message simulator form */}
              <form onSubmit={submitSimulatedCommand} className="flex gap-2" id="client-simulated-terminal-form">
                <div className="flex-grow flex items-center bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1">
                  <span className="text-primary font-mono text-xs mr-1">$</span>
                  <input 
                    type="text" 
                    placeholder={`Simulate action report (e.g., Parsing research logs completed)`}
                    value={customMsg}
                    onChange={(e) => setCustomMsg(e.target.value)}
                    className="w-full bg-transparent border-none outline-none font-mono text-[10px] py-1.5 text-on-surface placeholder:text-slate-500"
                    id="simulated-input text"
                  />
                </div>
                <button 
                  type="submit"
                  className="bg-slate-950 text-primary hover:text-white hover:bg-slate-900 text-[10px] font-mono border border-slate-800 hover:border-slate-700 px-4 py-2 rounded-xl transition-all cursor-pointer"
                  id="btn-trigger-action-reported"
                >
                  PUSH REPORT
                </button>
              </form>
            </div>

          </div>
        ) : (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-outline" id="no-agent-selected">
            No agent cluster selected. Devise some above.
          </div>
        )}
      </div>

    </div>
  );
}
