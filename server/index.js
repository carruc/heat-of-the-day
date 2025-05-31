const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');
const { isAfter, parseISO } = require('date-fns');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Only serve static files in production when build directory exists
const buildPath = path.join(__dirname, '../client/build');
if (fs.existsSync(buildPath)) {
  app.use(express.static(buildPath));
}

// In-memory data store (for simplicity - in production, use a database)
let projects = [];
let tasks = [];
let events = []; // milestones and deadlines

// Helper functions
const validateDate = (dateString) => {
  const date = parseISO(dateString);
  const now = new Date();
  return isAfter(date, now) || date.toDateString() === now.toDateString();
};

const findProjectById = (id) => projects.find(p => p.id === id);
const findTaskById = (id) => tasks.find(t => t.id === id);
const findEventById = (id) => events.find(e => e.id === id);

// Project endpoints - Implements R1.1, R1.2, R2.1, R2.2, R3.1, R3.2
app.post('/api/projects', (req, res) => {
  const { name, color } = req.body;
  
  if (!name || !color) {
    return res.status(400).json({ error: 'Name and color are required' });
  }

  const project = {
    id: uuidv4(),
    name,
    color,
    hidden: false,
    order: projects.length,
    createdAt: new Date().toISOString()
  };

  projects.push(project);
  res.status(201).json(project);
});

app.get('/api/projects', (req, res) => {
  res.json(projects.sort((a, b) => a.order - b.order));
});

app.put('/api/projects/:id', (req, res) => {
  const { id } = req.params;
  const { name, color, hidden, order } = req.body;
  
  const project = findProjectById(id);
  if (!project) {
    return res.status(404).json({ error: 'Project not found' });
  }

  if (name !== undefined) project.name = name;
  if (color !== undefined) project.color = color;
  if (hidden !== undefined) project.hidden = hidden;
  if (order !== undefined) project.order = order;

  res.json(project);
});

app.delete('/api/projects/:id', (req, res) => {
  const { id } = req.params;
  const projectIndex = projects.findIndex(p => p.id === id);
  
  if (projectIndex === -1) {
    return res.status(404).json({ error: 'Project not found' });
  }

  // Remove associated tasks and events
  tasks = tasks.filter(t => t.projectId !== id);
  events = events.filter(e => e.projectId !== id);
  
  projects.splice(projectIndex, 1);
  res.status(204).send();
});

// Events (Milestones and Deadlines) endpoints - Implements R7.1, R7.2, R8.1, R8.2, R9.1, R9.2, R9.3, R4, R5.1, R5.2
app.post('/api/events', (req, res) => {
  const { name, projectId, date, type } = req.body;
  
  if (!name || !projectId || !date || !type) {
    return res.status(400).json({ error: 'Name, projectId, date, and type are required' });
  }

  if (!validateDate(date)) {
    return res.status(400).json({ error: 'Date cannot be in the past' });
  }

  const project = findProjectById(projectId);
  if (!project) {
    return res.status(404).json({ error: 'Project not found' });
  }

  // R4: Check if project already has a deadline
  if (type === 'deadline') {
    const existingDeadline = events.find(e => e.projectId === projectId && e.type === 'deadline');
    if (existingDeadline) {
      return res.status(400).json({ error: 'Project can only have one deadline' });
    }
  }

  const event = {
    id: uuidv4(),
    name,
    projectId,
    date,
    type, // 'milestone' or 'deadline'
    createdAt: new Date().toISOString()
  };

  events.push(event);
  res.status(201).json(event);
});

app.get('/api/events', (req, res) => {
  const { projectId } = req.query;
  let filteredEvents = events;
  
  if (projectId) {
    filteredEvents = events.filter(e => e.projectId === projectId);
  }
  
  res.json(filteredEvents);
});

app.put('/api/events/:id', (req, res) => {
  const { id } = req.params;
  const { name, date, type } = req.body;
  
  const event = findEventById(id);
  if (!event) {
    return res.status(404).json({ error: 'Event not found' });
  }

  if (date && !validateDate(date)) {
    return res.status(400).json({ error: 'Date cannot be in the past' });
  }

  // Check deadline constraint when changing type
  if (type === 'deadline' && event.type !== 'deadline') {
    const existingDeadline = events.find(e => e.projectId === event.projectId && e.type === 'deadline' && e.id !== id);
    if (existingDeadline) {
      return res.status(400).json({ error: 'Project can only have one deadline' });
    }
  }

  if (name !== undefined) event.name = name;
  if (date !== undefined) event.date = date;
  if (type !== undefined) event.type = type;

  res.json(event);
});

