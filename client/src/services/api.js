// API service for Heat of the Day application
// Handles all backend communication and error management

const BASE_URL = '/api';

class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

const handleResponse = async (response) => {
  if (!response.ok) {
    let errorMessage = 'Network error occurred';
    try {
      const errorData = await response.json();
      errorMessage = errorData.error || errorMessage;
    } catch {
      // If JSON parsing fails, use default message
    }
    throw new ApiError(errorMessage, response.status);
  }

  // Handle 204 No Content responses
  if (response.status === 204) {
    return null;
  }

  try {
    return await response.json();
  } catch {
    throw new ApiError('Invalid response format', response.status);
  }
};

const makeRequest = async (url, options = {}) => {
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  if (config.body && typeof config.body !== 'string') {
    config.body = JSON.stringify(config.body);
  }

  try {
    const response = await fetch(`${BASE_URL}${url}`, config);
    return await handleResponse(response);
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError('Network connection failed', 0);
  }
};

export const apiService = {
  // Project endpoints - Implements R1.1, R1.2, R2.1, R2.2, R3.1, R3.2
  async getProjects() {
    return makeRequest('/projects');
  },

  async createProject(projectData) {
    return makeRequest('/projects', {
      method: 'POST',
      body: projectData,
    });
  },

  async updateProject(projectId, updates) {
    return makeRequest(`/projects/${projectId}`, {
      method: 'PUT',
      body: updates,
    });
  },

  async deleteProject(projectId) {
    return makeRequest(`/projects/${projectId}`, {
      method: 'DELETE',
    });
  },

  // Event endpoints - Implements R7.1, R7.2, R8.1, R8.2, R9.1, R9.2, R9.3, R4, R5.1, R5.2
  async getEvents(projectId = null) {
    const url = projectId ? `/events?projectId=${projectId}` : '/events';
    return makeRequest(url);
  },

  async createEvent(eventData) {
    return makeRequest('/events', {
      method: 'POST',
      body: eventData,
    });
  },

  async updateEvent(eventId, updates) {
    return makeRequest(`/events/${eventId}`, {
      method: 'PUT',
      body: updates,
    });
  },

  async deleteEvent(eventId) {
    return makeRequest(`/events/${eventId}`, {
      method: 'DELETE',
    });
  },

  // Task endpoints - Implements R10.1, R10.2, R11.1, R11.2, R12.1, R12.2, R12.3, R13.1, R13.2, R6.1, R6.2
  async getTasks(projectId = null) {
    const url = projectId ? `/tasks?projectId=${projectId}` : '/tasks';
    return makeRequest(url);
  },

  async createTask(taskData) {
    return makeRequest('/tasks', {
      method: 'POST',
      body: taskData,
    });
  },

  async updateTask(taskId, updates) {
    return makeRequest(`/tasks/${taskId}`, {
      method: 'PUT',
      body: updates,
    });
  },

  async deleteTask(taskId) {
    return makeRequest(`/tasks/${taskId}`, {
      method: 'DELETE',
    });
  },

  // Analytics endpoints for heatmap visualization
  async getHeatmapData(startDate = null, endDate = null, timeScale = 1) {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (timeScale) params.append('timeScale', timeScale.toString());
    
    const url = `/analytics/heatmap${params.toString() ? '?' + params.toString() : ''}`;
    return makeRequest(url);
  },
};

