import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { Agent, Task, CronMetric, RecentActivity, MemoryNode, Project, Repo, InterAgentEvent, KarmaState } from './src/types';

const app = express();
const PORT = 3000;

app.use(express.json());

// IN-MEMORY DATABASE STATE
const state: KarmaState = {
  agents: [
    {
      id: 'agent-1',
      name: 'Hermes',
      category: 'OWL / HF Space',
      platform: 'HuggingFace Space',
      status: 'ONLINE',
      model: 'groq/llama-3.3-70b-versatile',
      lastPing: '2m ago',
      telegramConnected: true,
      context: '128K',
      role: 'System coordination & digest delivery',
      memoryUsed: 12.4,
      memoryTotal: 16.0,
      cpu: 42,
      responseTime: '1.2s',
      uptime: '98.2%',
      endpoint: 'Karma1028-karma-os-bot.hf.space',
    },
    {
      id: 'agent-2',
      name: 'Antigravity',
      category: 'Claude Code',
      platform: 'Local · Git Bash',
      status: 'ACTIVE',
      model: 'claude-sonnet-4-6',
      lastPing: 'Just now',
      telegramConnected: false,
      context: '200K',
      role: 'Coding + Wiki compilation',
      memoryUsed: 4.8,
      memoryTotal: 8.0,
      cpu: 85,
      responseTime: '0.8s',
      uptime: '99.5%',
      endpoint: 'localhost:5100',
    },
    {
      id: 'agent-3',
      name: 'Gemini CLI',
      category: 'Google Cloud',
      platform: 'WSL2',
      status: 'IDLE',
      model: 'gemini-2.5-pro',
      lastPing: '47m ago',
      telegramConnected: false,
      context: '1M tokens',
      role: 'Large-context research',
      memoryUsed: 2.1,
      memoryTotal: 16.0,
      cpu: 5,
      responseTime: '2.1s',
      uptime: '94.0%',
      endpoint: 'gcloud-native-shell',
    }
  ],
  tasks: [
    { id: 'task-1', title: 'Refactor CLI Parser', status: 'done', priority: 'high', context: 'rslm', created: '2026-05-23' },
    { id: 'task-2', title: 'Update Neural Weights', status: 'done', priority: 'medium', context: 'hevy-mcp', created: '2026-05-23' },
    { id: 'task-3', title: 'Sync Fitness Tracker', status: 'done', priority: 'low', context: 'fitness', created: '2026-05-23' },
    { id: 'task-4', title: 'RSLM paper synthesis', status: 'in_progress', priority: 'high', context: 'rslm', created: '2026-05-23' },
    { id: 'task-5', title: 'Infoleap deliverable draft', status: 'pending', priority: 'high', context: 'infoleap', created: '2026-05-23' },
    { id: 'task-6', title: 'Placement prep — DSA review', status: 'pending', priority: 'medium', context: 'placement', created: '2026-05-22' },
    { id: 'task-7', title: 'arxiv digest review', status: 'done', priority: 'low', context: 'research', created: '2026-05-23' },
    { id: 'task-8', title: 'Hevy workout log', status: 'done', priority: 'low', context: 'fitness', created: '2026-05-23' }
  ],
  crons: [
    { id: 'cron-1', name: 'arxiv_daily', status: 'SUCCESS', time: '07:00' },
    { id: 'cron-2', name: 'daily_news', status: 'SUCCESS', time: '07:00' },
    { id: 'cron-3', name: 'daily_dump', status: 'SUCCESS', time: '06:00' },
    { id: 'cron-4', name: 'queue_processor', status: 'RUNNING', time: 'RUNNING' },
    { id: 'cron-5', name: 'NLM_weekly', status: 'FAILED', time: 'FAILED' },
    { id: 'cron-6', name: 'karma_diary', status: 'SCHEDULED', time: '23:00' },
    { id: 'cron-7', name: 'data_hub_sync', status: 'SUCCESS', time: '04:00' },
    { id: 'cron-8', name: 'super_domain', status: 'CRITICAL', time: 'CRITICAL' }
  ],
  activities: [
    { id: 'act-1', time: '23:07', tag: 'BOLT', details: 'Gemini CLI · RSLM synthesis completed · 2,847 tokens used' },
    { id: 'act-2', time: '07:30', tag: 'NEWS', details: 'arxiv_daily · 3 new papers found · saved to raw/papers/' },
    { id: 'act-3', time: '07:00', tag: 'SEND', details: 'daily_news · digest delivered via Telegram' },
    { id: 'act-4', time: '06:00', tag: 'SYNC', details: 'daily_dump · Supabase ➔ Obsidian sync completed' }
  ],
  memories: [
    {
      id: 'mem-1',
      title: 'RSLM — Qwen2.5-1.5B benchmarks on HotpotQA show massive gains at 1.5B scale',
      privacy: 'T1',
      category: 'gemini-cli',
      tags: ['rslm', 'ai', 'benchmark'],
      timeAgo: '14m ago'
    },
    {
      id: 'mem-2',
      title: 'Infoleap — Market research deliverable draft due Friday for client evaluation',
      privacy: 'T2',
      category: 'hermes',
      tags: ['infoleap', 'work'],
      timeAgo: '2h ago'
    },
    {
      id: 'mem-3',
      title: 'Hevy PPL routine — Push A completed (Bench press weight elevated to 80kg)',
      privacy: 'T1',
      category: 'hevy-mcp',
      tags: ['fitness', 'gym'],
      timeAgo: '6h ago'
    },
    {
      id: 'mem-4',
      title: 'NotebookLM auth expired. Required credential token refresh',
      privacy: 'T1',
      category: 'antigravity',
      tags: ['bug', 'nlm'],
      timeAgo: '29d ago'
    }
  ],
  projects: [
    {
      id: 'proj-1',
      name: 'RSLM Research',
      description: 'Reasoning Small Language Models — deep study of Qwen2.5-1.5B, Phi-3.5-mini, Llama-3.2-3B on HotpotQA/MuSiQue.',
      category: 'PERSONAL RESEARCH · T1',
      tags: ['rslm', 'ai', 'research'],
      notesCount: 12,
      statusLog: 'Reading phase',
      studyProgress: 65
    },
    {
      id: 'proj-2',
      name: 'Infoleap Internship',
      description: 'Remote internship @ Infoleap Market Research, Mumbai. Market research & data analytics role.',
      category: 'WORK · T2 · GROQ OK',
      tags: ['infoleap', 'research', 'analytics'],
      notesCount: 3,
      statusLog: 'Deliverable draft — due Friday',
      studyProgress: 45
    },
    {
      id: 'proj-3',
      name: 'Placement Prep',
      description: 'DSA review, system design, and deep dive into technical interview preparations.',
      category: 'PERSONAL · T1',
      tags: ['dsa', 'interviews', 'placement'],
      notesCount: 8,
      statusLog: 'Active 3d ago',
      studyProgress: 35
    }
  ],
  repos: [
    {
      id: 'repo-1',
      name: 'Karma1028/karma-os-bot',
      platform: 'HuggingFace Space',
      commitsCount: 24,
      deployedStatus: 'DEPLOYED · FREE TIER',
      latestCommitMsg: 'b87eef0 Trigger rebuild for secret',
      timeAgo: '3d ago on main',
      branch: 'main'
    },
    {
      id: 'repo-2',
      name: 'karma - zeroclaw',
      platform: 'HF Spaces Remote',
      commitsCount: 3,
      deployedStatus: 'LOCAL · NOT ON GITHUB',
      latestCommitMsg: 'b87eef0 3 commits ahead of initial',
      timeAgo: 'Active on master',
      branch: 'master',
      isLocalOnly: true
    }
  ],
  events: [
    { id: 'ev-1', time: '08:24:12', agent: '[Hermes]', text: 'System: Polling new arXiv papers for category CS.AI' },
    { id: 'ev-2', time: '08:24:45', agent: '[Antigravity]', text: 'Request: Fetching paper summary for ID 2405.12345' },
    { id: 'ev-3', time: '08:25:01', agent: '[Hermes]', text: 'Response: Summary completed. 4 key findings extracted.' },
    { id: 'ev-4', time: '08:26:30', agent: '[Antigravity]', text: 'Action: Updating local obsidian base \x27Agent_Intelligence.md\x27' },
    { id: 'ev-5', time: '08:30:00', agent: '[System]', text: 'Routine health check completed. All nodes operational.' },
    { id: 'ev-6', time: '08:32:15', agent: '[Hermes]', text: 'Event: Sent daily digest notification to Telegram context.' },
    { id: 'ev-7', time: '08:45:10', agent: '[Gemini CLI]', text: 'Idle: Transitioning to low-power state. Context buffer saved.' },
    { id: 'ev-8', time: '08:50:00', agent: '[System]', text: 'Memory swap initiated. System metrics optimization complete.' },
  ],
  stats: {
    totalTasks: 8,
    doneTasksToday: 3,
    xpEarnedToday: 240,
    tokensUsed: 12400,
    tokensTotal: 16000,
    cognitiveXp: 120,
    technicalXp: 80,
    weeklyTotalXp: 1840
  }
};

