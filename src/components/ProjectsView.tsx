import React, { useState } from 'react';
import { FolderGit, Plus, Globe, CheckSquare, Sparkles, RefreshCw, Calendar, GitPullRequest, ArrowUpRight, Github } from 'lucide-react';
import { KarmaState, Project, Repo } from '../types';

interface ProjectsViewProps {
  state: KarmaState;
  onUpdateState: (newState: KarmaState) => void;
}

export default function ProjectsView({ state, onUpdateState }: ProjectsViewProps) {
  const [showAddRepo, setShowAddRepo] = useState(false);
  const [newRepo, setNewRepo] = useState({
    name: '',
    platform: 'GitHub'
  });

  const [showAddProj, setShowAddProj] = useState(false);
  const [newProj, setNewProj] = useState({
    name: '',
    description: '',
    category: 'PERSONAL · T1',
    tagsString: ''
  });

  const handleInscribeRepo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRepo.name.trim()) return;

    try {
      const response = await fetch('/api/v1/repos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRepo)
      });
      if (response.ok) {
        setNewRepo({ name: '', platform: 'GitHub' });
        setShowAddRepo(false);
        // Refresh state
        const stateResp = await fetch('/api/v1/state');
        if (stateResp.ok) {
          onUpdateState(await stateResp.json());
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProj.name.trim()) return;

    const tags = newProj.tagsString.split(',').map(t => t.trim()).filter(Boolean);
    try {
      const response = await fetch('/api/v1/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newProj.name,
          description: newProj.description,
          category: newProj.category,
          tags
        })
      });
      if (response.ok) {
        setNewProj({ name: '', description: '', category: 'PERSONAL · T1', tagsString: '' });
        setShowAddProj(false);
        const stateResp = await fetch('/api/v1/state');
        if (stateResp.ok) {
          onUpdateState(await stateResp.json());
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-7xl mx-auto pb-12" id="projects-view-root">
      
      {/* List of Active portfolios and repositories - 2 Columns */}
      <div className="lg:col-span-2 space-y-6" id="projects-main">
        
        {/* Projects Cards mapping lists */}
        <div className="space-y-4" id="projects-cards-list">
          <div className="flex items-center justify-between">
            <h2 className="text-[11px] font-mono uppercase tracking-widest text-[#9C9CA5] font-semibold flex items-center gap-2">
              <FolderGit className="w-4 h-4 text-primary" />
              WORKSPACE ACTIVE PORTFOLIOS ({state.projects.length})
            </h2>
            <button 
              onClick={() => setShowAddProj(!showAddProj)}
              className="text-[10px] font-mono text-primary hover:text-primary-dim border border-primary/20 hover:border-primary px-3 py-1 rounded-lg bg-slate-950 transition-all cursor-pointer"
              id="btn-toggle-proj-creation"
            >
              {showAddProj ? 'Close Form' : '+ Study/Repo'}
            </button>
          </div>

          {/* Inline Project builder form */}
          {showAddProj && (
            <form onSubmit={handleCreateProject} className="bg-slate-900 border border-primary/20 p-4 rounded-2xl space-y-3 animate-fade-in" id="project-build-form">
              <h3 className="font-headline font-semibold text-xs text-on-surface">Launch Portfolio Project Node</h3>
              
              <div className="space-y-2">
                <input 
                  type="text" 
                  placeholder="Project Title *" required
                  value={newProj.name}
                  onChange={(e) => setNewProj({ ...newProj, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-on-surface outline-none focus:border-primary placeholder:text-slate-500"
                />
                <input 
                  type="text" 
                  placeholder="Category Tag (e.g. RESEARCH · T1)" 
                  value={newProj.category}
                  onChange={(e) => setNewProj({ ...newProj, category: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-on-surface outline-none focus:border-primary placeholder:text-slate-500"
                />
                <input 
                  type="text" 
                  placeholder="Comma separated tags (e.g., ai, deep-dive)" 
                  value={newProj.tagsString}
                  onChange={(e) => setNewProj({ ...newProj, tagsString: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-on-surface outline-none focus:border-primary placeholder:text-slate-500"
                />
                <textarea 
                  placeholder="Briefly summarize core mission / description *" required
                  value={newProj.description}
                  onChange={(e) => setNewProj({ ...newProj, description: e.target.value })}
                  className="w-full h-16 bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-on-surface outline-none focus:border-primary placeholder:text-slate-500 resize-none"
                />
              </div>

              <button type="submit" className="w-full bg-primary hover:bg-primary-dim text-white font-semibold text-xs py-2 rounded-xl transition-all cursor-pointer">
                Scaffold Node Portfolio
              </button>
            </form>
          )}

          {/* Mapping actual projects */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4" id="projects-grid">
            {state.projects.map((proj) => (
              <div key={proj.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 glow-card space-y-4" id={`project-${proj.id}`}>
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[9px] font-mono text-primary font-semibold border border-primary/20 bg-primary/5 px-2 py-0.5 rounded">
                      {proj.category}
                    </span>
                    <h3 className="font-headline font-bold text-sm text-on-surface mt-2">{proj.name}</h3>
                  </div>

                  <span className="text-[10px] font-mono text-outline shrink-0 font-medium bg-slate-950 px-2 py-1 rounded-lg border border-slate-800">
                    📝 {proj.notesCount} notes
                  </span>
                </div>

                <p className="text-[11px] text-on-surface-variant leading-relaxed h-[50px] line-clamp-3 select-text">
                  {proj.description}
                </p>

                {/* Progress metrics bars indicators if defined */}
                {proj.studyProgress !== undefined ? (
                  <div className="space-y-1" id={`progress-${proj.id}`}>
                    <div className="flex justify-between font-mono text-[9px]">
                      <span className="text-outline uppercase">COMPRESSION PROGRESS</span>
                      <span className="text-[#91e3ff] font-bold">{proj.studyProgress}%</span>
                    </div>
                    <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-[#65e1ff] h-full" style={{ width: `${proj.studyProgress}%` }}></div>
                    </div>
                  </div>
                ) : (
                  <div className="h-[25px]" />
                )}

                <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] font-mono text-on-surface-variant">
                  <span>LOG: <b className="text-[#a4ffa8]">{proj.statusLog}</b></span>
                  <div className="flex gap-1">
                    {proj.tags.map(t => (
                      <span key={t} className="text-[8px] border border-slate-800 px-1 rounded bg-slate-950 text-outline">#{t}</span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* GitHub Repositories Linked Segment */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4" id="gh-repos-card">
          <div className="flex items-center justify-between border-b border-slate-800/60 pb-3">
            <div className="flex items-center gap-2">
              <Github className="w-4 h-4 text-[#65e1ff]" />
              <h3 className="font-headline font-bold text-sm text-on-surface">Attached GitHub Repositories</h3>
            </div>

            <button 
              onClick={() => setShowAddRepo(!showAddRepo)}
              className="text-[10px] font-mono text-[#65e1ff] hover:text-[#2dc8ec] border border-[#65e1ff]/20 hover:border-[#65e1ff]/60 bg-slate-950 px-2.5 py-1.5 rounded-lg cursor-pointer transition-colors"
              id="btn-add-repo-trigger"
            >
              {showAddRepo ? 'Close Form' : '+ Bind Repo'}
            </button>
          </div>

          {/* Add Repo slide dynamic form inline */}
          {showAddRepo && (
            <form onSubmit={handleInscribeRepo} className="bg-slate-950 border border-secondary/25 p-3 rounded-2xl space-y-3" id="gh-add-repo-form">
              <div className="text-[9px] font-mono text-secondary uppercase font-bold tracking-wider">Bind New Remote Repository</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <input 
                  type="text" 
                  placeholder="Repo Slug (e.g., Karma1028/vault)" required
                  value={newRepo.name}
                  onChange={(e) => setNewRepo({ ...newRepo, name: e.target.value })}
                  className="bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1 text-xs text-on-surface outline-none focus:border-primary placeholder:text-slate-500"
                />
                <select 
                  value={newRepo.platform}
                  onChange={(e) => setNewRepo({ ...newRepo, platform: e.target.value })}
                  className="bg-slate-900 border border-slate-800 rounded-xl px-2 text-xs text-on-surface outline-none focus:border-primary"
                >
                  <option value="GitHub">GitHub</option>
                  <option value="HuggingFace Space">HuggingFace Space</option>
                  <option value="Gitlab">Gitlab</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button type="submit" className="bg-secondary hover:bg-[#121214] text-white text-[11px] font-bold px-4 py-1.5 rounded-lg border border-secondary/20 transition-all cursor-pointer">
                  REGISTER REMOTE SINK
                </button>
              </div>
            </form>
          )}

          <p className="text-[11px] text-on-surface-variant leading-relaxed">
            Deployment and build hooks checking code integrity on main or developer branches. Auto-rebuild status trackers active.
          </p>

          {/* Repos Cards map lists */}
          <div className="space-y-3 select-text" id="repos-listing">
            {state.repos.map((repo) => (
              <div key={repo.id} className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-[#65e1ff]/40 transition-all" id={`repo-item-${repo.id}`}>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-on-surface font-semibold">{repo.name}</span>
                    <span className="text-[8px] font-mono text-outline uppercase bg-slate-900 px-1.5 border border-slate-800 rounded-sm">
                      {repo.branch}
                    </span>
                  </div>
                  
                  <div className="text-[10px] font-mono text-[#a4ffa8] truncate max-w-lg">
                    {repo.latestCommitMsg}
                  </div>
                </div>

                <div className="shrink-0 flex flex-col items-end text-right font-mono text-[9px]">
                  <span className="font-bold text-[#96e3ff] uppercase tracking-wider">{repo.deployedStatus}</span>
                  <span className="text-outline text-[8px] uppercase mt-0.5">{repo.timeAgo}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Activity Timeline Segment Right Column - 1 Column */}
      <div className="lg:col-span-1 space-y-4" id="projects-sidebar-activity-timeline animate-fade-in text-on-surface">
        <h2 className="text-[11px] font-mono uppercase tracking-widest text-[#9C9CA5] font-semibold flex items-center gap-2">
          <Calendar className="w-4 h-4 text-primary" />
          SYSTEM ACTIVITY TIMELINE
        </h2>

        {/* Timelines feed container list */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 select-text" id="timeline-card">
          <p className="text-[11px] text-on-surface-variant leading-relaxed">
            Historical transaction timeline monitoring data syncs, crons execution, code edits, and training parameters:
          </p>

          <div className="relative border-l border-slate-800 pl-4 ml-2 space-y-5 py-1 text-xs" id="timeline-feeds-items">
            {state.activities.map((act) => (
              <div key={act.id} className="relative space-y-1" id={`activity-item-${act.id}`}>
                {/* Visual marker dot */}
                <div className="absolute -left-[20.5px] top-1 w-2.5 h-2.5 rounded-full border border-primary/40 bg-slate-950 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                </div>

                <div className="flex items-center justify-between text-[10px] font-mono font-bold leading-none">
                  <span className="text-primary uppercase tracking-wider">{act.tag}</span>
                  <span className="text-outline">{act.time} IST</span>
                </div>

                <p className="text-[11px] text-on-surface/90 font-sans leading-normal">
                  {act.details}
                </p>
              </div>
            ))}
          </div>

          <div className="border-t border-outline-variant/10 pt-3 flex items-center justify-between text-[8px] font-mono text-outline uppercase">
            <span>START TRACE WEEK: 14</span>
            <span>SYSTEM: NOMINAL</span>
          </div>
        </div>
      </div>

    </div>
  );
}