// Helper functions for data processing
export const dataUtils = {
  // Sort projects by order
  sortProjects(projects) {
    return [...projects].sort((a, b) => a.order - b.order);
  },

  // Filter visible projects (not hidden)
  getVisibleProjects(projects) {
    return projects.filter(p => !p.hidden);
  },

  // Filter hidden projects
  getHiddenProjects(projects) {
    return projects.filter(p => p.hidden);
  },

  // Get tasks for a specific project
  getProjectTasks(tasks, projectId) {
    return tasks.filter(t => t.projectId === projectId);
  },

  // Get events for a specific project
  getProjectEvents(events, projectId) {
    return events.filter(e => e.projectId === projectId);
  },

  // Get completed tasks count for a project on a specific date
  getCompletedTasksCount(tasks, projectId, date) {
    const projectTasks = this.getProjectTasks(tasks, projectId);
    return projectTasks.filter(task => {
      if (!task.completed) return false;
      const taskDate = new Date(task.createdAt).toDateString();
      const targetDate = new Date(date).toDateString();
      return taskDate === targetDate;
    }).length;
  },

  // Get events for a specific date
  getEventsForDate(events, date) {
    // Normalize the target date to compare only the date part (YYYY-MM-DD)
    const targetDate = new Date(date);
    const targetDateString = targetDate.getFullYear() + '-' + 
                           String(targetDate.getMonth() + 1).padStart(2, '0') + '-' + 
                           String(targetDate.getDate()).padStart(2, '0');
    
    console.log(`Looking for events on date: ${targetDateString} (from ${date})`);
    
    const matchingEvents = events.filter(event => {
      // Normalize the event date to compare only the date part (YYYY-MM-DD)
      const eventDate = new Date(event.date);
      const eventDateString = eventDate.getFullYear() + '-' + 
                             String(eventDate.getMonth() + 1).padStart(2, '0') + '-' + 
                             String(eventDate.getDate()).padStart(2, '0');
      
      const matches = eventDateString === targetDateString;
      console.log(`  Event "${event.name}" (${event.date}) -> ${eventDateString} | Matches: ${matches}`);
      
      return matches;
    });
    
    return matchingEvents;
  },

  // Calculate heatmap intensity (0-1) based on task completion
  getHeatmapIntensity(completedCount, maxTasks = 10) {
    return Math.min(completedCount / maxTasks, 1);
  },

  // Generate color with opacity based on project color and intensity
  getHeatmapCellColor(projectColor, intensity) {
    // Convert hex to RGB and apply opacity
    const hex = projectColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    const opacity = Math.max(0.1, intensity); // Minimum opacity for visibility
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  },

  // Format date for display
  formatDate(date, format = 'short') {
    const d = new Date(date);
    
    switch (format) {
      case 'short':
        // DD/MM format
        const day = d.getDate().toString().padStart(2, '0');
        const month = (d.getMonth() + 1).toString().padStart(2, '0');
        return `${day}/${month}`;
      case 'long':
        // DD/MM/YYYY format with day name
        const longDay = d.getDate().toString().padStart(2, '0');
        const longMonth = (d.getMonth() + 1).toString().padStart(2, '0');
        const year = d.getFullYear();
        const weekday = d.toLocaleDateString('en-US', { weekday: 'long' });
        return `${weekday}, ${longDay}/${longMonth}/${year}`;
      case 'date-only':
        // DD/MM/YYYY format
        const dateDay = d.getDate().toString().padStart(2, '0');
        const dateMonth = (d.getMonth() + 1).toString().padStart(2, '0');
        const dateYear = d.getFullYear();
        return `${dateDay}/${dateMonth}/${dateYear}`;
      case 'time':
        return d.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit'
        });
      case 'datetime':
        // DD/MM/YYYY HH:MM format
        const dtDay = d.getDate().toString().padStart(2, '0');
        const dtMonth = (d.getMonth() + 1).toString().padStart(2, '0');
        const dtYear = d.getFullYear();
        const time = d.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit'
        });
        return `${dtDay}/${dtMonth}/${dtYear} ${time}`;
      default:
        // Default to DD/MM/YYYY
        const defDay = d.getDate().toString().padStart(2, '0');
        const defMonth = (d.getMonth() + 1).toString().padStart(2, '0');
        const defYear = d.getFullYear();
        return `${defDay}/${defMonth}/${defYear}`;
    }
  },

  // Generate date range for heatmap
  generateDateRange(centerDate, timeScale, daysToShow = 30) {
    const dates = [];
    const center = new Date(centerDate);
    
    // Start from 7 days before the center date
    const startDate = new Date(center);
    startDate.setDate(center.getDate() - 7);
    
    for (let i = 0; i < daysToShow; i += timeScale) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      dates.push(new Date(date));
    }
    
    return dates;
  },

  // Check if project has deadline
  hasDeadline(events, projectId) {
    return events.some(e => e.projectId === projectId && e.type === 'deadline');
  },

  // Get project deadline
  getProjectDeadline(events, projectId) {
    return events.find(e => e.projectId === projectId && e.type === 'deadline');
  },

  // Get project milestones
  getProjectMilestones(events, projectId) {
    return events.filter(e => e.projectId === projectId && e.type === 'milestone');
  },

  // Validate task assignment to event
  validateTaskEventAssignment(task, event) {
    if (!event) return true; // No event assignment is valid
    return task.projectId === event.projectId;
  },
}; 