// PLUGGABLE REST ENDPOINTS FOR KARMA-OS PANELS
app.get('/api/v1/state', (req, res) => {
  res.json(state);
});

// AGENTS ENDPOINTS
app.get('/api/v1/agents', (req, res) => {
  res.json(state.agents);
});

app.post('/api/v1/agents', (req, res) => {
  const { name, platform, endpoint, model, role } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'Agent name is required' });
  }
  const newAgent: Agent = {
    id: `agent-${Date.now()}`,
    name,
    category: platform || 'Local LLM',
    platform: platform || 'Local LLM',
    status: 'ONLINE',
    model: model || 'claude-sonnet-4-6',
    lastPing: 'Just now',
    telegramConnected: false,
    context: '128K',
    role: role || 'Coding & Research',
    memoryUsed: 1.5,
    memoryTotal: 8.0,
    cpu: 10,
    responseTime: '1.0s',
    uptime: '100%',
    endpoint: endpoint || 'localhost:3000'
  };
  state.agents.push(newAgent);
  
  // Create system event
  state.events.push({
    id: `ev-${Date.now()}`,
    time: new Date().toLocaleTimeString('en-GB', { hour12: false }),
    agent: '[System]',
    text: `Deploy OK. Dedicated agent '${name}' connected successfully.`
  });

  res.status(201).json(newAgent);
});

