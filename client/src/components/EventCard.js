import React, { useState, useEffect, useRef } from 'react';
import { X, Calendar, Clock } from 'lucide-react';
import './EventCard.css';

// Implements requirement D6: Event creation card (replacing modal)
const EventCard = ({ event, projects, onSave, onClose, position }) => {
  const [formData, setFormData] = useState({
    name: '',
    projectId: '',
    date: '',
    time: '',
    type: 'milestone'
  });
  const [errors, setErrors] = useState({});
  const [dateInput, setDateInput] = useState(''); // For dd/mm/yy format
  const cardRef = useRef(null);

  // Initialize form data when editing
  useEffect(() => {
    if (event) {
      const eventDate = new Date(event.date);
      const dateValue = eventDate.toISOString().split('T')[0];
      setFormData({
        name: event.name,
        projectId: event.projectId,
        date: dateValue,
        time: eventDate.toTimeString().slice(0, 5),
        type: event.type
      });
      // Set date input to dd/mm/yy format
      setDateInput(formatDateToShort(dateValue));
    } else {
      // Don't pre-fill with any date - leave empty for user input
      setFormData(prev => ({
        ...prev,
        date: '',
        time: '09:00', // Only default the time
        projectId: projects.length > 0 ? projects[0].id : ''
      }));
      // Clear date input
      setDateInput('');
    }
  }, [event, projects]);

  // Handle clicks outside the card to close it
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (cardRef.current && !cardRef.current.contains(event.target)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  // Handle escape key to close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

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

  // Handle date input in dd/mm/yy format
  const handleDateInputChange = (e) => {
    const value = e.target.value;
    setDateInput(value);
    
    // Try to parse the date
    const parsedDate = parseDateInput(value);
    if (parsedDate) {
      setFormData(prev => ({
        ...prev,
        date: parsedDate
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        date: ''
      }));
    }
    
    // Clear date error when user starts typing
    if (errors.date) {
      setErrors(prev => ({
        ...prev,
        date: null
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
      if (dateInput.trim()) {
        newErrors.date = 'Please enter a valid date in dd/mm/yy format (e.g., 25/12/24)';
      } else {
        newErrors.date = 'Date is required';
      }
    } else {
      const selectedDate = new Date(formData.date + 'T' + (formData.time || '00:00'));
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()); // Start of today
      const selectedDateOnly = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
      
      // Check if date is in the past (implement R9.3)
      if (selectedDate < now) {
        newErrors.date = 'Date cannot be in the past';
      }
      
      // Additional validation for deadlines - must be today or after today
      if (formData.type === 'deadline' && selectedDateOnly < today) {
        newErrors.date = 'Deadlines must be set for today or a future date';
      }
    }

    if (!formData.time) {
      newErrors.time = 'Time is required';
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

  // Helper function to format date from YYYY-MM-DD to dd/mm/yy
  const formatDateToShort = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear().toString().slice(-2); // Last 2 digits
    return `${day}/${month}/${year}`;
  };

  // Helper function to parse dd/mm/yy format
  const parseDateInput = (dateStr) => {
    const parts = dateStr.split(/[/.-]/);
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10);
      let year = parseInt(parts[2], 10);
      
      // Convert 2-digit year to 4-digit year
      if (year >= 0 && year <= 30) {
        year += 2000; // 00-30 -> 2000-2030
      } else if (year >= 31 && year <= 99) {
        year += 1900; // 31-99 -> 1931-1999
      } else if (year >= 1900) {
        // Already 4-digit year, keep as is
      } else {
        return null; // Invalid year
      }
      
      if (day >= 1 && day <= 31 && month >= 1 && month <= 12) {
        // Convert to YYYY-MM-DD format for internal use
        return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
      }
    }
    return null;
  };

  // Handle key press for date input to prevent invalid characters
  const handleDateKeyPress = (e) => {
    // Allow backspace, delete, tab, escape, enter
    if ([8, 9, 27, 13, 46].indexOf(e.keyCode) !== -1 ||
        // Allow Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
        (e.keyCode === 65 && e.ctrlKey === true) ||
        (e.keyCode === 67 && e.ctrlKey === true) ||
        (e.keyCode === 86 && e.ctrlKey === true) ||
        (e.keyCode === 88 && e.ctrlKey === true)) {
      return;
    }
    // Ensure that it is a number or slash and stop the keypress
    if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105) && e.keyCode !== 191) {
      e.preventDefault();
    }
  };

  // Format date for display in DD/MM/YYYY format (4-digit year)
  const formatDateLong = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  return (
    <div 
      className="event-card"
      ref={cardRef}
      style={{
        position: 'fixed',
        left: position?.x || 0,
        top: position?.y || 0,
        zIndex: 1000
      }}
    >
      <div className="event-card-header">
        <h3>{event ? 'Edit Event' : 'Create New Event'}</h3>
        <button className="btn btn-ghost btn-sm" onClick={onClose}>
          <X size={16} />
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="event-card-body">
          {/* Event type selection */}
          <div className="form-group">
            <label className="form-label">Event Type *</label>
            <div className="event-type-selector-inline">
              <label className="radio-option-inline">
                <input
                  type="radio"
                  name="type"
                  value="milestone"
                  checked={formData.type === 'milestone'}
                  onChange={handleInputChange}
                />
                <span className="radio-label-inline">
                  <span className="radio-icon milestone">M</span>
                  Milestone
                </span>
              </label>
              
              <label className="radio-option-inline">
                <input
                  type="radio"
                  name="type"
                  value="deadline"
                  checked={formData.type === 'deadline'}
                  onChange={handleInputChange}
                />
                <span className="radio-label-inline">
                  <span className="radio-icon deadline">D</span>
                  Deadline
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
            <label className="form-label">
              Date and Time *
            </label>
            {formData.type === 'deadline' && (
              <div style={{ marginBottom: 'var(--spacing-sm)', padding: '6px', backgroundColor: '#dbeafe', border: '1px solid #3b82f6', borderRadius: '4px', fontSize: '0.75rem', color: '#1e40af' }}>
                <strong>Deadline requirement:</strong> Must be set for today or a future date.
              </div>
            )}
            <div className="datetime-inputs">
              <div className="date-input-group">
                <Calendar size={16} className="input-icon" />
                <input
                  name="date"
                  type="text"
                  className={`input ${errors.date ? 'input-error' : ''}`}
                  value={dateInput}
                  onChange={handleDateInputChange}
                  onKeyDown={handleDateKeyPress}
                  placeholder="dd/mm/yy"
                  title="Enter date in dd/mm/yy format (e.g., 25/12/24)"
                  maxLength={8}
                />
                {formData.date && (
                  <span className="date-display" style={{ fontSize: '0.75rem', color: 'var(--success-color)', marginLeft: '8px' }}>
                    ✓ {formatDateLong(formData.date)}
                  </span>
                )}
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
        </div>

        <div className="event-card-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary">
            {event ? 'Update Event' : 'Create Event'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EventCard; 