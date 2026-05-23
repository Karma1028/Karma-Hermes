import React, { useState, useEffect } from 'react';
import { 
  fetchGoogleTasks, 
  createGoogleTask, 
  updateGoogleTaskStatus, 
  fetchGoogleEvents, 
  createGoogleCalendarEvent, 
  fetchGoogleDriveFiles, 
  googleSignIn, 
  logout, 
  initAuth, 
  GoogleTask, 
  GoogleCalendarEvent, 
  GoogleDriveFile 
} from '../lib/googleAuth';
import { 
  Calendar, 
  CheckSquare, 
  HardDrive, 
  Plus, 
  RefreshCw, 
  LogOut, 
  FileText, 
  ExternalLink, 
  Database, 
  AlertTriangle,
  FileCode2,
  Lock,
  Loader2,
  TrendingUp,
  Activity,
  Sparkles,
  LayoutDashboard,
  Clock,
  Check,
  Info
} from 'lucide-react';
import { KarmaState } from '../types';
import firebaseConfig from '../../firebase-applet-config.json';

interface GoogleWorkspaceViewProps {
  state: KarmaState;
  onUpdateState: (newState: KarmaState) => void;
  googleUser: any;
  googleToken: string | null;
  googleTasks: GoogleTask[];
  googleCalendarEvents: GoogleCalendarEvent[];
  googleDriveFiles: GoogleDriveFile[];
  googleSyncing: string | null;
  loadingGoogleAuth: boolean;
  onGoogleSignIn: () => Promise<void>;
  onGoogleSignOut: () => Promise<void>;
  onReloadGoogle: (token: string) => Promise<void>;
}

type WorkspaceTab = 'dashboard' | 'tasks' | 'calendar' | 'drive_picker';

