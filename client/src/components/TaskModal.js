import React, { useState, useEffect } from 'react';
import { X, Target, Calendar } from 'lucide-react';
import { dataUtils } from '../services/api';
import './TaskModal.css';

// Implements requirement D11: Task creation with event association
const TaskModal = ({ task, project, events, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    eventId: ''
  });
  const [errors, setErrors] = useState({});

  // Initialize form data when editing
  useEffect(() => {
    if (task) {
      setFormData({
        name: task.name,
        eventId: task.eventId || ''
      });
    }
  }, [task]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear errors when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Task name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Task name must be at least 2 characters';
    } else if (formData.name.trim().length > 200) {
      newErrors.name = 'Task name must be less than 200 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      const taskData = {
        name: formData.name.trim(),
        projectId: project.id
      };

      // Only include eventId if one is selected
      if (formData.eventId) {
        taskData.eventId = formData.eventId;
      }

      onSave(taskData);
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Get selected event for event details
  const selectedEvent = events.find(e => e.id === formData.eventId);

  // Sort events by date for better UX
  const sortedEvents = [...events].sort((a, b) => new Date(a.date) - new Date(b.date));

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content task-modal">
        <div className="modal-header">
          <h3>{task ? 'Edit Task' : 'Create New Task'}</h3>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {/* Project info display */}
            <div className="project-info-display">
              <div className="project-info-label">Project:</div>
              <div className="project-info-content">
                <div 
                  className="project-color-indicator"
                  style={{ backgroundColor: project.color }}
                />
                <span className="project-name" style={{ color: project.color }}>
                  {project.name}
                </span>
              </div>
            </div>

            {/* Task name input */}
            <div className="form-group">
              <label htmlFor="taskName" className="form-label">
                Task Name *
              </label>
              <input
                id="taskName"
                name="name"
                type="text"
                className={`input ${errors.name ? 'input-error' : ''}`}
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Enter task description..."
                autoFocus
              />
              {errors.name && (
                <div className="form-error">{errors.name}</div>
              )}
            </div>

            {/* Event association (optional) */}
            <div className="form-group">
              <label htmlFor="taskEvent" className="form-label">
                Associate with Event (optional)
              </label>
              <select
                id="taskEvent"
                name="eventId"
                className="input"
                value={formData.eventId}
                onChange={handleInputChange}
              >
                <option value="">No specific event</option>
                {sortedEvents.map(event => (
                  <option key={event.id} value={event.id}>
                    {event.name} ({event.type}) - {dataUtils.formatDate(event.date, 'date-only')}
                  </option>
                ))}
              </select>
              <div className="form-help">
                Associating a task with an event helps track progress toward specific milestones or deadlines.
              </div>
            </div>

            {/* Event details (if selected) */}
            {selectedEvent && (
              <div className="selected-event-details">
                <div className="event-details-header">
                  <div className={`event-type-indicator ${selectedEvent.type}`}>
                    {selectedEvent.type === 'deadline' ? 'D' : 'M'}
                  </div>
                  <div>
                    <div className="event-details-name">{selectedEvent.name}</div>
                    <div className="event-details-date">
                      {dataUtils.formatDate(selectedEvent.date, 'datetime')}
                    </div>
                  </div>
                </div>
                <div className="event-details-description">
                  This task will be associated with this {selectedEvent.type} and will help track progress toward it.
                </div>
              </div>
            )}

            {/* No events message */}
            {events.length === 0 && (
              <div className="no-events-message">
                <Target size={16} />
                <span>
                  No events exist for this project yet. 
                  <br />
                  Create milestones or deadlines to associate tasks with specific goals.
                </span>
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {task ? 'Update Task' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskModal; 