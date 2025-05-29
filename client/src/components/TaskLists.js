import React, { useState, useMemo } from 'react';
import { Plus, Check, X, ChevronDown, ChevronRight, Eye, EyeOff, Edit, Trash2 } from 'lucide-react';
import { dataUtils } from '../services/api';
import TaskModal from './TaskModal';
import './TaskLists.css';

// Implements requirements R16, D9-D12
const TaskLists = ({
  projects,
  tasks,
  events,
  onTaskCreate,
  onTaskUpdate,
  onTaskDelete,
  onTaskToggle,
  onProjectUpdate
}) => {
  const [hiddenProjects, setHiddenProjects] = useState(new Set());
  const [expandedProjects, setExpandedProjects] = useState(new Set());
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [editingTask, setEditingTask] = useState(null);

  // Sort projects and filter visible ones
  const visibleProjects = useMemo(() => {
    return dataUtils.sortProjects(projects).filter(p => !hiddenProjects.has(p.id));
  }, [projects, hiddenProjects]);

  const hiddenProjectsList = useMemo(() => {
    return projects.filter(p => hiddenProjects.has(p.id));
  }, [projects, hiddenProjects]);

  // Toggle project visibility - Implements D12
  const handleToggleHidden = (projectId) => {
    setHiddenProjects(prev => {
      const newSet = new Set(prev);
      if (newSet.has(projectId)) {
        newSet.delete(projectId);
      } else {
        newSet.add(projectId);
      }
      return newSet;
    });
  };

  // Toggle project expansion - Implements D10
  const handleToggleExpanded = (projectId) => {
    setExpandedProjects(prev => {
      const newSet = new Set(prev);
      if (newSet.has(projectId)) {
        newSet.delete(projectId);
      } else {
        newSet.add(projectId);
      }
      return newSet;
    });
  };

  // Handle task creation - Implements D9, D11
  const handleCreateTask = (projectId) => {
    setSelectedProject(projects.find(p => p.id === projectId));
    setShowTaskModal(true);
  };

  // Handle task editing
  const handleEditTask = (task) => {
    setEditingTask(task);
    setSelectedProject(projects.find(p => p.id === task.projectId));
    setShowTaskModal(true);
  };

  // Handle task modal save
  const handleTaskModalSave = async (taskData) => {
    try {
      if (editingTask) {
        await onTaskUpdate(editingTask.id, taskData);
      } else {
        await onTaskCreate(taskData);
      }
      setShowTaskModal(false);
      setSelectedProject(null);
      setEditingTask(null);
    } catch (error) {
      console.error('Error saving task:', error);
    }
  };

  // Handle task modal close
  const handleTaskModalClose = () => {
    setShowTaskModal(false);
    setSelectedProject(null);
    setEditingTask(null);
  };

  return (
    <div className="task-lists">
      <div className="task-lists-header">
        <h2>Project Tasks</h2>
        <p className="text-secondary">Manage your project tasks and track progress</p>
      </div>

      <div className="project-cards-grid">
        {visibleProjects.map(project => (
          <ProjectTaskCard
            key={project.id}
            project={project}
            tasks={dataUtils.getProjectTasks(tasks, project.id)}
            events={dataUtils.getProjectEvents(events, project.id)}
            isExpanded={expandedProjects.has(project.id)}
            onToggleExpanded={() => handleToggleExpanded(project.id)}
            onToggleHidden={() => handleToggleHidden(project.id)}
            onCreateTask={() => handleCreateTask(project.id)}
            onEditTask={handleEditTask}
            onTaskToggle={onTaskToggle}
            onTaskDelete={onTaskDelete}
          />
        ))}
      </div>

      {/* Hidden projects bar - Implements D12 */}
      {hiddenProjectsList.length > 0 && (
        <div className="hidden-projects-bar">
          <span className="text-muted">Hidden project task lists:</span>
          {hiddenProjectsList.map(project => (
            <button
              key={project.id}
              className="btn btn-ghost btn-sm"
              onClick={() => handleToggleHidden(project.id)}
              style={{ color: project.color }}
            >
              {project.name}
            </button>
          ))}
        </div>
      )}

      {/* Task creation/editing modal */}
      {showTaskModal && selectedProject && (
        <TaskModal
          task={editingTask}
          project={selectedProject}
          events={dataUtils.getProjectEvents(events, selectedProject.id)}
          onSave={handleTaskModalSave}
          onClose={handleTaskModalClose}
        />
      )}
    </div>
  );
};

