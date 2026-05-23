import React, { useState } from 'react';
import { Database, Search, Filter, Plus, Trash2, Edit, CheckSquare, RefreshCw, Calendar, Sparkles, MessageSquare, Landmark } from 'lucide-react';
import { KarmaState, Task } from '../types';
import GoogleWorkspaceView from './GoogleWorkspaceView';

interface DataHubViewProps {
  state: KarmaState;
  onUpdateState: (newState: KarmaState) => void;
  googleUser: any;
  googleToken: string | null;
  googleTasks: any[];
  googleCalendarEvents: any[];
  googleDriveFiles: any[];
  googleSyncing: string | null;
  loadingGoogleAuth: boolean;
  onGoogleSignIn: () => Promise<void>;
  onGoogleSignOut: () => Promise<void>;
  onReloadGoogle: (token: string) => Promise<void>;
}

type SubTab = 'tasks' | 'xp' | 'expenses' | 'tokens' | 'logs' | 'workspace';

export default function DataHubView({
  state,
  onUpdateState,
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
}: DataHubViewProps) {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('tasks');
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [contextFilter, setContextFilter] = useState<string>('all');
  
  // Create / Edit task form
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    priority: 'medium' as Task['priority'],
    context: 'general'
  });

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.title.trim()) return;

    try {
      const response = await fetch('/api/v1/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTask),
      });
      if (response.ok) {
        setNewTask({ title: '', priority: 'medium', context: 'general' });
        setShowAddForm(false);
        // Refresh state
        const refreshed = await fetch('/api/v1/state');
        if (refreshed.ok) {
          onUpdateState(await refreshed.json());
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      const response = await fetch(`/api/v1/tasks/${taskId}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        const refreshed = await fetch('/api/v1/state');
        if (refreshed.ok) {
          onUpdateState(await refreshed.json());
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateStatus = async (taskId: string, currentStatus: Task['status']) => {
    const nextStatusMap: Record<Task['status'], Task['status']> = {
      'pending': 'in_progress',
      'in_progress': 'done',
      'done': 'pending'
    };
    const nextStatus = nextStatusMap[currentStatus];
    try {
      const response = await fetch(`/api/v1/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (response.ok) {
        const refreshed = await fetch('/api/v1/state');
        if (refreshed.ok) {
          onUpdateState(await refreshed.json());
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Get list of unique contexts
  const uniqueContexts = Array.from(new Set(state.tasks.map(t => t.context)));

  // Filter tasks
  const filteredTasks = state.tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          task.context.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
    const matchesContext = contextFilter === 'all' || task.context === contextFilter;
    return matchesSearch && matchesPriority && matchesContext;
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 max-w-7xl mx-auto pb-12" id="data-hub-root">
      
      {/* Dynamic Tab Panel Select on the left (1 Column) */}
      <div className="lg:col-span-1 space-y-3.5" id="data-hub-sidebar">
        <h2 className="text-[11px] font-mono uppercase tracking-widest text-[#9C9CA5] font-semibold flex items-center gap-2">
          <Database className="w-4 h-4 text-primary" />
          Workspace Repos
        </h2>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-2.5 flex flex-col gap-1" id="subtabs-group">
          <button 
            type="button" 
            onClick={() => setActiveSubTab('tasks')}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-mono flex items-center justify-between transition-all cursor-pointer ${
              activeSubTab === 'tasks' ? 'text-primary bg-primary/10 border-l border-primary font-bold shadow-sm' : 'text-on-surface-variant hover:text-primary hover:bg-slate-950/60'
            }`}
            id="subtab-tasks"
          >
            📂 active_tasks.bin
            <span className="text-[9px] font-mono bg-slate-950 text-outline px-1.5 py-0.5 border border-slate-800 rounded-sm">{state.tasks.length}</span>
          </button>

          <button 
            type="button"
            onClick={() => setActiveSubTab('xp')}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-mono flex items-center justify-between transition-all cursor-pointer ${
              activeSubTab === 'xp' ? 'text-primary bg-primary/10 border-l border-primary font-bold shadow-sm' : 'text-on-surface-variant hover:text-primary hover:bg-slate-950/60'
            }`}
            id="subtab-xp"
          >
            📊 xp_aggregator.log
            <span className="text-[9px] font-mono bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 border border-emerald-500/10 rounded-sm">+{state.stats.xpEarnedToday}XP</span>
          </button>

          <button 
            type="button"
            onClick={() => setActiveSubTab('expenses')}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-mono flex items-center justify-between transition-all cursor-pointer ${
              activeSubTab === 'expenses' ? 'text-primary bg-primary/10 border-l border-primary font-bold shadow-sm' : 'text-on-surface-variant hover:text-primary hover:bg-slate-950/60'
            }`}
            id="subtab-expenses"
          >
            💸 credit_ledger.csv
            <span className="text-[9px] font-mono bg-rose-500/10 text-rose-400 px-1.5 py-0.5 border border-rose-500/10 rounded-sm">$184.40 Limit</span>
          </button>

          <button 
            type="button"
            onClick={() => setActiveSubTab('tokens')}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-mono flex items-center justify-between transition-all cursor-pointer ${
              activeSubTab === 'tokens' ? 'text-primary bg-primary/10 border-l border-primary font-bold shadow-sm' : 'text-on-surface-variant hover:text-primary hover:bg-slate-950/60'
            }`}
            id="subtab-tokens"
          >
            ⚡ token_usage.json
            <span className="text-[9px] font-mono bg-cyan-500/10 text-cyan-400 px-1.5 py-0.5 border border-cyan-500/10 rounded-sm">{(state.stats.tokensUsed / 1000).toFixed(1)}K</span>
          </button>

          <button 
            type="button"
            onClick={() => setActiveSubTab('logs')}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-mono flex items-center justify-between transition-all cursor-pointer ${
              activeSubTab === 'logs' ? 'text-primary bg-primary/10 border-l border-primary font-bold shadow-sm' : 'text-on-surface-variant hover:text-primary hover:bg-slate-950/60'
            }`}
            id="subtab-logs"
          >
            📜 daily_system.log
            <span className="text-[9px] font-mono bg-purple-500/10 text-purple-400 px-1.5 py-0.5 border border-purple-500/10 rounded-sm">LIVE</span>
          </button>

          <button 
            type="button"
            onClick={() => setActiveSubTab('workspace')}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-mono flex items-center justify-between transition-all cursor-pointer ${
              activeSubTab === 'workspace' ? 'text-primary bg-primary/10 border-l border-primary font-bold shadow-sm' : 'text-on-surface-variant hover:text-primary hover:bg-slate-950/60'
            }`}
            id="subtab-workspace"
          >
            🔌 google_sync.bin
            <span className="text-[9px] font-mono bg-indigo-500/10 text-indigo-400 px-1.5 py-0.5 border border-indigo-500/10 rounded-sm">GOOGLE</span>
          </button>
        </div>

        {/* Sync panel indicator */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl text-center space-y-2 select-none" id="sidebar-db-indicator">
          <div className="text-[10px] font-mono text-outline uppercase">Database Sink link</div>
          <div className="flex items-center justify-center gap-1.5 text-xs text-primary font-bold mt-1">
            <Database className="w-4 h-4 text-primary animate-pulse" />
            Supabase PostgREST Sync
          </div>
          <p className="text-[10px] text-on-surface-variant leading-relaxed">
            All operations apply immediately to in-memory tables.
          </p>
        </div>
      </div>

      {/* Main Table Viewer & CRUD Workspace (3 Columns) */}
      <div className="lg:col-span-3 space-y-4" id="data-hub-main">
        
        {/* TAB 1: Tasks Viewer */}
        {activeSubTab === 'tasks' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4" id="tasks-table-pane">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/60 pb-4">
              <div>
                <h3 className="font-headline font-bold text-sm text-on-surface">Active Workflow Tasks Tasklist</h3>
                <p className="text-[11px] text-on-surface-variant">Live interaction with database tables. Double-clack checkboxes to cycle status parameters.</p>
              </div>

              <button 
                onClick={() => setShowAddForm(!showAddForm)}
                className="bg-primary hover:bg-primary-dim text-white text-xs font-semibold px-4 py-2.5 rounded-xl inline-flex items-center gap-1.5 hover:shadow-lg cursor-pointer transition-colors"
                id="btn-add-task-trigger"
              >
                <Plus className="w-4 h-4" />
                Inscribe Task
              </button>
            </div>

            {/* Inline task builder form */}
            {showAddForm && (
              <form onSubmit={handleCreateTask} className="bg-slate-950 p-4 rounded-2xl border border-primary/20 space-y-3" id="task-creation-form">
                <div className="text-[10px] font-mono text-primary uppercase font-bold tracking-wider">Inscribe New Task Node</div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <input 
                    type="text" 
                    placeholder="Task summary/title *" required
                    value={newTask.title}
                    onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                    className="md:col-span-1.5 bg-slate-900 border border-slate-800 text-xs px-3 py-2 rounded-xl font-sans text-on-surface outline-none focus:border-primary placeholder:text-slate-500"
                  />
                  <select 
                    value={newTask.priority}
                    onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as Task['priority'] })}
                    className="bg-slate-900 border border-slate-800 text-xs px-3 py-2 rounded-xl text-on-surface outline-none focus:border-primary"
                  >
                    <option value="low">Low Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="high">High Priority</option>
                    <option value="urgent">Urgent</option>
                  </select>
                  <input 
                    type="text" 
                    placeholder="Context (e.g. rslm)" 
                    value={newTask.context}
                    onChange={(e) => setNewTask({ ...newTask, context: e.target.value })}
                    className="bg-slate-900 border border-slate-800 text-xs px-3 py-2 rounded-xl text-on-surface outline-none focus:border-primary placeholder:text-slate-500"
                  />
                </div>
                <div className="flex justify-end gap-3 pt-1">
                  <button 
                    type="button" 
                    onClick={() => setShowAddForm(false)}
                    className="px-3 py-1.5 text-xs text-outline border border-slate-800 rounded-xl hover:bg-slate-900 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="px-4 py-1.5 text-xs text-white font-semibold bg-primary rounded-xl hover:bg-primary-dim cursor-pointer"
                  >
                    Inscribe
                  </button>
                </div>
              </form>
            )}

            {/* Filters dashboard */}
            <div className="flex flex-col md:flex-row gap-3 items-center bg-slate-950 p-3 rounded-2xl border border-slate-800" id="task-table-filters-panel">
              <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 w-full md:w-auto flex-grow gap-2">
                <Search className="w-3.5 h-3.5 text-outline" />
                <input 
                  type="text" 
                  placeholder="Filter by title/contexts..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent border-none outline-none font-mono text-[11px] text-on-surface placeholder:text-slate-500 w-full"
                />
              </div>

              <div className="flex items-center gap-2.5 w-full md:w-auto" id="filters-select-row">
                <select 
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1 text-[11px] font-mono text-on-surface outline-none focus:border-primary"
                >
                  <option value="all">ALL PRIORITIES</option>
                  <option value="low">LOW</option>
                  <option value="medium">MEDIUM</option>
                  <option value="high">HIGH</option>
                  <option value="urgent">URGENT</option>
                </select>

                <select 
                  value={contextFilter}
                  onChange={(e) => setContextFilter(e.target.value)}
                  className="bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1 text-[11px] font-mono text-on-surface outline-none focus:border-primary"
                >
                  <option value="all">ALL CONTEXTS</option>
                  {uniqueContexts.map(ctx => (
                    <option key={ctx} value={ctx}>@{ctx.toUpperCase()}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Recs Grid/Table */}
            <div className="overflow-x-auto" id="tasks-table-wrapper">
              <table className="w-full text-left font-sans text-xs border-collapse">
                <thead>
                  <tr className="border-b border-outline-variant/15 text-outline font-mono uppercase text-[9px]">
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Title Description</th>
                    <th className="py-2.5 px-3">Context</th>
                    <th className="py-2.5 px-3">Priority</th>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3 text-right">Delete</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTasks.length > 0 ? (
                    filteredTasks.map((task) => {
                      const isDone = task.status === 'done';
                      const isProgress = task.status === 'in_progress';
                      return (
                        <tr 
                          key={task.id} 
                          className={`border-b border-outline-variant/10 hover:bg-black/20 ${isDone ? 'opacity-65' : ''}`}
                          id={`table-row-${task.id}`}
                        >
                          <td className="py-3 px-3">
                            <button 
                              onClick={() => handleUpdateStatus(task.id, task.status)}
                              className="focus:outline-none cursor-pointer inline-flex items-center"
                              title="Toggle status cycle"
                            >
                              <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded border ${
                                isDone ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' :
                                isProgress ? 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20' :
                                'text-purple-400 bg-purple-500/10 border-purple-500/20'
                              }`}>
                                {task.status.toUpperCase()}
                              </span>
                            </button>
                          </td>
                          <td className="py-3 px-3 font-medium text-on-surface">
                            <span className={isDone ? 'line-through text-outline' : ''}>
                              {task.title}
                            </span>
                          </td>
                          <td className="py-3 px-3 font-mono text-on-surface-variant text-[10px]">
                            @{task.context}
                          </td>
                          <td className="py-3 px-3">
                            <span className={`text-[9px] font-mono uppercase px-1.5 py-0.2.5 rounded ${
                              task.priority === 'urgent' ? 'text-red-400 border border-red-500/15 bg-red-500/5' :
                              task.priority === 'high' ? 'text-amber-400 border border-amber-500/15 bg-amber-500/5' :
                              'text-outline border border-[#232326] bg-black/40'
                            }`}>
                              {task.priority}
                            </span>
                          </td>
                          <td className="py-3 px-3 font-mono text-outline text-[10px]">
                            {task.created}
                          </td>
                          <td className="py-3 px-3 text-right">
                            <button 
                              onClick={() => handleDeleteTask(task.id)}
                              className="text-on-surface-variant hover:text-red-400 transition-colors p-1 cursor-pointer"
                              title="Evict Node"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} className="text-center p-8 text-outline">
                        No corresponding nodes located inside tasks database.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <p className="text-[10px] text-on-surface-variant font-mono text-center">
              * Click status badge elements to transition states systematically: <b>PENDING ➔ IN_PROGRESS ➔ DONE</b>
            </p>
          </div>
        )}

        {/* TAB 2: XP Aggregator Logs */}
        {activeSubTab === 'xp' && (
          <div className="bg-surface-container-low border border-outline-variant/20 rounded-xl p-5 space-y-4" id="xp-ledger-pane">
            <div>
              <h3 className="font-headline font-bold text-sm text-on-surface">Experience progression ledger</h3>
              <p className="text-[11px] text-on-surface-variant">Cognitve and technical progression transactions mapped live from Obsidian notes & cron heartbeats.</p>
            </div>

            <div className="space-y-2" id="xp-list-items">
              <div className="p-3 bg-black/45 border border-outline-variant/15 rounded-lg flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  <div>
                    <div className="text-xs text-on-surface font-semibold">Refactor CLI Parser node complete</div>
                    <div className="text-[9px] font-mono text-outline">08:52 · Context: @rslm</div>
                  </div>
                </div>
                <div className="text-[#a4ffd1] font-mono text-xs font-bold">+20 XP (Technical)</div>
              </div>

              <div className="p-3 bg-black/45 border border-outline-variant/15 rounded-lg flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  <div>
                    <div className="text-xs text-on-surface font-semibold">Update Neural weights config checklist</div>
                    <div className="text-[9px] font-mono text-outline">08:14 · Context: @hevy-mcp</div>
                  </div>
                </div>
                <div className="text-[#a4ffd1] font-mono text-xs font-bold">+20 XP (Technical)</div>
              </div>

              <div className="p-3 bg-black/45 border border-outline-variant/15 rounded-lg flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                  <div>
                    <div className="text-xs text-on-surface font-semibold">arxiv_daily diagnostic complete scan</div>
                    <div className="text-[9px] font-mono text-outline">07:00 · Context: @network</div>
                  </div>
                </div>
                <div className="text-[#98e3ff] font-mono text-xs font-bold">+40 XP (Cognitive)</div>
              </div>

              <div className="p-3 bg-black/45 border border-outline-variant/15 rounded-lg flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#bd9dff]"></span>
                  <div>
                    <div className="text-xs text-on-surface font-semibold">RSLM paper synthesis review</div>
                    <div className="text-[9px] font-mono text-outline">Yesterday · Context: @rslm</div>
                  </div>
                </div>
                <div className="text-[#d7bdff] font-mono text-xs font-bold">+80 XP (Cognitive)</div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: Credit Expense Ledger */}
        {activeSubTab === 'expenses' && (
          <div className="bg-surface-container-low border border-outline-variant/20 rounded-xl p-5 space-y-4" id="ledger-pane">
            <div className="flex items-center justify-between border-b border-outline-variant/15 pb-4">
              <div>
                <h3 className="font-headline font-bold text-sm text-on-surface">Inference credit ledger</h3>
                <p className="text-[11px] text-on-surface-variant">Estimated financial or API credit limits tracking models run live.</p>
              </div>
              <Landmark className="w-5 h-5 text-rose-300" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3" id="expenses-stats">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <div className="text-[9px] font-mono text-outline uppercase">MONTHLY TOTAL LIMIT</div>
                <div className="text-md font-mono font-bold text-on-surface mt-1">$1.48 / $10.00</div>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <div className="text-[9px] font-mono text-outline uppercase">DAILY SPENT LIMIT</div>
                <div className="text-md font-mono font-bold text-rose-400 mt-1">$0.18</div>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <div className="text-[9px] font-mono text-outline uppercase">ESTIMATED COMPUTE SPEED</div>
                <div className="text-md font-mono font-bold text-[#65e1ff] mt-1">2,810 toks/sec</div>
              </div>
            </div>

            <div className="space-y-1.5 pt-1 text-[11px] font-mono" id="expenses-bill">
              <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800/60 flex justify-between">
                <span className="text-on-surface">groq - llama-3.3-70b-versatile query call (10K tokens)</span>
                <span className="text-outline">$0.007</span>
              </div>
              <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800/60 flex justify-between">
                <span className="text-on-surface">gemini-2.5-pro context analysis (58K tokens)</span>
                <span className="text-outline">$0.042</span>
              </div>
              <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800/60 flex justify-between">
                <span className="text-on-surface">Claude Code sonnet development sessions</span>
                <span className="text-outline">$0.131</span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: Token Usage */}
        {activeSubTab === 'tokens' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4" id="tokens-pane">
            <div>
              <h3 className="font-headline font-bold text-sm text-on-surface">Context buffer allocations</h3>
              <p className="text-[11px] text-on-surface-variant">Tracking token compression bounds to avoid LLM context spill or high pricing tiers.</p>
            </div>

            <div className="space-y-4" id="tokens-deep-list">
              <div>
                <div className="flex justify-between font-mono text-[10px] mb-1">
                  <span className="text-outline">Hermes model (llama-3.3-70b)</span>
                  <span className="text-on-surface font-semibold">12,400 / 128,000 tokens</span>
                </div>
                <div className="bg-neutral-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-primary h-full" style={{ width: '9.6%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between font-mono text-[10px] mb-1">
                  <span className="text-outline">Antigravity sonnet active file contextual cache</span>
                  <span className="text-on-surface font-semibold">41,200 / 200,000 tokens</span>
                </div>
                <div className="bg-neutral-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-[#65e1ff] h-full" style={{ width: '20.6%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between font-mono text-[10px] mb-1">
                  <span className="text-outline">Gemini CLI large context research buffer</span>
                  <span className="text-on-surface font-semibold">142,000 / 1,000,000 tokens</span>
                </div>
                <div className="bg-neutral-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-emerald-400 h-full" style={{ width: '14.2%' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: Live system logs */}
        {activeSubTab === 'logs' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3" id="system-logs-pane">
            <div className="flex items-center justify-between border-b border-slate-800/60 pb-3">
              <div>
                <h3 className="font-headline font-bold text-sm text-on-surface">Operating system debug traces</h3>
                <p className="text-[11px] text-on-surface-variant">Live telemetry events harvested from cron scripts and websocket endpoints.</p>
              </div>
              <span className="p-1 px-2 text-[9px] font-mono rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">RETRIEVAL OK</span>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 h-[240px] overflow-y-auto font-mono text-[10px] space-y-1 scrollbar-thin select-text">
              {state.events.map((evt) => (
                <div key={evt.id} className="flex gap-2">
                  <span className="text-outline">[{evt.time}]</span>
                  <span className="text-primary">{evt.agent}</span>
                  <span className="text-on-surface leading-normal">{evt.text}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 6: Google Workspace Sync Manager */}
        {activeSubTab === 'workspace' && (
          <GoogleWorkspaceView 
            state={state} 
            onUpdateState={onUpdateState}
            googleUser={googleUser}
            googleToken={googleToken}
            googleTasks={googleTasks}
            googleCalendarEvents={googleCalendarEvents}
            googleDriveFiles={googleDriveFiles}
            googleSyncing={googleSyncing}
            loadingGoogleAuth={loadingGoogleAuth}
            onGoogleSignIn={onGoogleSignIn}
            onGoogleSignOut={onGoogleSignOut}
            onReloadGoogle={onReloadGoogle}
          />
        )}

      </div>

    </div>
  );
}
