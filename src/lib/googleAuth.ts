import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App and Auth once
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

const provider = new GoogleAuthProvider();
// Add required Google Workspace scopes
provider.addScope('https://www.googleapis.com/auth/tasks');
provider.addScope('https://www.googleapis.com/auth/calendar');
provider.addScope('https://www.googleapis.com/auth/drive');

// In-memory token storage (Do NOT store in localStorage or sessionStorage)
let cachedAccessToken: string | null = null;
let isSigningIn = false;

// Initialize auth state listener. Call this on app load.
export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

// Initiate Google Sign-In popup with required scopes
export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Failed to obtain access token from Google OAuth sign-in.');
    }

    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Sign-in failed:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const logout = async () => {
  await auth.signOut();
  cachedAccessToken = null;
};

// GOOGLE WORKSPACE API HELPER FUNCTIONS

// 1. GOOGLE TASKS API HELPER
export interface GoogleTask {
  id: string;
  title: string;
  status: 'needsAction' | 'completed';
  notes?: string;
  updated: string;
}

export const fetchGoogleTasks = async (token: string): Promise<GoogleTask[]> => {
  try {
    // 1. Get default tasklist
    const listsRes = await fetch('https://tasks.googleapis.com/v1/users/@me/lists', {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!listsRes.ok) throw new Error(`Google Tasks Lists fetch failed: ${listsRes.statusText}`);
    const listsData = await listsRes.json();
    const defaultList = listsData.items?.[0];
    if (!defaultList) return [];

    // 2. Fetch tasks in list
    const tasksRes = await fetch(`https://tasks.googleapis.com/v1/lists/${defaultList.id}/tasks`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!tasksRes.ok) throw new Error(`Google Tasks fetch failed: ${tasksRes.statusText}`);
    const tasksData = await tasksRes.json();
    return tasksData.items || [];
  } catch (err) {
    console.error("Error fetching Google Tasks:", err);
    throw err;
  }
};

export const createGoogleTask = async (token: string, title: string, notes?: string): Promise<GoogleTask> => {
  const listsRes = await fetch('https://tasks.googleapis.com/v1/users/@me/lists', {
    headers: { Authorization: `Bearer ${token}` }
  });
  const listsData = await listsRes.json();
  const defaultList = listsData.items?.[0];
  if (!defaultList) throw new Error('No default Google Task list found');

  const createRes = await fetch(`https://tasks.googleapis.com/v1/lists/${defaultList.id}/tasks`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ title, notes })
  });

  if (!createRes.ok) throw new Error('Failed to create task on Google Tasks');
  return createRes.json();
};

export const updateGoogleTaskStatus = async (
  token: string, 
  taskId: string, 
  status: 'needsAction' | 'completed'
): Promise<GoogleTask> => {
  const listsRes = await fetch('https://tasks.googleapis.com/v1/users/@me/lists', {
    headers: { Authorization: `Bearer ${token}` }
  });
  const listsData = await listsRes.json();
  const defaultList = listsData.items?.[0];
  if (!defaultList) throw new Error('No default Google Task list found');

  const updateRes = await fetch(`https://tasks.googleapis.com/v1/lists/${defaultList.id}/tasks/${taskId}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      status,
      // If completed, the spec says we can also specify completed time if needed
    })
  });

  if (!updateRes.ok) throw new Error('Failed to update Google Task status');
  return updateRes.json();
};

// 2. GOOGLE CALENDAR API HELPER
export interface GoogleCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
}

export const fetchGoogleEvents = async (token: string): Promise<GoogleCalendarEvent[]> => {
  try {
    const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events?orderBy=startTime&singleEvents=true&maxResults=15', {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!response.ok) throw new Error(`Google Calendar fetch failed: ${response.statusText}`);
    const data = await response.json();
    return data.items || [];
  } catch (err) {
    console.error("Error fetching Google Calendar events:", err);
    throw err;
  }
};

export const createGoogleCalendarEvent = async (
  token: string, 
  eventData: { summary: string; description?: string; startStr: string; endStr: string }
): Promise<GoogleCalendarEvent> => {
  const start = eventData.startStr.includes('T') ? { dateTime: eventData.startStr } : { date: eventData.startStr };
  const end = eventData.endStr.includes('T') ? { dateTime: eventData.endStr } : { date: eventData.endStr };

  const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      summary: eventData.summary,
      description: eventData.description,
      start,
      end
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Failed to create calendar event: ${errText}`);
  }
  return response.json();
};

// 3. GOOGLE DRIVE API HELPER
export interface GoogleDriveFile {
  id: string;
  name: string;
  mimeType: string;
  webViewLink?: string;
  size?: string;
}

export const fetchGoogleDriveFiles = async (token: string): Promise<GoogleDriveFile[]> => {
  try {
    const url = 'https://www.googleapis.com/drive/v3/files?pageSize=20&fields=files(id,name,mimeType,webViewLink,size)';
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!response.ok) throw new Error(`Google Drive files fetch failed: ${response.statusText}`);
    const data = await response.json();
    return data.files || [];
  } catch (err) {
    console.error("Error listing files from Google Drive:", err);
    throw err;
  }
};