// Individual project task card component - Implements D9-D11
const ProjectTaskCard = ({
  project,
  tasks,
  events,
  isExpanded,
  onToggleExpanded,
  onToggleHidden,
  onCreateTask,
  onEditTask,
  onTaskToggle,
  onTaskDelete
}) => {
  // Separate completed and uncompleted tasks
  const uncompletedTasks = tasks.filter(t => !t.completed);
  const completedTasks = tasks.filter(t => t.completed);
  const totalTasks = tasks.length;
  const completedCount = completedTasks.length;
  const progressPercentage = totalTasks > 0 ? (completedCount / totalTasks) * 100 : 0;

  // Get task with event info
  const getTaskWithEvent = (task) => {
    const event = task.eventId ? events.find(e => e.id === task.eventId) : null;
    return { ...task, event };
  };

  return (
    <div className="project-task-card" style={{ borderTopColor: project.color }}>
      {/* Card header */}
      <div className="card-header">
        <div className="project-card-header">
          <div className="project-card-info">
            <h3 className="project-card-title" style={{ color: project.color }}>
              {project.name}
            </h3>
            <div className="project-card-stats">
              <span className="tasks-count">
                {completedCount}/{totalTasks} tasks completed
              </span>
              {events.length > 0 && (
                <span className="events-count text-muted">
                  {events.length} event{events.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>
          
          <div className="project-card-actions">
            <button
              className="btn btn-ghost btn-sm"
              onClick={onToggleExpanded}
              title={isExpanded ? "Show only incomplete tasks" : "Show all tasks"}
            >
              {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>
            <button
              className="btn btn-ghost btn-sm"
              onClick={onToggleHidden}
              title="Hide this task list"
            >
              <EyeOff size={16} />
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="progress-container">
          <div className="progress-bar">
            <div 
              className="progress-fill"
              style={{ 
                width: `${progressPercentage}%`,
                backgroundColor: project.color
              }}
            />
          </div>
          <span className="progress-text">
            {Math.round(progressPercentage)}%
          </span>
        </div>
      </div>

      {/* Task list - Implements D10 */}
      <div className="card-body">
        {/* Uncompleted tasks - always shown */}
        <div className="task-section">
          {uncompletedTasks.length > 0 ? (
            <div className="task-list">
              {uncompletedTasks.map(task => (
                <TaskItem
                  key={task.id}
                  task={getTaskWithEvent(task)}
                  onToggle={() => onTaskToggle(task.id)}
                  onEdit={() => onEditTask(task)}
                  onDelete={() => onTaskDelete(task.id)}
                />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <p className="text-muted">No pending tasks</p>
            </div>
          )}
        </div>

        {/* Completed tasks - shown when expanded - Implements D10 */}
        {isExpanded && completedTasks.length > 0 && (
          <div className="task-section completed-section">
            <div className="section-divider">
              <span className="text-muted">Completed Tasks</span>
            </div>
            <div className="task-list">
              {completedTasks.map(task => (
                <TaskItem
                  key={task.id}
                  task={getTaskWithEvent(task)}
                  onToggle={() => onTaskToggle(task.id)}
                  onEdit={() => onEditTask(task)}
                  onDelete={() => onTaskDelete(task.id)}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Add task button - Implements D9 */}
      <div className="card-footer">
        <button
          className="btn btn-ghost w-full"
          onClick={onCreateTask}
        >
          <Plus size={16} />
          Add Task
        </button>
      </div>
    </div>
  );
};

// Individual task item component - Implements R13.1, R13.2
const TaskItem = ({ task, onToggle, onEdit, onDelete }) => {
  const [showActions, setShowActions] = useState(false);

  const handleToggle = (e) => {
    e.stopPropagation();
    onToggle();
  };

  const handleEdit = (e) => {
    e.stopPropagation();
    onEdit();
    setShowActions(false);
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this task?')) {
      onDelete();
    }
    setShowActions(false);
  };

  return (
    <div 
      className={`task-item ${task.completed ? 'completed' : ''}`}
      onClick={() => setShowActions(!showActions)}
    >
      <div className="task-main">
        <button
          className="task-checkbox"
          onClick={handleToggle}
          title={task.completed ? "Mark as incomplete" : "Mark as complete"}
        >
          {task.completed ? (
            <Check size={14} className="check-icon" />
          ) : (
            <div className="checkbox-empty" />
          )}
        </button>

        <div className="task-content">
          <span className={`task-name ${task.completed ? 'completed-text' : ''}`}>
            {task.name}
          </span>
          {task.event && (
            <span className={`task-event-badge ${task.event.type}`}>
              {task.event.name}
            </span>
          )}
        </div>

        <div className="task-actions">
          {showActions && (
            <>
              <button
                className="btn btn-ghost btn-sm"
                onClick={handleEdit}
                title="Edit task"
              >
                <Edit size={12} />
              </button>
              <button
                className="btn btn-ghost btn-sm"
                onClick={handleDelete}
                title="Delete task"
              >
                <Trash2 size={12} />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskLists; 