export interface Agent {
  id: string;
  name: string;
  category: string;
  platform: string;
  status: 'ONLINE' | 'ACTIVE' | 'IDLE' | 'OFFLINE';
  model: string;
  lastPing: string;
  telegramConnected: boolean;
  context: string;
  role: string;
  memoryUsed: number; // in GB
  memoryTotal: number; // in GB
  cpu: number; // percentage
  responseTime: string;
  uptime: string;
  endpoint: string;
}

export interface Task {
  id: string;
  title: string;
  status: 'pending' | 'in_progress' | 'done';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  context: string;
  created: string;
}

export interface CronMetric {
  id: string;
  name: string;
  status: 'SUCCESS' | 'RUNNING' | 'FAILED' | 'CRITICAL' | 'SCHEDULED';
  time: string;
}

export interface RecentActivity {
  id: string;
  time: string;
  tag: string;
  details: string;
}

export interface MemoryNode {
  id: string;
  title: string;
  privacy: 'T1' | 'T2' | 'T3';
  category: string;
  tags: string[];
  timeAgo: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  notesCount: number;
  statusLog: string;
  studyProgress?: number;
}

export interface Repo {
  id: string;
  name: string;
  platform: string;
  commitsCount: number;
  deployedStatus: string;
  latestCommitMsg: string;
  timeAgo: string;
  branch: string;
  isLocalOnly?: boolean;
}

export interface InterAgentEvent {
  id: string;
  time: string;
  agent: string;
  text: string;
}

export interface KarmaState {
  agents: Agent[];
  tasks: Task[];
  crons: CronMetric[];
  activities: RecentActivity[];
  memories: MemoryNode[];
  projects: Project[];
  repos: Repo[];
  events: InterAgentEvent[];
  stats: {
    totalTasks: number;
    doneTasksToday: number;
    xpEarnedToday: number;
    tokensUsed: number;
    tokensTotal: number;
    cognitiveXp: number;
    technicalXp: number;
    weeklyTotalXp: number;
  };
}