app.post('/api/v1/agents/:id/terminate', (req, res) => {
  const agent = state.agents.find(a => a.id === req.params.id);
  if (agent) {
    agent.status = 'IDLE';
    agent.cpu = 0;
    
    state.events.push({
      id: `ev-${Date.now()}`,
      time: new Date().toLocaleTimeString('en-GB', { hour12: false }),
      agent: '[System]',
      text: `Session terminated for agent: '${agent.name}'. Resources freed.`
    });
    
    return res.json(agent);
  }
  res.status(404).json({ error: 'Agent not found' });
});

// TASKS ENDPOINTS
app.get('/api/v1/tasks', (req, res) => {
  res.json(state.tasks);
});

app.post('/api/v1/tasks', (req, res) => {
  const { title, priority, context } = req.body;
  if (!title) {
    return res.status(400).json({ error: 'Task title is required' });
  }
  const newTask: Task = {
    id: `task-${Date.now()}`,
    title,
    status: 'pending',
    priority: priority || 'medium',
    context: context || 'general',
    created: new Date().toISOString().split('T')[0]
  };
  state.tasks.push(newTask);
  state.stats.totalTasks++;
  
  // Custom system log event
  state.events.push({
    id: `ev-${Date.now()}`,
    time: new Date().toLocaleTimeString('en-GB', { hour12: false }),
    agent: '[System]',
    text: `DATA_HUB action: Task '${title}' injected successfully (Context: @${newTask.context}).`
  });

  res.status(201).json(newTask);
});

app.put('/api/v1/tasks/:id', (req, res) => {
  const { status, priority, context, title } = req.body;
  const task = state.tasks.find(t => t.id === req.params.id);
  if (task) {
    if (status) {
      // If transition to done, reward XP!
      if (status === 'done' && task.status !== 'done') {
        state.stats.doneTasksToday++;
        state.stats.xpEarnedToday += 20;
        state.stats.weeklyTotalXp += 20;
        state.stats.cognitiveXp += 10;
        state.stats.technicalXp += 10;
      }
      task.status = status;
    }
    if (priority) task.priority = priority;
    if (context) task.context = context;
    if (title) task.title = title;

    return res.json(task);
  }
  res.status(404).json({ error: 'Task not found' });
});

