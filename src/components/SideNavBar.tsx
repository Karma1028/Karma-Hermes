import React from 'react';
import { Home, Bot, Database, Brain, FolderGit, Settings, Clock, RefreshCw } from 'lucide-react';

interface SideNavBarProps {
  currentTab: string;
  setTab: (tab: string) => void;
  syncInProgress: boolean;
  onSync: () => void;
}

export default function SideNavBar({ currentTab, setTab, syncInProgress, onSync }: SideNavBarProps) {
  const navItems = [
    { id: 'dashboard', label: 'Mission Control', icon: Home },
    { id: 'agents', label: 'Agents Log', icon: Bot },
    { id: 'data', label: 'Data Hub', icon: Database },
    { id: 'memory', label: 'Memory & Knowledge', icon: Brain },
    { id: 'projects', label: 'Projects & Repos', icon: FolderGit },
  ];

  return (
    <aside className="w-16 md:w-56 bg-surface-container-lowest border-r border-outline-variant/30 flex flex-col py-6 items-center fixed left-0 top-0 h-full z-40">
      <div className="mb-8 flex flex-col items-center select-none" id="sidebar-logo">
        <span className="font-headline text-2xl font-bold tracking-tighter text-primary">K</span>
        <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1 shadow-[0_0_8px_#bd9dff] animate-pulse"></div>
      </div>

      <nav className="flex flex-col gap-1 flex-grow w-full px-2" id="sidebar-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              id={`nav-btn-${item.id}`}
              onClick={() => setTab(item.id)}
              className={`w-full flex items-center gap-3 px-2 py-2.5 rounded-lg transition-all duration-200 relative group cursor-pointer ${
                isActive
                  ? 'text-primary bg-primary/10 border-l-2 border-primary shadow-[inset_0_0_8px_rgba(99,102,241,0.05)]'
                  : 'text-on-surface-variant hover:text-primary hover:bg-surface-container-high border-l-2 border-transparent'
              }`}
              title={item.label}
            >
              <Icon className={`w-5 h-5 shrink-0 transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-105'}`} />
              <span className={`hidden md:block text-[11px] font-mono font-semibold uppercase tracking-wider truncate transition-opacity duration-200 ${isActive ? 'opacity-100' : 'opacity-70 group-hover:opacity-100'}`}>
                {item.label}
              </span>
              {/* Mobile tooltip only */}
              <span className="md:hidden absolute left-full ml-3 bg-surface-container-highest border border-outline-variant text-[10px] text-on-surface font-mono px-2.5 py-1 rounded shadow-md opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>

      <div className="mt-auto flex flex-col gap-4 items-center w-full pb-4" id="sidebar-footer">
        <button
          onClick={onSync}
          disabled={syncInProgress}
          className={`w-10 h-10 flex items-center justify-center rounded-lg border border-outline-variant hover:border-primary text-secondary-dim hover:text-primary transition-all duration-300 cursor-pointer ${
            syncInProgress ? 'animate-spin' : ''
          }`}
          title="Force Sync / All Systems Diagnosis"
          id="btn-sync-trigger"
        >
          <RefreshCw className="w-4 h-4" />
        </button>

        <div className="relative group cursor-pointer" id="sidebar-avatar">
          <div className="w-10 h-10 rounded-full border border-primary/20 overflow-hidden hover:border-primary transition-all duration-300">
            <img
              alt="System Admin"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBycdE-6I4RPqEwE9gnfp5fk_hEEZL7aDatUDXIX0pF-34_R6_KOvKF6AAm3teqNDSYQIlTVQ9ZCkOiTpCv87yvmC0Yglu1epZphah4xPXZ3su0RdN-1bsz-wcMdUa8p_kGGq7hT1j9wN8c1uKY2-w6rnlBxstJfV1dj7nS0uzvcgOry_lIjdc99furNCtqTcX8PyiXBN9j4vlbLn_LLZ08A8W8DlIlcTrIt0XEAK1IOCGuFSMxajxiOX9XFb5wWnQG68Azel_Y8KP9"
              className="w-full h-full object-cover"
            />
          </div>
          <span className="md:hidden absolute left-full ml-3 bottom-2 bg-surface-container-highest border border-outline-variant text-[10px] text-on-surface font-mono px-2.5 py-1 rounded shadow-md opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
            operator@karma-os
          </span>
        </div>
      </div>
    </aside>
  );
}