export default function GoogleWorkspaceView({
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
}: GoogleWorkspaceViewProps) {
  const user = googleUser;
  const token = googleToken;
  const loadingAuth = loadingGoogleAuth;

  const [localSyncing, setSyncing] = useState<string | null>(null);
  const syncing = googleSyncing || localSyncing;

  // Sync props down into backward compatible local states
  const [tasks, setTasks] = useState<GoogleTask[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<GoogleCalendarEvent[]>([]);
  const [driveFiles, setDriveFiles] = useState<GoogleDriveFile[]>([]);
  const [pickerSelectedFile, setPickerSelectedFile] = useState<any>(null);

  useEffect(() => {
    setTasks(googleTasks);
  }, [googleTasks]);

  useEffect(() => {
    setCalendarEvents(googleCalendarEvents);
  }, [googleCalendarEvents]);

  useEffect(() => {
    setDriveFiles(googleDriveFiles);
  }, [googleDriveFiles]);

  // Tab State
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('dashboard');

  // Forms state
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskNotes, setNewTaskNotes] = useState('');

  const [showEventForm, setShowEventForm] = useState(false);
  const [newEvent, setNewEvent] = useState({
    summary: '',
    description: '',
    startStr: '',
    endStr: ''
  });

  // Action Confirmation state (Force-Mandate user safety validation)
  const [confirmationDialog, setConfirmationDialog] = useState<{
    show: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  // Load Google Picker dynamic script
  const [pickerApiLoaded, setPickerApiLoaded] = useState(false);

  useEffect(() => {
    // Dynamic loader for Google Picker GAPI Library
    const script = document.createElement('script');
    script.src = 'https://apis.google.com/js/api.js';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      (window as any).gapi?.load('picker', {
        callback: () => {
          setPickerApiLoaded(true);
        }
      });
    };
    document.body.appendChild(script);
  }, []);

  const loadAllData = async (userToken: string) => {
    await onReloadGoogle(userToken);
  };

  const handleSignIn = async () => {
    await onGoogleSignIn();
  };

  const handleSignOut = async () => {
    const nextConfirm = {
      show: true,
      title: 'De-authorize Google Access',
      message: 'Are you sure you want to disconnect Google Workspace? This will clear all local cached sessions.',
      onConfirm: async () => {
        await onGoogleSignOut();
        setPickerSelectedFile(null);
        setConfirmationDialog(null);
      }
    };
    setConfirmationDialog(nextConfirm);
  };

  // 1. Google Tasks Operations
  const handleCreateGoogleTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !newTaskTitle.trim()) return;

    const nextConfirm = {
      show: true,
      title: 'Inscribe New Google Task',
      message: `You are about to insert task "${newTaskTitle}" directly into your primary Google Tasklist. Proceed?`,
      onConfirm: async () => {
        try {
          setSyncing('Creating Task...');
          const resp = await createGoogleTask(token, newTaskTitle, newTaskNotes);
          setTasks(prev => [...prev, resp]);
          setNewTaskTitle('');
          setNewTaskNotes('');
          setShowTaskForm(false);
        } catch (err) {
          console.error(err);
        } finally {
          setSyncing(null);
          setConfirmationDialog(null);
        }
      }
    };
    setConfirmationDialog(nextConfirm);
  };

  const handleToggleGoogleTaskStatus = async (task: GoogleTask) => {
    if (!token) return;
    const nextStatus = task.status === 'completed' ? 'needsAction' : 'completed';

    const nextConfirm = {
      show: true,
      title: 'Cycle Task Status Parameters',
      message: `Change task "${task.title}" status parameter from ${task.status} to ${nextStatus}? This updates your cloud Google account.`,
      onConfirm: async () => {
        try {
          setSyncing('Updating Task State...');
          const updated = await updateGoogleTaskStatus(token, task.id, nextStatus);
          setTasks(prev => prev.map(t => t.id === task.id ? updated : t));
        } catch (err) {
          console.error(err);
        } finally {
          setSyncing(null);
          setConfirmationDialog(null);
        }
      }
    };
    setConfirmationDialog(nextConfirm);
  };

  // Sync selected Google Tasks directly to local app's workspace DB!
  const syncGoogleTaskToBackend = async (task: GoogleTask) => {
    try {
      setSyncing('Injecting Task into KARMA-OS...');
      const response = await fetch('/api/v1/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `[G-Tasks] ${task.title}`,
          priority: 'medium',
          context: 'workspace'
        }),
      });
      if (response.ok) {
        const refreshed = await fetch('/api/v1/state');
        if (refreshed.ok) {
          onUpdateState(await refreshed.json());
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSyncing(null);
    }
  };

  // 2. Google Calendar Event Operations
  const handleCreateCalendarEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !newEvent.summary.trim() || !newEvent.startStr || !newEvent.endStr) return;

    const nextConfirm = {
      show: true,
      title: 'Inscribe Calendar Event',
      message: `Are you sure you want to add event "${newEvent.summary}" scheduled for ${newEvent.startStr} to your primary Google Calendar?`,
      onConfirm: async () => {
        try {
          setSyncing('Creating Calendar Event...');
          const resp = await createGoogleCalendarEvent(token, newEvent);
          setCalendarEvents(prev => [resp, ...prev]);
          setNewEvent({ summary: '', description: '', startStr: '', endStr: '' });
          setShowEventForm(false);
        } catch (err: any) {
          console.error(err);
          alert(err.message || 'Failed to create calendar event.');
        } finally {
          setSyncing(null);
          setConfirmationDialog(null);
        }
      }
    };
    setConfirmationDialog(nextConfirm);
  };

  // Sync calendar events metadata into raw system logs memory tree
  const captureEventAsMemory = async (evt: GoogleCalendarEvent) => {
    try {
      setSyncing('Inscribing Obsidian Memory...');
      const response = await fetch('/api/v1/memories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `[G-Event] ${evt.summary} scheduled on ${evt.start.dateTime || evt.start.date}`,
          privacy: 'T1',
          category: 'hermes',
          tags: ['calendar', 'meeting']
        }),
      });
      if (response.ok) {
        const refreshed = await fetch('/api/v1/state');
        if (refreshed.ok) {
          onUpdateState(await refreshed.json());
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSyncing(null);
    }
  };

  // 3. Google Picker Native Modal Launcher
  const handleLaunchPicker = () => {
    if (!token) return;
    if (!pickerApiLoaded) {
      alert('Google API script is currently compiling. Tap again in 2 seconds.');
      return;
    }

    try {
      const picker = new (window as any).google.picker.PickerBuilder()
        .addView((window as any).google.picker.ViewId.DOCS)
        .setOAuthToken(token)
        .setDeveloperKey(firebaseConfig.apiKey)
        .setCallback((data: any) => {
          if (data.action === (window as any).google.picker.Action.PICKED) {
            const file = data.docs[0];
            setPickerSelectedFile(file);
          }
        })
        .build();
      picker.setVisible(true);
    } catch (err) {
      console.error("Google Picker initialization failure:", err);
      alert("Error initiating Google Picker: " + err);
    }
  };

  // Push Picker Selected file as interactive Obsidian context memory node
  const handleSyncSelectedFileToMemory = async () => {
    if (!pickerSelectedFile) return;

    try {
      setSyncing('Preserving File Reference...');
      const resp = await fetch('/api/v1/memories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `[G-Picker Document] Selected: ${pickerSelectedFile.name} (File ID: ${pickerSelectedFile.id})`,
          privacy: 'T1',
          category: 'antigravity',
          tags: ['picker', 'drive', 'mcp']
        })
      });

      if (resp.ok) {
        const refreshed = await fetch('/api/v1/state');
        if (refreshed.ok) {
          onUpdateState(await refreshed.json());
        }
        setPickerSelectedFile(null); // Clear selected state
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSyncing(null);
    }
  };

  // INSIGHTS & STATS COMPILATION FOR DASHBOARD
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const pendingTasks = tasks.filter(t => t.status !== 'completed').length;
  const totalTasks = tasks.length;
  const tasksPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  
  // Calculate day frequency distributions for Google Events across standard weekdays (Mon-Sun)
  const getWeekdayEventDistribution = () => {
    const counts = [0, 0, 0, 0, 0, 0, 0]; // Mon, Tue, Wed, Thu, Fri, Sat, Sun
    calendarEvents.forEach(evt => {
      const dateStr = evt.start.dateTime || evt.start.date;
      if (dateStr) {
        const d = new Date(dateStr);
        let dayIndex = d.getDay(); // 0 is Sunday, 1 is Monday ...
        // Shift map so Mon is index 0, Sun is index 6
        dayIndex = dayIndex === 0 ? 6 : dayIndex - 1;
        if (dayIndex >= 0 && dayIndex < 7) {
          counts[dayIndex]++;
        }
      }
    });
    return counts;
  };

  const weekdayDistribution = getWeekdayEventDistribution();
  const maxEventsVal = Math.max(...weekdayDistribution, 1);
  const weekdayLabels = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

  // Map MIME files categories
  const getMimeTypeAnalysis = () => {
    let driveCount = 0;
    let spreadsheetCount = 0;
    let documentCount = 0;
    let presentationCount = 0;
    let otherCount = 0;

    driveFiles.forEach(file => {
      const mime = file.mimeType.toLowerCase();
      if (mime.includes('spreadsheet') || mime.includes('sheet')) spreadsheetCount++;
      else if (mime.includes('document') || mime.includes('text') || mime.includes('word')) documentCount++;
      else if (mime.includes('presentation') || mime.includes('slide')) presentationCount++;
      else otherCount++;
      driveCount++;
    });

    return { driveCount, spreadsheetCount, documentCount, presentationCount, otherCount };
  };

  const fileAnalysis = getMimeTypeAnalysis();

  // Calculated Unified Workspace Health Rating (0 to 100)
  const computeHealthRating = () => {
    if (!user) return 0;
    const taskScore = totalTasks > 0 ? (completedTasks / totalTasks) * 40 : 20;
    const calScore = Math.min(40, calendarEvents.length * 4);
    const driveScore = Math.min(20, driveFiles.length * 2);
    return Math.round(taskScore + calScore + driveScore);
  };

  const healthScore = computeHealthRating();

  return (
    <div className="space-y-6" id="g-workspace-orchestrator">
      {/* Dynamic Sync state loader overlay */}
      {syncing && (
        <div className="fixed inset-0 bg-slate-950/70 flex items-center justify-center z-50 animate-fade-in" id="workspace-sync-overlay">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col items-center gap-3 shadow-2xl max-w-xs text-center">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <div className="text-[11px] font-mono text-primary font-bold uppercase tracking-widest">{syncing}</div>
          </div>
        </div>
      )}

      {/* Action confirmation dialog */}
      {confirmationDialog && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 animate-fade-in" id="confirm-safety-modal">
          <div className="bg-slate-900 border-2 border-primary/20 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center gap-2 text-primary">
              <AlertTriangle className="w-5 h-5 text-primary" />
              <h4 className="font-headline font-bold text-sm text-on-surface">{confirmationDialog.title}</h4>
            </div>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              {confirmationDialog.message}
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmationDialog(null)}
                className="bg-transparent border border-slate-800 text-outline hover:text-white px-3.5 py-1.5 rounded-xl text-[11px] font-mono uppercase transition-all cursor-pointer"
              >
                Decline / Cancel
              </button>
              <button
                type="button"
                onClick={confirmationDialog.onConfirm}
                className="bg-primary text-black hover:bg-primary-dim px-4 py-1.5 rounded-xl text-[11px] font-bold font-mono uppercase transition-all cursor-pointer"
              >
                Acknowledge / Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 1. Header Authentication status card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4" id="g-workspace-auth-card">
        <div className="space-y-1">
          <h3 className="font-headline font-bold text-sm text-on-surface flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary animate-pulse" />
            Universal Google Workspace Sync
          </h3>
          <p className="text-[11px] text-on-surface-variant leading-relaxed">
            Synchronize, list, and map Google Calendar events, Google Tasks checklists, and document streams via G-Drive and Picker.
          </p>
        </div>

        {loadingAuth ? (
          <div className="flex items-center gap-2 text-xs font-mono text-outline">
            <Loader2 className="w-4 h-4 animate-spin" /> Evaluating auth tokens...
          </div>
        ) : !user ? (
          <button 
            onClick={handleSignIn} 
            className="flex items-center gap-2 border border-slate-800 bg-slate-950 hover:bg-slate-900 duration-305 px-4 py-2.5 rounded-xl text-xs font-semibold cursor-pointer text-slate-200 transition-all shadow-sm"
            id="workspace-google-signer-btn"
          >
            <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-4 h-4 shrink-0">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
            </svg>
            Sign in with Google Account
          </button>
        ) : (
          <div className="flex items-center gap-3" id="user-metadata-hud">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full overflow-hidden border border-primary/20 bg-slate-950">
                <img src={user.photoURL || "https://lh3.googleusercontent.com/default"} alt="User photo" className="w-full h-full object-cover" />
              </div>
              <div className="text-left font-mono">
                <div className="text-[10px] font-bold text-on-surface leading-none">{user.displayName}</div>
                <div className="text-[8px] text-outline mt-0.5 leading-none">{user.email}</div>
              </div>
            </div>
            <button 
              onClick={handleSignOut}
              className="p-2 border border-slate-800 bg-slate-950 hover:bg-rose-950/70 hover:border-rose-800 text-outline hover:text-rose-400 rounded-xl transition-all cursor-pointer"
              title="Disconnect workspace account"
              id="workspace-disconnect-btn"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {user && (
        /* Workspace Multi-tab Sub-Navigation bar with custom sleek modern tabs */
        <div className="flex flex-wrap gap-1 bg-slate-950 border border-slate-800/80 p-1.5 rounded-2xl" id="workspace-tabs-bar">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
              activeTab === 'dashboard'
                ? 'bg-slate-900 border border-slate-800 text-primary font-bold'
                : 'text-on-surface-variant hover:text-white'
            }`}
          >
            <LayoutDashboard className="w-4.5 h-4.5 text-primary" />
            Dashboard Insights
          </button>
          <button
            onClick={() => setActiveTab('tasks')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
              activeTab === 'tasks'
                ? 'bg-slate-900 border border-slate-800 text-emerald-400 font-bold'
                : 'text-on-surface-variant hover:text-white'
            }`}
          >
            <CheckSquare className="w-4.5 h-4.5 text-emerald-400" />
            Tasks Checklist ({totalTasks})
          </button>
          <button
            onClick={() => setActiveTab('calendar')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
              activeTab === 'calendar'
                ? 'bg-slate-900 border border-slate-800 text-[#65e1ff] font-bold'
                : 'text-on-surface-variant hover:text-white'
            }`}
          >
            <Calendar className="w-4.5 h-4.5 text-[#65e1ff]" />
            Timetable Events ({calendarEvents.length})
          </button>
          <button
            onClick={() => setActiveTab('drive_picker')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
              activeTab === 'drive_picker'
                ? 'bg-slate-900 border border-slate-800 text-purple-400 font-bold'
                : 'text-on-surface-variant hover:text-white'
            }`}
          >
            <FileCode2 className="w-4.5 h-4.5 text-purple-400" />
            Vault & G-Picker
          </button>
        </div>
      )}

      {!user ? (
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-12 text-center flex flex-col items-center justify-center select-none gap-3" id="blank-workspace-slate">
          <div className="w-12 h-12 rounded-full bg-slate-950 border border-slate-800/80 flex items-center justify-center text-primary mb-1">
            <Lock className="w-5 h-5 text-primary" />
          </div>
          <div className="font-headline font-semibold text-xs text-on-surface">Secure Workspace Link Required</div>
          <p className="text-[10px] font-mono text-on-surface-variant max-w-sm leading-relaxed font-sans">
            Please authorize your Google account with standard scopes to enable the highlights dashboard, event charts, drive analytics, and picker tools.
          </p>
        </div>
      ) : activeTab === 'dashboard' ? (
        /* HIGHLIGHTS DASHBOARD INSIGHT PANEL */
        <div className="space-y-6" id="workspace-dashboard-insights">
          
          {/* A. Aggregate Bento Grid Box Counters */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" id="dashboard-aggregate-bento">
            <div className="bg-slate-900 border border-slate-800 p-4.5 rounded-2xl relative overflow-hidden group">
              <div className="absolute -top-6 -right-6 w-16 h-16 bg-emerald-500/5 rounded-full blur-xl group-hover:bg-emerald-500/10 transition-all"></div>
              <div className="text-[9px] font-mono text-outline uppercase tracking-wider">Tasks Resolution</div>
              <div className="text-2xl font-mono font-bold text-emerald-400 mt-2 flex items-baseline gap-1.5">
                {completedTasks}/{totalTasks}
                <span className="text-[10px] text-outline font-sans">({tasksPercent}%)</span>
              </div>
              <div className="w-full bg-slate-950 h-1.5 rounded-full mt-3 overflow-hidden">
                <div className="bg-emerald-400 h-full transition-all duration-500" style={{ width: `${tasksPercent}%` }}></div>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4.5 rounded-2xl relative overflow-hidden group">
              <div className="absolute -top-6 -right-6 w-16 h-16 bg-[#65e1ff]/5 rounded-full blur-xl group-hover:bg-[#65e1ff]/10 transition-all"></div>
              <div className="text-[9px] font-mono text-outline uppercase tracking-wider">Scheduled Events</div>
              <div className="text-2xl font-mono font-bold text-[#65e1ff] mt-2">
                {calendarEvents.length}
                <span className="text-[10px] text-outline font-sans ml-1 text-xs">Sessions</span>
              </div>
              <div className="text-[8px] font-mono text-outline mt-3 truncate flex items-center gap-1">
                <Clock className="w-2.5 h-2.5 text-[#65e1ff]" /> Peaks distribution mapped
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4.5 rounded-2xl relative overflow-hidden group">
              <div className="absolute -top-6 -right-6 w-16 h-16 bg-purple-500/5 rounded-full blur-xl group-hover:bg-purple-500/10 transition-all"></div>
              <div className="text-[9px] font-mono text-outline uppercase tracking-wider">Files Indexed</div>
              <div className="text-2xl font-mono font-bold text-purple-400 mt-2">
                {fileAnalysis.driveCount}
                <span className="text-[10px] text-outline font-sans ml-1 text-xs">MIME files</span>
              </div>
              <div className="text-[8px] font-mono text-outline mt-3 truncate flex items-center gap-1">
                <HardDrive className="w-2.5 h-2.5 text-purple-400" /> Storage mapping active
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4.5 rounded-2xl relative overflow-hidden group">
              <div className="absolute -top-6 -right-6 w-16 h-16 bg-primary/5 rounded-full blur-xl group-hover:bg-primary/10 transition-all"></div>
              <div className="text-[9px] font-mono text-outline uppercase tracking-wider">Workspace Rating</div>
              <div className="text-2xl font-mono font-bold text-primary mt-2">
                {healthScore}
                <span className="text-[10px] text-outline font-sans ml-1 text-xs">pts</span>
              </div>
              <div className="w-full bg-slate-950 h-1.5 rounded-full mt-3 overflow-hidden">
                <div className="bg-primary h-full transition-all duration-500" style={{ width: `${healthScore}%` }}></div>
              </div>
            </div>
          </div>

          {/* B. Dashboard Graphs Section (2 Column: Weekly Heatmap SVG & Workspace Health Radial Meter) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="dashboard-charts-row">
            
            {/* Chart 1: Daily Event Density Bar Graph */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 lg:col-span-2 flex flex-col justify-between" id="chart-daily-density-card">
              <div className="flex items-center justify-between border-b border-slate-800/60 pb-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  <h4 className="font-headline font-bold text-xs text-on-surface uppercase tracking-wider">Workload Timeline Breakdown</h4>
                </div>
                <div className="text-[9px] font-mono text-outline uppercase">Meetings / Weekday</div>
              </div>

              {/* Responsive custom SVG Area Path Line Chart */}
              <div className="h-52 w-full flex items-center justify-center relative bg-slate-950 border border-slate-800/80 rounded-xl p-4" id="graph-density-canvas">
                {calendarEvents.length === 0 ? (
                  <div className="text-center font-mono text-[10px] text-outline">
                    Please populate your calendar events to render this analytical chart.
                  </div>
                ) : (
                  <svg viewBox="0 0 420 160" className="w-full h-full text-slate-400" id="agenda-area-chart">
                    {/* Grids and Axes borders */}
                    <line x1="30" y1="130" x2="390" y2="130" stroke="#1e293b" strokeWidth="1" />
                    <line x1="30" y1="20" x2="30" y2="130" stroke="#1e293b" strokeWidth="1" />
                    
                    {/* Horizontal helper lines */}
                    <line x1="30" y1="20" x2="390" y2="20" stroke="#1e293b" strokeWidth="1" strokeDasharray="3,3" />
                    <line x1="30" y1="75" x2="390" y2="75" stroke="#1e293b" strokeWidth="1" strokeDasharray="3,3" strokeOpacity="0.4" />
                    
                    {/* Custom path points mapping based on real calendar density */}
                    {(() => {
                      // Generate standard coordinates
                      const coords = weekdayDistribution.map((v, idx) => {
                        const x = 30 + idx * 55;
                        const y = 130 - (v / maxEventsVal) * 100;
                        return { x, y, val: v };
                      });

                      // Construct Area Path (filled polygon)
                      const areaPoints = [
                        `30`, `130`,
                        ...coords.map(c => `${c.x},${c.y}`),
                        `360`, `130`
                      ].join(' ');

                      // Construct Line Path
                      const linePoints = coords.map(c => `${c.x},${c.y}`).join(' ');

                      return (
                        <>
                          {/* Defines gradient color scheme */}
                          <defs>
                            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#d2f232" stopOpacity="0.25" />
                              <stop offset="100%" stopColor="#d2f232" stopOpacity="0.00" />
                            </linearGradient>
                          </defs>

                          {/* Render Filled Area */}
                          <polygon points={areaPoints} fill="url(#chartGradient)" />

                          {/* Render Area Border line */}
                          <polyline points={linePoints} fill="none" stroke="#d2f232" strokeWidth="2.5" />

                          {/* Render dots and week labels */}
                          {coords.map((c, idx) => (
                            <g key={idx}>
                              <circle cx={c.x} cy={c.y} r="4.5" fill="#020617" stroke="#d2f232" strokeWidth="2" className="cursor-pointer hover:r-[6px] duration-150" title={`${c.val} Meetings`} />
                              
                              {/* Display specific count tag overlay if greater than 0 */}
                              {c.val > 0 && (
                                <text x={c.x} y={c.y - 10} textAnchor="middle" fill="#ffffff" fontSize="8" fontFamily="monospace" fontWeight="bold">
                                  {c.val}
                                </text>
                              )}

                              {/* Day Label on X Axis */}
                              <text x={c.x} y="145" textAnchor="middle" fill="#64748b" fontSize="8" fontFamily="monospace">
                                {weekdayLabels[idx]}
                              </text>
                            </g>
                          ))}
                        </>
                      );
                    })()}
                  </svg>
                )}
              </div>

              <div className="flex items-center gap-2 mt-2 select-none" id="graph-timeline-meta">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                <p className="text-[10px] text-outline leading-tight font-mono">
                  Weekly load curves calculated based on live localized calendar timetables.
                </p>
              </div>
            </div>

            {/* Chart 2: Workspace Health donut Arc */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 flex flex-col justify-between" id="chart-health-rating-card">
              <div className="border-b border-slate-800/60 pb-3">
                <h4 className="font-headline font-bold text-xs text-on-surface uppercase tracking-wider">Sync Integrity Score</h4>
              </div>

              {/* Circular SVG Donut Progress representation */}
              <div className="relative flex items-center justify-center p-3" id="health-ring-container">
                <svg className="w-36 h-36 transform -rotate-90">
                  <circle cx="72" cy="72" r="58" stroke="#0f172a" strokeWidth="12" fill="transparent" />
                  <circle 
                    cx="72" 
                    cy="72" 
                    r="58" 
                    stroke="#d2f232" 
                    strokeWidth="12" 
                    fill="transparent" 
                    strokeDasharray={364.5} 
                    strokeDashoffset={364.5 - (364.5 * healthScore) / 100}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>
                {/* Score central display overlay */}
                <div className="absolute inset-x-0 inset-y-0 flex flex-col items-center justify-center font-mono">
                  <span className="text-3xl font-bold text-on-surface">{healthScore}%</span>
                  <span className="text-[8px] text-outline uppercase tracking-widest mt-1">INTEGRITY SUCCESS</span>
                </div>
              </div>

              {/* Mime progress components */}
              <div className="space-y-2 select-text" id="mime-distribution-table">
                <div className="text-[9px] font-mono text-outline uppercase tracking-wider pb-1">MIME file analysis:</div>
                
                {/* Progress bar 1 */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-[9px] font-mono">
                    <span className="text-on-surface">Documents / PDF</span>
                    <span className="text-outline">{fileAnalysis.documentCount} items</span>
                  </div>
                  <div className="w-full bg-slate-950 h-1 rounded-full overflow-hidden">
                    <div className="bg-cyan-400 h-full" style={{ width: `${fileAnalysis.driveCount > 0 ? (fileAnalysis.documentCount / fileAnalysis.driveCount) * 100 : 0}%` }}></div>
                  </div>
                </div>

                {/* Progress bar 2 */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-[9px] font-mono">
                    <span className="text-on-surface">Spreadsheets / Sheets</span>
                    <span className="text-outline">{fileAnalysis.spreadsheetCount} items</span>
                  </div>
                  <div className="w-full bg-slate-950 h-1 rounded-full overflow-hidden">
                    <div className="bg-purple-400 h-full" style={{ width: `${fileAnalysis.driveCount > 0 ? (fileAnalysis.spreadsheetCount / fileAnalysis.driveCount) * 100 : 0}%` }}></div>
                  </div>
                </div>

                {/* Progress bar 3 */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-[9px] font-mono">
                    <span className="text-on-surface">Slide Presentations</span>
                    <span className="text-outline">{fileAnalysis.presentationCount} items</span>
                  </div>
                  <div className="w-full bg-slate-950 h-1 rounded-full overflow-hidden">
                    <div className="bg-pink-400 h-full" style={{ width: `${fileAnalysis.driveCount > 0 ? (fileAnalysis.presentationCount / fileAnalysis.driveCount) * 100 : 0}%` }}></div>
                  </div>
                </div>

              </div>

            </div>

          </div>

          {/* C. Live Cognitive Insights & Smart Diagnostics Alerts (No Mock Data) */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4" id="cognitive-insights-section">
            <h4 className="font-headline font-bold text-xs text-on-surface uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-primary" />
              Real-time Cognitive Workspace Diagnostics
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5" id="insights-grid">
              
              {/* Insight Card 1 */}
              <div className="bg-slate-950 border border-slate-800/80 p-4 rounded-xl flex items-start gap-3 relative overflow-hidden group">
                <div className="w-8 h-8 rounded-lg bg-pink-500/10 flex items-center justify-center text-pink-400 shrink-0 mt-0.5">
                  <Calendar className="w-4 h-4" />
                </div>
                <div className="space-y-1 min-w-0">
                  <div className="text-xs font-semibold text-on-surface truncate">Timeline Density</div>
                  <p className="text-[10px] text-on-surface-variant leading-relaxed">
                    {calendarEvents.length > 0 
                      ? `${calendarEvents.length} calendar events retrieved. Meeting workloads are centered on high weekday intensities.`
                      : "No active meetings currently tracked. Create custom calendars inside the timetable view module."
                    }
                  </p>
                </div>
              </div>

              {/* Insight Card 2 */}
              <div className="bg-slate-950 border border-slate-800/80 p-4 rounded-xl flex items-start gap-3 relative overflow-hidden group">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
                  <CheckSquare className="w-4 h-4" />
                </div>
                <div className="space-y-1 min-w-0">
                  <div className="text-xs font-semibold text-on-surface truncate">Tasks Resolution Metric</div>
                  <p className="text-[10px] text-on-surface-variant leading-relaxed">
                    {totalTasks > 0 
                      ? `${pendingTasks} tasks remain uncompleted in standard checklists. Backlog resolution is sitting at ${tasksPercent}%.`
                      : "Checklists are pristine and complete. Add custom Google tasks using the form constructor tab."
                    }
                  </p>
                </div>
              </div>

              {/* Insight Card 3 */}
              <div className="bg-slate-950 border border-slate-800/80 p-4 rounded-xl flex items-start gap-3 relative overflow-hidden group">
                <div className="w-8 h-8 rounded-lg bg-yellow-500/10 flex items-center justify-center text-yellow-400 shrink-0 mt-0.5">
                  <Database className="w-4 h-4" />
                </div>
                <div className="space-y-1 min-w-0">
                  <div className="text-xs font-semibold text-on-surface truncate">Integrity Recommendation</div>
                  <p className="text-[10px] text-on-surface-variant leading-relaxed">
                    Capture selected timetable events directly to local Obsidian memory caches to make items recursively accessible by Hermes AI agents.
                  </p>
                </div>
              </div>

            </div>
          </div>

        </div>
      ) : activeTab === 'tasks' ? (
        /* GOOGLE TASKS WORKSPACE TAB */
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 animate-fade-in" id="workspace-tasks-tab">
          <div className="flex items-center justify-between border-b border-slate-800/60 pb-3">
            <div className="flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-emerald-400" />
              <h4 className="font-headline font-bold text-xs text-on-surface uppercase tracking-wider">Default Cloud Tasks Checklist</h4>
            </div>
            <div className="flex items-center gap-1.5">
              <button 
                onClick={() => setShowTaskForm(!showTaskForm)}
                className="p-1 px-3 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-lg text-[10px] font-mono text-primary flex items-center gap-1 transition-all"
                id="btn-inscribe-g-task"
              >
                <Plus className="w-3 h-3" /> Inscribe Google Task
              </button>
              <button 
                onClick={() => loadAllData(token!)}
                className="p-1 border border-slate-800 rounded-lg bg-slate-950 hover:bg-slate-800 text-outline transition-all cursor-pointer"
                title="Refresh feed"
              >
                <RefreshCw className="w-3.5 h-3.5 text-outline" />
              </button>
            </div>
          </div>

          {showTaskForm && (
            <form onSubmit={handleCreateGoogleTask} className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-3" id="add-google-task-form">
              <div className="text-[9px] font-mono text-primary uppercase font-bold tracking-wider">Inject Task into Google Tasks Feed</div>
              <input 
                type="text" 
                placeholder="Task summary title *" required
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 text-xs px-2.5 py-1.5 rounded-lg text-on-surface outline-none focus:border-primary placeholder:text-slate-500"
              />
              <textarea 
                placeholder="Context details (Optional notes)"
                value={newTaskNotes}
                onChange={(e) => setNewTaskNotes(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 text-xs px-2.5 py-1.5 rounded-lg text-on-surface outline-none focus:border-primary placeholder:text-slate-500 h-16 resize-none"
              />
              <div className="flex justify-end gap-2 text-[10px]">
                <button type="button" onClick={() => setShowTaskForm(false)} className="px-3 py-1 text-slate-400 border border-slate-800 rounded-lg hover:bg-slate-900">Cancel</button>
                <button type="submit" className="px-4 py-1 bg-primary text-slate-950 font-bold rounded-lg hover:bg-slate-200">Submit Inscribe</button>
              </div>
            </form>
          )}

          <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1" id="g-tasks-scroll">
            {tasks.length > 0 ? (
              tasks.map((task) => {
                const completed = task.status === 'completed';
                return (
                  <div key={task.id} className="bg-slate-950 border border-slate-800/60 p-3 rounded-xl flex items-center justify-between gap-3 hover:border-slate-700 transition-all shadow-sm" id={`gtask-item-${task.id}`}>
                    <div className="flex items-center gap-3.5 flex-grow min-w-0">
                      <button 
                        type="button" 
                        onClick={() => handleToggleGoogleTaskStatus(task)}
                        className="text-outline hover:text-emerald-400 shrink-0 cursor-pointer"
                      >
                        <span className={`w-4 h-4 rounded-md border flex items-center justify-center ${completed ? 'border-emerald-500 bg-emerald-500/10' : 'border-slate-700 hover:border-emerald-500'}`}>
                          {completed && <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>}
                        </span>
                      </button>
                      <div className="min-w-0 text-left select-text">
                        <div className={`text-xs font-semibold truncate ${completed ? 'line-through text-outline font-normal' : 'text-on-surface font-semibold'}`}>{task.title}</div>
                        {task.notes && <p className="text-[10px] text-outline truncate select-text mt-0.5">{task.notes}</p>}
                      </div>
                    </div>

                    <button 
                      onClick={() => syncGoogleTaskToBackend(task)}
                      className="px-2.5 py-1 text-[8px] font-mono border border-primary/25 bg-slate-950 text-primary hover:bg-primary hover:text-black rounded-lg shrink-0 flex items-center gap-1.5 leading-none uppercase"
                      title="Inject to native database tables tasks feed"
                    >
                      <Database className="w-2.5 h-2.5" /> Core Sync
                    </button>
                  </div>
                );
              })
            ) : (
              <div className="p-16 text-center text-xs text-outline font-mono select-none">No checklist tasks retrieved. Create or load from your authorized Google Tasks account.</div>
            )}
          </div>
        </div>
      ) : activeTab === 'calendar' ? (
        /* GOOGLE CALENDAR SCHEDULE TIMETABLE TAB */
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 animate-fade-in" id="workspace-calendar-tab">
          <div className="flex items-center justify-between border-b border-slate-800/60 pb-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              <h4 className="font-headline font-bold text-xs text-on-surface uppercase tracking-wider">Timetable Schedule Events</h4>
            </div>
            <div className="flex items-center gap-1.5">
              <button 
                onClick={() => setShowEventForm(!showEventForm)}
                className="p-1 px-3 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-lg text-[10px] font-mono text-primary flex items-center gap-1 transition-all"
                id="btn-inscribe-g-event"
              >
                <Plus className="w-3 h-3" /> Event Inscribe
              </button>
              <button 
                onClick={() => loadAllData(token!)}
                className="p-1 border border-slate-800 rounded-lg bg-slate-950 hover:bg-slate-800 text-outline transition-all cursor-pointer"
                title="Refresh timetable"
              >
                <RefreshCw className="w-3.5 h-3.5 text-outline" />
              </button>
            </div>
          </div>

          {showEventForm && (
            <form onSubmit={handleCreateCalendarEvent} className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-3" id="add-google-event-form">
              <div className="text-[9px] font-mono text-primary uppercase font-bold tracking-wider">Inject Scheduled Event Into Google Calendar</div>
              <input 
                type="text" 
                placeholder="Event summary title *" required
                value={newEvent.summary}
                onChange={(e) => setNewEvent({ ...newEvent, summary: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 text-xs px-2.5 py-1.5 rounded-lg text-on-surface outline-none focus:border-primary placeholder:text-slate-500"
              />
              <input 
                type="text" 
                placeholder="Context description (Optional)"
                value={newEvent.description}
                onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 text-xs px-2.5 py-1.5 rounded-lg text-on-surface outline-none focus:border-primary placeholder:text-slate-500"
              />
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[8px] font-mono text-outline uppercase block mb-1">Start Time (ISO/Local)</label>
                  <input 
                    type="datetime-local" required
                    value={newEvent.startStr}
                    onChange={(e) => setNewEvent({ ...newEvent, startStr: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 text-xs px-2.5 py-1.5 rounded-lg text-on-surface outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="text-[8px] font-mono text-outline uppercase block mb-1">End Time (ISO/Local)</label>
                  <input 
                    type="datetime-local" required
                    value={newEvent.endStr}
                    onChange={(e) => setNewEvent({ ...newEvent, endStr: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 text-xs px-2.5 py-1.5 rounded-lg text-on-surface outline-none focus:border-primary"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 text-[10px]">
                <button type="button" onClick={() => setShowEventForm(false)} className="px-3 py-1 text-slate-400 border border-slate-800 rounded-lg hover:bg-slate-900">Cancel</button>
                <button type="submit" className="px-4 py-1 bg-primary text-slate-950 font-bold rounded-lg hover:bg-slate-200">Inject Event</button>
              </div>
            </form>
          )}

          <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1" id="g-events-scroll">
            {calendarEvents.length > 0 ? (
              calendarEvents.map((evt) => {
                const startVal = evt.start.dateTime || evt.start.date || 'All-Day';
                const displaysTime = startVal.includes('T') 
                  ? new Date(startVal).toLocaleString('en-IN', { hour12: false }) 
                  : startVal;
                return (
                  <div key={evt.id} className="bg-slate-950 border border-slate-800/60 p-3 rounded-xl flex items-center justify-between gap-3 hover:border-slate-700 transition-all shadow-sm" id={`gevent-item-${evt.id}`}>
                    <div className="min-w-0 flex-grow text-left select-text">
                      <div className="text-xs font-semibold text-on-surface truncate">{evt.summary}</div>
                      <div className="text-[9px] font-mono text-outline mt-0.5">{displaysTime}</div>
                      {evt.description && <p className="text-[10px] text-outline truncate select-text mt-0.5">{evt.description}</p>}
                    </div>

                    <button 
                      onClick={() => captureEventAsMemory(evt)}
                      className="px-2.5 py-1 text-[8px] font-mono border border-[#65e1ff]/40 bg-slate-950 text-[#65e1ff] hover:bg-cyan-400 hover:text-black rounded-lg shrink-0 flex items-center gap-1.5 uppercase transition-all"
                      title="Save details of event into Obsidian Memory Base"
                    >
                      <Database className="w-2.5 h-2.5" /> Obsidian
                    </button>
                  </div>
                );
              })
            ) : (
              <div className="p-16 text-center text-xs text-outline font-mono select-none">No upcoming calendar events detected. Inscribe brand new meetings over Google.</div>
            )}
          </div>
        </div>
      ) : (
        /* VAULT & GOOGLE PICKER TAB */
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-5 animate-fade-in" id="workspace-vault-picker-tab">
          
          {/* Sub Row 1: Google Picker Controller */}
          <div className="bg-slate-950 border border-slate-800/80 p-5 rounded-2xl space-y-4" id="picker-trigger-block">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-800/60">
              <FileCode2 className="w-4 h-4 text-cyan-400" />
              <h4 className="font-headline font-bold text-xs text-on-surface uppercase tracking-wider">Dynamic G-Picker Workspace</h4>
            </div>

            <p className="text-[11px] text-on-surface-variant leading-relaxed font-sans text-left">
              Launch the native Google Document Picker component directly over an overlay frame to safely browse text docs, PDFs, spreadsheets, or directories, allowing dynamic synchronization to our internal memory vaults.
            </p>

            <div className="flex flex-col md:flex-row gap-3 items-center">
              <button 
                onClick={handleLaunchPicker}
                className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-mono font-bold px-6 py-2.5 rounded-xl shadow-lg cursor-pointer transition-all uppercase flex items-center gap-1.5 select-none"
                id="btn-launch-gpicker"
              >
                Launch Google Picker ↗
              </button>

              {pickerSelectedFile && (
                <div className="flex-grow border border-dashed border-cyan-500/30 bg-cyan-500/5 p-3 rounded-xl text-left text-[11px] font-mono space-y-1.5 w-full" id="picker-selected-hud">
                  <div className="text-cyan-400 font-bold uppercase text-[9px]">Captured Document Attachment</div>
                  <div><span className="text-outline">FILE NAME:</span> <span className="text-on-surface truncate font-semibold block">{pickerSelectedFile.name}</span></div>
                  <div><span className="text-outline">DOCUMENT ID:</span> <span className="text-on-surface text-[10px] select-all block">{pickerSelectedFile.id}</span></div>
                  <div className="pt-2 flex justify-end">
                    <button 
                      onClick={handleSyncSelectedFileToMemory}
                      className="bg-pink-600 hover:bg-pink-500 text-white font-bold leading-none py-1.5 px-3.5 rounded-lg text-[9px] uppercase tracking-wide cursor-pointer flex items-center gap-1 select-none shadow-md transition-all"
                    >
                      <Database className="w-2.5 h-2.5" /> Save Selected Reference to Obsidian
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sub Row 2: File Browser lists */}
          <div className="space-y-3" id="drive-browser-collection">
            <div className="flex items-center justify-between border-b border-slate-800/60 pb-3">
              <div className="flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-purple-400" />
                <h4 className="font-headline font-bold text-xs text-on-surface uppercase tracking-wider">Indexed Google Drive Storage</h4>
              </div>
              <button 
                onClick={() => loadAllData(token!)}
                className="p-1 border border-slate-800 rounded-lg bg-slate-950 hover:bg-slate-800 text-outline cursor-pointer transition-all"
                title="Reload file indexing log"
              >
                <RefreshCw className="w-3.5 h-3.5 text-outline" />
              </button>
            </div>

            <div className="space-y-2.5 max-h-[290px] overflow-y-auto pr-1" id="g-drive-scroll">
              {driveFiles.length > 0 ? (
                driveFiles.map((file) => (
                  <div key={file.id} className="bg-slate-950 border border-slate-800/60 p-3 rounded-xl flex items-center justify-between gap-3 hover:border-slate-800 transition-all shadow-sm" id={`gfile-item-${file.id}`}>
                    <div className="flex items-center gap-2.5 min-w-0 text-left select-text">
                      <FileText className="w-4 h-4 text-purple-400 shrink-0" />
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-on-surface truncate select-text">{file.name}</div>
                        <span className="text-[8px] font-mono text-outline uppercase truncate block mt-0.5 select-text">{file.mimeType.replace('application/vnd.google-apps.', '')}</span>
                      </div>
                    </div>

                    {file.webViewLink && (
                      <a 
                        href={file.webViewLink} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="p-1.5 border border-slate-800 hover:border-purple-500 rounded-lg bg-slate-950 text-outline hover:text-purple-400 shrink-0 shadow-sm transition-all"
                        title="Open document in original cloud context"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                ))
              ) : (
                <div className="p-12 text-center text-xs text-outline font-mono select-none">No active items indexed inside Drive. Authorize and refresh your G-Drive connection.</div>
              )}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
