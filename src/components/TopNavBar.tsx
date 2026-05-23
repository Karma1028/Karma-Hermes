import React, { useState, useEffect } from 'react';
import { ShieldCheck, Info, ChevronRight, Compass } from 'lucide-react';

interface TopNavBarProps {
  currentTab: string;
}

export default function TopNavBar({ currentTab }: TopNavBarProps) {
  const [timeStr, setTimeStr] = useState('');
  const [dateStr, setDateStr] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString('en-IN', { hour12: false }) + ' IST');
      setDateStr(now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const tabLabels: Record<string, string> = {
    dashboard: 'Mission Control',
    agents: 'Agents Terminal',
    data: 'Data Hub System',
    memory: 'Memory & Knowledge graph',
    projects: 'Projects & Repositories',
  };

  return (
    <header className="h-16 border-b border-outline-variant/30 px-6 flex items-center justify-between fixed top-0 left-16 md:left-56 right-0 bg-surface/90 backdrop-blur-md z-30 select-none">
      <div className="flex items-center gap-2" id="header-breadcrumbs">
        <Compass className="w-4 h-4 text-primary" />
        <span className="text-[11px] font-mono uppercase tracking-widest text-[#9C9CA5]">KARMA-OS</span>
        <ChevronRight className="w-3 h-3 text-outline" />
        <span className="text-[12px] font-mono text-primary font-medium">{tabLabels[currentTab] || 'Control'}</span>
      </div>

      <div className="flex items-center gap-6" id="header-metrics">
        <div className="flex items-center gap-2 bg-[#121214] px-3 py-1.5 rounded-md border border-outline-variant/25" id="header-status">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-[10px] font-mono text-emerald-400 tracking-wider font-semibold uppercase">Systems Nominal</span>
        </div>

        <div className="flex flex-col items-end" id="header-datetime">
          <span className="font-mono text-sm tracking-tight text-on-surface font-semibold">{timeStr}</span>
          <span className="text-[10px] font-mono text-on-surface-variant uppercase tracking-wider">{dateStr}</span>
        </div>
      </div>
    </header>
  );
}
