import React, { useState, useEffect } from 'react';
import HeatmapCalendar from './components/HeatmapCalendar';
import TaskLists from './components/TaskLists';
import ProjectModal from './components/ProjectModal';
import EventModal from './components/EventModal';
import { apiService } from './services/api';
import './App.css';

function App() {
  // State management for all entities - Implements requirements R1-R16
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal states - Implements D5, D6
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [editingEvent, setEditingEvent] = useState(null);

  // Heatmap settings - Implements R15, D1.3
  const [timeScale, setTimeScale] = useState(1);
  const [currentDate, setCurrentDate] = useState(new Date());

  // Load initial data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [projectsData, tasksData, eventsData] = await Promise.all([
        apiService.getProjects(),
        apiService.getTasks(),
        apiService.getEvents()
      ]);
      
      setProjects(projectsData);
      setTasks(tasksData);
      setEvents(eventsData);
      setError(null);
    } catch (err) {
      setError('Failed to load data. Please try again.');
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Project management functions - Implements R1.1, R1.2, R2.1, R2.2, R3.1, R3.2
  const handleCreateProject = async (projectData) => {
    try {
      const newProject = await apiService.createProject(projectData);
      setProjects(prev => [...prev, newProject]);
      setShowProjectModal(false);
      setEditingProject(null);
    } catch (err) {
      setError('Failed to create project. Please try again.');
      console.error('Error creating project:', err);
    }
  };

  const handleUpdateProject = async (projectId, updates) => {
    try {
      const updatedProject = await apiService.updateProject(projectId, updates);
      setProjects(prev => prev.map(p => p.id === projectId ? updatedProject : p));
      
      if (editingProject) {
        setShowProjectModal(false);
        setEditingProject(null);
      }
    } catch (err) {
      setError('Failed to update project. Please try again.');
      console.error('Error updating project:', err);
    }
  };

  const handleDeleteProject = async (projectId) => {
    if (!window.confirm('Are you sure you want to delete this project? All associated tasks and events will be removed.')) {
      return;
    }

    try {
      await apiService.deleteProject(projectId);
      setProjects(prev => prev.filter(p => p.id !== projectId));
      setTasks(prev => prev.filter(t => t.projectId !== projectId));
      setEvents(prev => prev.filter(e => e.projectId !== projectId));
    } catch (err) {
      setError('Failed to delete project. Please try again.');
      console.error('Error deleting project:', err);
    }
  };

  // Event management functions - Implements R7.1, R7.2, R8.1, R8.2, R9.1, R9.2, R9.3
  const handleCreateEvent = async (eventData) => {
    try {
      const newEvent = await apiService.createEvent(eventData);
      setEvents(prev => [...prev, newEvent]);
      setShowEventModal(false);
      setEditingEvent(null);
    } catch (err) {
      setError(err.message || 'Failed to create event. Please try again.');
      console.error('Error creating event:', err);
    }
  };

  const handleUpdateEvent = async (eventId, updates) => {
    try {
      const updatedEvent = await apiService.updateEvent(eventId, updates);
      setEvents(prev => prev.map(e => e.id === eventId ? updatedEvent : e));
      
      if (editingEvent) {
        setShowEventModal(false);
        setEditingEvent(null);
      }
    } catch (err) {
      setError(err.message || 'Failed to update event. Please try again.');
      console.error('Error updating event:', err);
    }
  };

  const handleDeleteEvent = async (eventId) => {
    if (!window.confirm('Are you sure you want to delete this event?')) {
      return;
    }

    try {
      await apiService.deleteEvent(eventId);
      setEvents(prev => prev.filter(e => e.id !== eventId));
      // Update tasks that were associated with this event
      setTasks(prev => prev.map(task => 
        task.eventId === eventId ? { ...task, eventId: null } : task
      ));
    } catch (err) {
      setError('Failed to delete event. Please try again.');
      console.error('Error deleting event:', err);
    }
  };

  // Task management functions - Implements R10.1, R10.2, R11.1, R11.2, R12.1, R12.2, R12.3, R13.1, R13.2
  const handleCreateTask = async (taskData) => {
    try {
      const newTask = await apiService.createTask(taskData);
      setTasks(prev => [...prev, newTask]);
    } catch (err) {
      setError('Failed to create task. Please try again.');
      console.error('Error creating task:', err);
    }
  };

  const handleUpdateTask = async (taskId, updates) => {
    try {
      const updatedTask = await apiService.updateTask(taskId, updates);
      setTasks(prev => prev.map(t => t.id === taskId ? updatedTask : t));
    } catch (err) {
      setError('Failed to update task. Please try again.');
      console.error('Error updating task:', err);
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      await apiService.deleteTask(taskId);
      setTasks(prev => prev.filter(t => t.id !== taskId));
    } catch (err) {
      setError('Failed to delete task. Please try again.');
      console.error('Error deleting task:', err);
    }
  };

  const handleToggleTaskComplete = async (taskId) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      await handleUpdateTask(taskId, { completed: !task.completed });
    }
  };

  // Modal handlers
  const handleEditProject = (project) => {
    setEditingProject(project);
    setShowProjectModal(true);
  };

  const handleEditEvent = (event) => {
    setEditingEvent(event);
    setShowEventModal(true);
  };

  if (loading) {
    return (
      <div className="app-loading">
        <div className="loading-spinner"></div>
        <p>Loading Heat of the Day...</p>
      </div>
    );
  }

  return (
    <div className="app">
      {/* Error display */}
      {error && (
        <div className="error-banner">
          <span>{error}</span>
          <button 
            className="btn-ghost"
            onClick={() => setError(null)}
          >
            ×
          </button>
        </div>
      )}

      <main className="app-main">
        {/* Heatmap Calendar - Implements R14, R15, D1-D8 */}
        <section className="heatmap-section">
          <HeatmapCalendar
            projects={projects}
            tasks={tasks}
            events={events}
            timeScale={timeScale}
            currentDate={currentDate}
            onTimeScaleChange={setTimeScale}
            onCurrentDateChange={setCurrentDate}
            onProjectUpdate={handleUpdateProject}
            onProjectDelete={handleDeleteProject}
            onProjectEdit={handleEditProject}
            onEventEdit={handleEditEvent}
            onEventDelete={handleDeleteEvent}
            onNewProject={() => setShowProjectModal(true)}
            onNewEvent={() => setShowEventModal(true)}
          />
        </section>

        {/* Task Lists - Implements R16, D9-D12 */}
        <section className="tasklists-section">
          <TaskLists
            projects={projects}
            tasks={tasks}
            events={events}
            onTaskCreate={handleCreateTask}
            onTaskUpdate={handleUpdateTask}
            onTaskDelete={handleDeleteTask}
            onTaskToggle={handleToggleTaskComplete}
            onProjectUpdate={handleUpdateProject}
          />
        </section>
      </main>

      {/* Modals */}
      {showProjectModal && (
        <ProjectModal
          project={editingProject}
          onSave={editingProject ? 
            (data) => handleUpdateProject(editingProject.id, data) : 
            handleCreateProject
          }
          onClose={() => {
            setShowProjectModal(false);
            setEditingProject(null);
          }}
        />
      )}

      {showEventModal && (
        <EventModal
          event={editingEvent}
          projects={projects}
          onSave={editingEvent ? 
            (data) => handleUpdateEvent(editingEvent.id, data) : 
            handleCreateEvent
          }
          onClose={() => {
            setShowEventModal(false);
            setEditingEvent(null);
          }}
        />
      )}
    </div>
  );
}

export default App; 