app.delete('/api/v1/tasks/:id', (req, res) => {
  const index = state.tasks.findIndex(t => t.id === req.params.id);
  if (index !== -1) {
    state.tasks.splice(index, 1);
    state.stats.totalTasks--;
    return res.json({ success: true });
  }
  res.status(404).json({ error: 'Task not found' });
});

// CRONS ENDPOINTS
app.get('/api/v1/crons', (req, res) => {
  res.json(state.crons);
});

app.post('/api/v1/crons/sync', (req, res) => {
  // Sync now action resets failed states to Success, simulates active sync with Supabase and rewards user
  state.crons.forEach(c => {
    if (c.status === 'FAILED' || c.status === 'CRITICAL') {
      c.status = 'SUCCESS';
    }
  });
  
  state.stats.xpEarnedToday += 40;
  state.stats.weeklyTotalXp += 40;
  
  state.events.push({
    id: `ev-${Date.now()}`,
    time: new Date().toLocaleTimeString('en-GB', { hour12: false }),
    agent: '[System]',
    text: `Sync signal acknowledged. Re-established Supabase & NLM link. All systems NOMINAL.`
  });

  res.json({ success: true, crons: state.crons, stats: state.stats });
});

// MEMORIES ENDPOINTS
app.get('/api/v1/memories', (req, res) => {
  res.json(state.memories);
});

app.post('/api/v1/memories', (req, res) => {
  const { title, privacy, tags, category } = req.body;
  if (!title) {
    return res.status(400).json({ error: 'Title is required' });
  }
  const newMemory: MemoryNode = {
    id: `mem-${Date.now()}`,
    title,
    privacy: privacy || 'T1',
    category: category || 'system',
    tags: tags || [],
    timeAgo: 'Just now'
  };
  state.memories.unshift(newMemory);

  state.events.push({
    id: `ev-${Date.now()}`,
    time: new Date().toLocaleTimeString('en-GB', { hour12: false }),
    agent: '[System]',
    text: `Memory stored context saved. Type: ${privacy || 'T1'} Privacy.`
  });

  res.status(201).json(newMemory);
});

// PROJECTS ENDPOINTS
app.get('/api/v1/projects', (req, res) => {
  res.json(state.projects);
});

app.post('/api/v1/projects', (req, res) => {
  const { name, description, tags, category } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'Project name is required' });
  }
  const newProj: Project = {
    id: `proj-${Date.now()}`,
    name,
    description: description || '',
    category: category || 'PERSONAL · T1',
    tags: tags || [],
    notesCount: 0,
    statusLog: 'Scaffolding phase',
    studyProgress: 0
  };
  state.projects.push(newProj);
  res.status(201).json(newProj);
});

// REPOS ENDPOINTS
app.get('/api/v1/repos', (req, res) => {
  res.json(state.repos);
});

app.post('/api/v1/repos', (req, res) => {
  const { name, platform } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'Repo name is required' });
  }
  const newRepo: Repo = {
    id: `repo-${Date.now()}`,
    name,
    platform: platform || 'GitHub',
    commitsCount: 1,
    deployedStatus: 'LOCAL · NOT ON GITHUB',
    latestCommitMsg: 'Initial commit scaffold',
    timeAgo: 'Just now',
    branch: 'main',
    isLocalOnly: true
  };
  state.repos.push(newRepo);
  res.status(201).json(newRepo);
});

// CHRON CLOCK OR TIME DATA
app.get('/api/v1/clock', (req, res) => {
  const now = new Date();
  res.json({
    iso: now.toISOString(),
    formattedTime: now.toLocaleTimeString('en-IN', { hour12: false }) + ' IST',
    weekday: now.toLocaleDateString('en-US', { weekday: 'long' }),
    dateFormatted: now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  });
});

// VITE MIDDLEWARE SETUP / PRODUCTION STATIC HOSTING
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`KARMA-OS Full Stack is running on http://localhost:${PORT}`);
  });
}

startServer().catch(err => {
  console.error("Failed to start server:", err);
});