app.delete('/api/events/:id', (req, res) => {
  const { id } = req.params;
  const eventIndex = events.findIndex(e => e.id === id);
  
  if (eventIndex === -1) {
    return res.status(404).json({ error: 'Event not found' });
  }

  // Remove task associations with this event
  tasks = tasks.map(task => {
    if (task.eventId === id) {
      return { ...task, eventId: null };
    }
    return task;
  });

  events.splice(eventIndex, 1);
  res.status(204).send();
});

// Tasks endpoints - Implements R10.1, R10.2, R11.1, R11.2, R12.1, R12.2, R12.3, R13.1, R13.2, R6.1, R6.2
app.post('/api/tasks', (req, res) => {
  const { name, projectId, eventId } = req.body;
  
  if (!name || !projectId) {
    return res.status(400).json({ error: 'Name and projectId are required' });
  }

  const project = findProjectById(projectId);
  if (!project) {
    return res.status(404).json({ error: 'Project not found' });
  }

  if (eventId) {
    const event = findEventById(eventId);
    if (!event || event.projectId !== projectId) {
      return res.status(400).json({ error: 'Event not found or does not belong to the project' });
    }
  }

  const task = {
    id: uuidv4(),
    name,
    projectId,
    eventId: eventId || null,
    completed: false,
    createdAt: new Date().toISOString()
  };

  tasks.push(task);
  res.status(201).json(task);
});

app.get('/api/tasks', (req, res) => {
  const { projectId } = req.query;
  let filteredTasks = tasks;
  
  if (projectId) {
    filteredTasks = tasks.filter(t => t.projectId === projectId);
  }
  
  res.json(filteredTasks);
});

app.put('/api/tasks/:id', (req, res) => {
  const { id } = req.params;
  const { name, completed, eventId } = req.body;
  
  const task = findTaskById(id);
  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }

  if (eventId !== undefined) {
    if (eventId) {
      const event = findEventById(eventId);
      if (!event || event.projectId !== task.projectId) {
        return res.status(400).json({ error: 'Event not found or does not belong to the task\'s project' });
      }
    }
    task.eventId = eventId;
  }

  if (name !== undefined) task.name = name;
  if (completed !== undefined) task.completed = completed;

  res.json(task);
});

app.delete('/api/tasks/:id', (req, res) => {
  const { id } = req.params;
  const taskIndex = tasks.findIndex(t => t.id === id);
  
  if (taskIndex === -1) {
    return res.status(404).json({ error: 'Task not found' });
  }

  tasks.splice(taskIndex, 1);
  res.status(204).send();
});

// Analytics endpoint for heatmap data
app.get('/api/analytics/heatmap', (req, res) => {
  const { startDate, endDate, timeScale = 1 } = req.query;
  
  // Generate heatmap data based on completed tasks
  const heatmapData = {};
  
  projects.forEach(project => {
    heatmapData[project.id] = {
      project,
      data: {} // date -> completion count
    };
  });

  // Count completed tasks by date and project
  tasks.forEach(task => {
    if (task.completed) {
      const date = task.createdAt.split('T')[0]; // Simple date extraction
      if (!heatmapData[task.projectId]) return;
      
      if (!heatmapData[task.projectId].data[date]) {
        heatmapData[task.projectId].data[date] = 0;
      }
      heatmapData[task.projectId].data[date]++;
    }
  });

  res.json(heatmapData);
});

// Serve React app for all other routes (only in production)
app.get('*', (req, res) => {
  const buildIndexPath = path.join(__dirname, '../client/build/index.html');
  if (fs.existsSync(buildIndexPath)) {
    res.sendFile(buildIndexPath);
  } else {
    res.status(404).json({ error: 'Client build not found. Run npm run build in client directory for production.' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(PORT, () => {
  console.log(`Heat of the Day server running on port ${PORT}`);
  console.log(`API available at http://localhost:${PORT}/api`);
});

module.exports = app; 