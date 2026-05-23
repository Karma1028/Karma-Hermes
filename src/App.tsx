import React, { useState, useEffect } from 'react';
import SideNavBar from './components/SideNavBar';
import TopNavBar from './components/TopNavBar';
import DashboardView from './components/DashboardView';
import AgentsView from './components/AgentsView';
import DataHubView from './components/DataHubView';
import MemoryView from './components/MemoryView';
import ProjectsView from './components/ProjectsView';
import { KarmaState, Agent } from './types';
import { 
  initAuth, 
  googleSignIn, 
  logout, 
  fetchGoogleTasks, 
  fetchGoogleEvents, 
  fetchGoogleDriveFiles, 
  GoogleTask, 
  GoogleCalendarEvent, 
  GoogleDriveFile 
} from './lib/googleAuth';

export default function App() {
  const [currentTab, setTab] = useState<string>('dashboard');
  const [loading, setLoading] = useState<boolean>(true);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);
  
  const [state, setState] = useState<KarmaState | null>(null);
  const [syncInProgress, setSyncInProgress] = useState<boolean>(false);

  // Central Google Workspace State Hub
  const [googleUser, setGoogleUser] = useState<any>(null);
  const [googleToken, setGoogleToken] = useState<string | null>(null);
  const [loadingGoogleAuth, setLoadingGoogleAuth] = useState(true);
  const [googleTasks, setGoogleTasks] = useState<GoogleTask[]>([]);
  const [googleCalendarEvents, setGoogleCalendarEvents] = useState<GoogleCalendarEvent[]>([]);
  const [googleDriveFiles, setGoogleDriveFiles] = useState<GoogleDriveFile[]>([]);
  const [googleSyncing, setGoogleSyncing] = useState<string | null>(null);

  const loadGoogleData = async (userToken: string) => {
    setGoogleSyncing('Retrieving Workspace Data...');
    try {
      const [gTasks, gEvents, gFiles] = await Promise.all([
        fetchGoogleTasks(userToken).catch(() => []),
        fetchGoogleEvents(userToken).catch(() => []),
        fetchGoogleDriveFiles(userToken).catch(() => [])
      ]);
      setGoogleTasks(gTasks);
      setGoogleCalendarEvents(gEvents);
      setGoogleDriveFiles(gFiles);
    } catch (err) {
      console.error("Error loading Google Data centrally:", err);
    } finally {
      setGoogleSyncing(null);
    }
  };

  useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser, currentToken) => {
        setGoogleUser(currentUser);
        setGoogleToken(currentToken);
        setLoadingGoogleAuth(false);
        loadGoogleData(currentToken);
      },
      () => {
        setGoogleUser(null);
        setGoogleToken(null);
        setGoogleTasks([]);
        setGoogleCalendarEvents([]);
        setGoogleDriveFiles([]);
        setLoadingGoogleAuth(false);
      }
    );
    return () => unsubscribe();
  }, []);

  const handleGoogleSignIn = async () => {
    setLoadingGoogleAuth(true);
    try {
      const result = await googleSignIn();
      if (result) {
        setGoogleUser(result.user);
        setGoogleToken(result.accessToken);
        await loadGoogleData(result.accessToken);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingGoogleAuth(false);
    }
  };

  const handleGoogleSignOut = async () => {
    setGoogleToken(null);
    setGoogleUser(null);
    setGoogleTasks([]);
    setGoogleCalendarEvents([]);
    setGoogleDriveFiles([]);
    await logout();
  };

  // Poll full operating system state from pluggable REST endpoints
  const fetchState = async (showLoadingIndicator = false) => {
    if (showLoadingIndicator) setLoading(true);
    try {
      const response = await fetch('/api/v1/state');
      if (response.ok) {
        const data = await response.json();
        setState(data);
        setErrorStatus(null);
      } else {
        setErrorStatus('Failed to compile state telemetry from REST endpoints.');
      }
    } catch (err) {
      console.error("Error connecting to full-stack backend:", err);
      setErrorStatus('Backend offline or context connection timeout.');
    } finally {
      if (showLoadingIndicator) setLoading(false);
    }
  };

  useEffect(() => {
    fetchState(true);

    // Dynamic state polling loop every 5 seconds to support real-time pluggability
    const timer = setInterval(() => {
      fetchState(false);
    }, 5000);

    return () => clearInterval(timer);
  }, []);

  const handleSyncCrons = async () => {
    setSyncInProgress(true);
    try {
      const response = await fetch('/api/v1/crons/sync', {
        method: 'POST'
      });
      if (response.ok) {
        const resData = await response.json();
        if (resData.success) {
          // Re-fetch state immediately so user sees restored OK heartbeats!
          await fetchState(false);
        }
      }
    } catch (err) {
      console.error("Failed to execute sync signal:", err);
    } finally {
      // Small visual pause to make it feel premium & dynamic
      setTimeout(() => {
        setSyncInProgress(false);
      }, 600);
    }
  };

  const handleDeployAgent = async (agentData: Partial<Agent>) => {
    try {
      const response = await fetch('/api/v1/agents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(agentData)
      });
      if (response.ok) {
        // Fetch new state showing recently birthed node
        await fetchState(false);
      }
    } catch (err) {
      console.error("Failed to post newly drafted agent node:", err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-solid-surface flex items-center justify-center font-mono text-outline select-none gap-2 flex-col" id="app-loading-hud">
        <div className="w-8 h-8 rounded-full border border-primary/40 border-t-transparent animate-spin"></div>
        <div className="text-[11px] uppercase tracking-widest text-[#a396b2] mt-2">Loading KARMA-OS Telemetry...</div>
      </div>
    );
  }

  if (errorStatus || !state) {
    return (
      <div className="min-h-screen bg-solid-surface flex items-center justify-center font-mono p-6" id="app-error-hud">
        <div className="max-w-md bg-[#131215] border border-rose-500/30 p-6 rounded-xl space-y-4 shadow-lg text-center">
          <div className="text-rose-400 font-bold text-sm uppercase">⚠️ REST CONNECTION FAULT</div>
          <p className="text-xs text-on-surface-variant leading-relaxed">
            {errorStatus || 'The dashboard was unable to contact the full-stack system backend. Ensure server.ts is launched.'}
          </p>
          <button 
            onClick={() => fetchState(true)}
            className="bg-[#1b1b20] hover:bg-neutral-800 border border-outline-variant/30 text-primary px-4 py-2 rounded text-xs transition-colors cursor-pointer"
          >
            REFRESH LINK
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-on-background relative" id="app-root">
      
      {/* Side bar navigation drawer element */}
      <SideNavBar 
        currentTab={currentTab} 
        setTab={setTab} 
        syncInProgress={syncInProgress}
        onSync={handleSyncCrons}
      />

      {/* Top dashboard stats/status header element */}
      <TopNavBar currentTab={currentTab} />

      {/* Main scrolling viewport */}
      <main className="pl-16 md:pl-56 pt-20 px-4 md:px-8 select-none" id="app-main-viewport">
        
        {currentTab === 'dashboard' && (
          <DashboardView 
            state={state} 
            onUpdateState={setState} 
            onSyncCrons={handleSyncCrons}
            syncInProgress={syncInProgress}
            onDeployAgent={handleDeployAgent}
            googleUser={googleUser}
            googleToken={googleToken}
            googleTasks={googleTasks}
            googleCalendarEvents={googleCalendarEvents}
            googleDriveFiles={googleDriveFiles}
            googleSyncing={googleSyncing}
            loadingGoogleAuth={loadingGoogleAuth}
            onGoogleSignIn={handleGoogleSignIn}
            onGoogleSignOut={handleGoogleSignOut}
            onReloadGoogle={loadGoogleData}
          />
        )}

        {currentTab === 'agents' && (
          <AgentsView 
            state={state} 
            onUpdateState={setState} 
            onDeployAgent={handleDeployAgent}
          />
        )}

        {currentTab === 'data' && (
          <DataHubView 
            state={state} 
            onUpdateState={setState}
            googleUser={googleUser}
            googleToken={googleToken}
            googleTasks={googleTasks}
            googleCalendarEvents={googleCalendarEvents}
            googleDriveFiles={googleDriveFiles}
            googleSyncing={googleSyncing}
            loadingGoogleAuth={loadingGoogleAuth}
            onGoogleSignIn={handleGoogleSignIn}
            onGoogleSignOut={handleGoogleSignOut}
            onReloadGoogle={loadGoogleData}
          />
        )}

        {currentTab === 'memory' && (
          <MemoryView 
            state={state} 
            onUpdateState={setState}
          />
        )}

        {currentTab === 'projects' && (
          <ProjectsView 
            state={state} 
            onUpdateState={setState}
          />
        )}

      </main>

    </div>
  );
}
