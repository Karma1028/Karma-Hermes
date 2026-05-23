import React, { useState } from 'react';
import { Brain, Search, Filter, Plus, Network, CheckSquare, Sparkles, AlertCircle, RefreshCw, Layers, ShieldCheck } from 'lucide-react';
import { KarmaState, MemoryNode } from '../types';

interface MemoryViewProps {
  state: KarmaState;
  onUpdateState: (newState: KarmaState) => void;
}

export default function MemoryView({ state, onUpdateState }: MemoryViewProps) {
  const [searchMemory, setSearchMemory] = useState('');
  const [privacyFilter, setPrivacyFilter] = useState('all');
  
  // Compiler animation simulation state
  const [compilerStatus, setCompilerStatus] = useState<'idle' | 'compiling' | 'complete'>('idle');
  const [compilerProgress, setCompilerProgress] = useState(0);
  const [compilerLog, setCompilerLog] = useState('');

  // Add memory form state
  const [showAddMem, setShowAddMem] = useState(false);
  const [newMem, setNewMem] = useState({
    title: '',
    privacy: 'T1' as MemoryNode['privacy'],
    category: 'gemini-cli',
    tagsString: ''
  });

  const handleInscribeMemory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMem.title.trim()) return;

    const tags = newMem.tagsString.split(',').map(t => t.trim()).filter(Boolean);
    try {
      const response = await fetch('/api/v1/memories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newMem.title,
          privacy: newMem.privacy,
          category: newMem.category,
          tags
        }),
      });
      if (response.ok) {
        setNewMem({ title: '', privacy: 'T1', category: 'gemini-cli', tagsString: '' });
        setShowAddMem(false);
        // Refresh
        const stateResp = await fetch('/api/v1/state');
        if (stateResp.ok) {
          onUpdateState(await stateResp.json());
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCompileWiki = () => {
    if (compilerStatus === 'compiling') return;
    
    setCompilerStatus('compiling');
    setCompilerProgress(0);
    setCompilerLog('Initializing Knowledge compiler CLI on local node...');

    // Simulate progressive compiles
    const phases = [
      { prg: 20, log: 'Parsing local Obsidian memory vault directories...' },
      { prg: 45, log: 'Synthesizing Hot Memories with active Gemini nodes...' },
      { prg: 65, log: 'Resolving entity links and clustering semantic nodes...' },
      { prg: 85, log: 'Rendering static compilation HTML Wiki index dossier...' },
      { prg: 100, log: 'Compilation SUCCESS: Written wiki to local static host.' }
    ];

    phases.forEach((phase, index) => {
      setTimeout(() => {
        setCompilerProgress(phase.prg);
        setCompilerLog(phase.log);
        
        if (phase.prg === 100) {
          // Finish compilation
          setTimeout(async () => {
            setCompilerStatus('complete');
            try {
              // Trigger a state stats sync or reward XP in background
              const response = await fetch('/api/v1/crons/sync', { method: 'POST' });
              if (response.ok) {
                onUpdateState(await response.json());
              }
            } catch (err) {
              console.error(err);
            }
          }, 800);
        }
      }, (index + 1) * 900);
    });
  };

  const filteredMemories = state.memories.filter(m => {
    const matchesQuery = m.title.toLowerCase().includes(searchMemory.toLowerCase()) || 
                         m.tags.some(t => t.toLowerCase().includes(searchMemory.toLowerCase()));
    const matchesPrivacy = privacyFilter === 'all' || m.privacy === privacyFilter;
    return matchesQuery && matchesPrivacy;
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-7xl mx-auto pb-12" id="memory-view-root">
      
      {/* Visual Knowledge Graph Report Card - 2 Columns */}
      <div className="lg:col-span-2 space-y-6" id="memory-graph-pane">
        
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4" id="knowledge-graph-card">
          <div className="flex items-center justify-between border-b border-slate-800/60 pb-4">
            <div className="flex items-center gap-2">
              <Network className="w-4 h-4 text-primary" />
              <h3 className="font-headline font-bold text-sm text-on-surface">Vault Entity Neural Graph</h3>
            </div>
            <div className="text-[10px] font-mono text-outline">AUTO GRID SPARTAN REFRESH OUTLINE</div>
          </div>

          <p className="text-[11px] text-on-surface-variant leading-relaxed">
            Relational indexing map generated on local Obsidian notes. Interactive preview nodes are compiled from active markdown documents.
          </p>

          {/* Graph visual image preview */}
          <div className="relative border border-slate-800 rounded-xl overflow-hidden aspect-video bg-slate-950 flex items-center justify-center group" id="graph-canvas-frame">
            <img 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCCGDw7hD5IYr05ssPJrMTnsy_6Z2F5T67VVpOicPB4CtVXZ8XeIgZxkYKh4jmXj6oh52sGdxBhNr4LBXUW1hUIUZe5xc4lxB9IkKKr_Qw7B9C3GNOkJ0auGbfjbb4fpkCMEjfu1dd0wJJbLW8ZgFgs2ffBC6BNUxlwxIxp8dXI_zrUGitNOcWjL5mSaVXxIyuli2n9lGh1NjQ8WKAmnbYhyLMJ-EORGNmmYJFkYv3H8dgyEPGK2_HIPmudV8dJsDm_KcIOd553Y3Vy" 
              alt="Neural Knowledge Graph Preview" 
              className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-700 ease-out"
            />
            {/* Overlay statistics bento bars */}
            <div className="absolute top-4 left-4 bg-slate-950/90 border border-slate-800 p-3 rounded-xl flex flex-col gap-1 z-10" id="graph-mini-specs">
              <div className="text-[9px] font-mono text-outline">NODES INDEXED</div>
              <div className="text-sm font-mono font-bold text-primary">241 ENTITIES</div>
              <div className="text-[8px] font-mono text-emerald-400 mt-1 font-semibold flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping shrink-0" />
                Live indexing hook connected
              </div>
            </div>

            <div className="absolute bottom-4 right-4 bg-slate-950/95 border border-slate-800 px-3.5 py-1.5 rounded-lg text-[10px] font-mono text-primary group-hover:bg-primary group-hover:text-black transition-all cursor-pointer select-none">
              LAUNCH GRAPH NAVIGATOR ↗
            </div>
          </div>

          {/* Stats quick overview */}
          <div className="grid grid-cols-3 gap-2 text-center" id="graph-aggregate-stats">
            <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl">
              <div className="text-[9px] font-mono text-outline uppercase">Semantic nodes</div>
              <div className="font-mono text-sm font-bold text-on-surface mt-0.5">241</div>
            </div>
            <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl">
              <div className="text-[9px] font-mono text-outline uppercase">Dynamic links</div>
              <div className="font-mono text-sm font-bold text-[#65e1ff] mt-0.5">1,294</div>
            </div>
            <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl">
              <div className="text-[9px] font-mono text-outline uppercase">Communities</div>
              <div className="font-mono text-sm font-bold text-purple-400 mt-0.5">14 Clusters</div>
            </div>
          </div>
        </div>

        {/* Wiki Compiler Systems Panel */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3.5" id="wiki-compiler-card">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-headline font-bold text-on-surface uppercase tracking-wide flex items-center gap-2">
              <Brain className="w-4 h-4 text-secondary-dim" />
              Wiki Compiler System Node
            </h3>
            <span className="text-[8px] font-mono bg-secondary-dim/15 text-secondary border border-secondary/20 px-1.5 py-0.2 rounded font-semibold uppercase">T3 OFFLINE-SAFE</span>
          </div>

          <p className="text-[11px] text-on-surface-variant leading-relaxed">
            Convert ephemeral hot memories into a static knowledge base wiki formatted directly for Obsidian publishing. Re-runs require fresh compiler links.
          </p>

          {compilerStatus === 'compiling' ? (
            <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-3 animate-pulse" id="compiler-assembling-hud">
              <div className="flex justify-between items-center text-[10px] font-mono">
                <span className="text-primary font-bold">WIKI COMPILER CLI ACTIVE</span>
                <span className="text-on-surface font-semibold">{compilerProgress}% completed</span>
              </div>
              <div className="w-full bg-neutral-800 h-2 rounded-full overflow-hidden">
                <div className="bg-primary h-full transition-all duration-300" style={{ width: `${compilerProgress}%` }}></div>
              </div>
              <div className="text-[9px] font-mono text-[#a5ffd2] select-text">
                {'>'} {compilerLog}
              </div>
            </div>
          ) : compilerStatus === 'complete' ? (
            <div className="bg-emerald-500/5 border border-emerald-500/20 p-4 rounded-xl space-y-2 text-center" id="compiler-done-hud">
              <div className="flex items-center justify-center gap-1.5 text-xs text-emerald-400 font-bold">
                <ShieldCheck className="w-4 h-4 text-emerald-400 animate-bounce" />
                Compilation Completed Successfully!
              </div>
              <p className="text-[10px] text-on-surface-variant">
                Obsidian wiki updated (+40 XP gained). Local files synced onto cloud spaces properly.
              </p>
              <button 
                onClick={() => setCompilerStatus('idle')}
                className="text-[9px] font-mono text-[#91e3ff] hover:text-primary transition-all cursor-pointer font-bold duration-300 underline"
              >
                COMPILE AGAIN SIMULATOR
              </button>
            </div>
          ) : (
            <div className="p-1" id="compiler-trigger-block">
              <button 
                onClick={handleCompileWiki}
                className="w-full bg-slate-950 hover:bg-slate-900 text-secondary hover:text-white font-semibold text-xs py-3.5 rounded-xl border border-slate-800 hover:border-slate-700 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm font-mono uppercase"
                id="btn-run-wiki-compiler"
              >
                <RefreshCw className="w-4 h-4 text-primary animate-spin-slow group-hover:text-black" />
                RUN KNOWLEDGE WIKI BINDERS
              </button>
            </div>
          )}
        </div>

      </div>

      {/* Sync Hot Memory Indexer Ledger - 1 Column */}
      <div className="lg:col-span-1 space-y-4" id="memory-ledger-pane shadow-sm">
        
        <div className="flex items-center justify-between">
          <h2 className="text-[11px] font-mono uppercase tracking-widest text-[#9C9CA5] font-semibold flex items-center gap-2">
            <Plus className="w-4 h-4 text-primary" />
            HOT VAULT FEED ({filteredMemories.length})
          </h2>
          <button 
            onClick={() => setShowAddMem(!showAddMem)}
            className="text-[10px] font-mono text-primary hover:text-primary-dim border border-primary/20 hover:border-primary px-2.5 py-1 rounded-lg bg-slate-950 transition-all cursor-pointer"
            id="btn-toggle-add-mem-form"
          >
            {showAddMem ? 'Cancel Inscribe' : '+ Memory'}
          </button>
        </div>

        {/* Add Memory Form modal drawer inline */}
        {showAddMem && (
          <form onSubmit={handleInscribeMemory} className="bg-slate-900 border border-primary/20 p-4 rounded-2xl space-y-3 animate-fade-in" id="add-memory-form">
            <h3 className="font-headline font-semibold text-xs text-on-surface">Inscribe Obsidian Node</h3>
            
            <div className="space-y-2">
              <input 
                type="text" 
                placeholder="Memory core thesis / summary *" required
                value={newMem.title}
                onChange={(e) => setNewMem({ ...newMem, title: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-on-surface outline-none focus:border-primary placeholder:text-slate-500"
              />
              <input 
                type="text" 
                placeholder="Comma separated tags (e.g., benchmark, rslm)" 
                value={newMem.tagsString}
                onChange={(e) => setNewMem({ ...newMem, tagsString: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-on-surface outline-none focus:border-primary placeholder:text-slate-500"
              />
              <div className="grid grid-cols-2 gap-2">
                <select 
                  value={newMem.privacy} 
                  onChange={(e) => setNewMem({ ...newMem, privacy: e.target.value as MemoryNode['privacy'] })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2 py-1.5 text-xs text-on-surface outline-none focus:border-primary"
                >
                  <option value="T1">Tier 1 Cloud</option>
                  <option value="T2">Tier 2 Groq</option>
                  <option value="T3">Tier 3 Local</option>
                </select>

                <select 
                  value={newMem.category} 
                  onChange={(e) => setNewMem({ ...newMem, category: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2 py-1.5 text-xs text-on-surface outline-none focus:border-primary"
                >
                  <option value="hermes">Hermes Agent</option>
                  <option value="antigravity">Antigravity</option>
                  <option value="gemini-cli">Gemini CLI</option>
                  <option value="hevy-mcp">Hevy MCP</option>
                </select>
              </div>
            </div>

            <button type="submit" className="w-full bg-primary hover:bg-primary-dim text-white font-semibold text-xs py-2 rounded-xl transition-all cursor-pointer">
              Inscribe Memory Node
            </button>
          </form>
        )}

        {/* Filter / Search bars */}
        <div className="bg-slate-900 p-3 rounded-2xl border border-slate-800 flex flex-col gap-2.5" id="mem-filters">
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl px-2 py-1.5 gap-2 w-full">
            <Search className="w-3.5 h-3.5 text-outline" />
            <input 
              type="text" 
              placeholder="Search vault memories..." 
              value={searchMemory}
              onChange={(e) => setSearchMemory(e.target.value)}
              className="bg-transparent border-none outline-none font-mono text-[11px] text-on-surface placeholder:text-slate-500 w-full"
            />
          </div>

          <div className="flex items-center justify-between text-[10px] font-mono">
            <span className="text-outline">PRIVACY FILTER LEVEL:</span>
            <select 
              value={privacyFilter}
              onChange={(e) => setPrivacyFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-[10px] px-2 py-0.5 rounded outline-none focus:border-primary text-on-surface"
            >
              <option value="all">ALL TIERS</option>
              <option value="T1">T1 CLOUD SYSTEM</option>
              <option value="T2">T2 GROQ NETWORK</option>
              <option value="T3">T3 LOCAL OFFLINE</option>
            </select>
          </div>
        </div>

        {/* Memories feeds mapping */}
        <div className="space-y-3 select-text max-h-[360px] overflow-y-auto pr-1" id="memories-feed">
          {filteredMemories.map((mem) => (
            <div key={mem.id} className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-2.5 hover:border-slate-700 transition-all shadow-sm" id={`memory-item-${mem.id}`}>
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-mono text-outline shrink-0 uppercase tracking-widest bg-slate-950 border border-slate-800 px-1.5 py-0.5 rounded-sm text-left">
                  @{mem.category}
                </span>

                <span className={`text-[8px] font-mono font-bold px-1.5 rounded-sm border leading-none ${
                  mem.privacy === 'T1' ? 'text-primary bg-primary/10 border-primary/20' :
                  mem.privacy === 'T2' ? 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20' :
                  'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                }`}>
                  {mem.privacy}
                </span>
              </div>

              <p className="text-xs text-on-surface leading-snug font-sans font-medium">{mem.title}</p>

              <div className="flex flex-wrap gap-1" id="memory-tags-row">
                {mem.tags.map(t => (
                  <span key={t} className="text-[8px] font-mono bg-slate-950 border border-slate-800 px-1.5 py-0.5 rounded-sm text-outline">
                    #{t}
                  </span>
                ))}
              </div>

              <div className="text-right text-[8px] font-mono text-outline uppercase">{mem.timeAgo}</div>
            </div>
          ))}
        </div>

      </div>

    </div>
  );
}
