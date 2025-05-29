import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock } from 'lucide-react';
import { dataUtils } from '../services/api';
import './EventModal.css';

// Implements requirement D6: Event creation modal
const EventModal = ({ event, projects, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    projectId: '',
    date: '',
    time: '',
    type: 'milestone'
  });
  const [errors, setErrors] = useState({});

  // Initialize form data when editing
  useEffect(() => {
    if (event) {
      const eventDate = new Date(event.date);
      setFormData({
        name: event.name,
        projectId: event.projectId,
        date: eventDate.toISOString().split('T')[0],
        time: eventDate.toTimeString().slice(0, 5),
        type: event.type
      });
    } else if (projects.length > 0) {
      // Default to first project if creating new event
      setFormData(prev => ({
        ...prev,
        projectId: projects[0].id
      }));
    }
  }, [event, projects]);

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
      newErrors.name = 'Event name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Event name must be at least 2 characters';
    } else if (formData.name.trim().length > 100) {
      newErrors.name = 'Event name must be less than 100 characters';
    }

    if (!formData.projectId) {
      newErrors.projectId = 'Please select a project';
    }

    if (!formData.date) {
      newErrors.date = 'Date is required';
    } else {
      const selectedDate = new Date(formData.date + 'T' + (formData.time || '00:00'));
      const now = new Date();
      
      // Check if date is in the past (implement R9.3)
      if (selectedDate < now) {
        newErrors.date = 'Date cannot be in the past';
      }
    }

    if (!formData.time) {
      newErrors.time = 'Time is required';
    }

    // Check deadline constraint (implement R4)
    if (formData.type === 'deadline' && formData.projectId) {
      const project = projects.find(p => p.id === formData.projectId);
      if (project) {
        // This would need to be checked against existing events in the parent component
        // For now, we'll let the backend handle this validation
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      const eventDateTime = new Date(formData.date + 'T' + formData.time);
      
      onSave({
        name: formData.name.trim(),
        projectId: formData.projectId,
        date: eventDateTime.toISOString(),
        type: formData.type
      });
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Get selected project for preview
  const selectedProject = projects.find(p => p.id === formData.projectId);

  // Format date for display
  const formatDateForDisplay = () => {
    if (formData.date && formData.time) {
      const eventDate = new Date(formData.date + 'T' + formData.time);
      return dataUtils.formatDate(eventDate, 'datetime');
    }
    return 'Select date and time';
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content event-modal">
        <div className="modal-header">
          <h3>{event ? 'Edit Event' : 'Create New Event'}</h3>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {/* Event type selection */}
            <div className="form-group">
              <label className="form-label">Event Type *</label>
              <div className="event-type-selector">
                <label className="radio-option">
                  <input
                    type="radio"
                    name="type"
                    value="milestone"
                    checked={formData.type === 'milestone'}
                    onChange={handleInputChange}
                  />
                  <span className="radio-label">
                    <span className="radio-icon milestone">M</span>
                    Milestone
                  </span>
                  <span className="radio-description">
                    A significant point or achievement in your project
                  </span>
                </label>
                
                <label className="radio-option">
                  <input
                    type="radio"
                    name="type"
                    value="deadline"
                    checked={formData.type === 'deadline'}
                    onChange={handleInputChange}
                  />
                  <span className="radio-label">
                    <span className="radio-icon deadline">D</span>
                    Deadline
                  </span>
                  <span className="radio-description">
                    The final date for project completion
                  </span>
                </label>
              </div>
            </div>

            {/* Project selection */}
            <div className="form-group">
              <label htmlFor="eventProject" className="form-label">
                Project *
              </label>
              <select
                id="eventProject"
                name="projectId"
                className={`input ${errors.projectId ? 'input-error' : ''}`}
                value={formData.projectId}
                onChange={handleInputChange}
              >
                <option value="">Select a project...</option>
                {projects.map(project => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
              {errors.projectId && (
                <div className="form-error">{errors.projectId}</div>
              )}
            </div>

            {/* Event name input */}
            <div className="form-group">
              <label htmlFor="eventName" className="form-label">
                Event Name *
              </label>
              <input
                id="eventName"
                name="name"
                type="text"
                className={`input ${errors.name ? 'input-error' : ''}`}
                value={formData.name}
                onChange={handleInputChange}
                placeholder={`Enter ${formData.type} name...`}
                autoFocus
              />
              {errors.name && (
                <div className="form-error">{errors.name}</div>
              )}
            </div>

            {/* Date and time inputs */}
            <div className="form-group">
              <label className="form-label">Date and Time *</label>
              <div className="datetime-inputs">
                <div className="date-input-group">
                  <Calendar size={16} className="input-icon" />
                  <input
                    name="date"
                    type="date"
                    className={`input ${errors.date ? 'input-error' : ''}`}
                    value={formData.date}
                    onChange={handleInputChange}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                
                <div className="time-input-group">
                  <Clock size={16} className="input-icon" />
                  <input
                    name="time"
                    type="time"
                    className={`input ${errors.time ? 'input-error' : ''}`}
                    value={formData.time}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              {(errors.date || errors.time) && (
                <div className="form-error">
                  {errors.date || errors.time}
                </div>
              )}
            </div>

            {/* Event preview */}
            <div className="event-preview">
              <div className="preview-label">Preview:</div>
              <div className="preview-event">
                <div 
                  className={`event-type-badge ${formData.type}`}
                  style={{ 
                    backgroundColor: selectedProject?.color || '#6b7280' 
                  }}
                >
                  {formData.type}
                </div>
                <div className="preview-event-details">
                  <div className="preview-event-name">
                    {formData.name || `${formData.type} name`}
                  </div>
                  <div className="preview-event-project">
                    {selectedProject ? (
                      <span style={{ color: selectedProject.color }}>
                        {selectedProject.name}
                      </span>
                    ) : (
                      'Select a project'
                    )}
                  </div>
                  <div className="preview-event-datetime">
                    {formatDateForDisplay()}
                  </div>
                </div>
              </div>
            </div>

            {/* Warning for deadlines */}
            {formData.type === 'deadline' && (
              <div className="warning-message">
                <strong>Note:</strong> Each project can only have one deadline. 
                If this project already has a deadline, it will be replaced.
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {event ? 'Update Event' : 'Create Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EventModal; 