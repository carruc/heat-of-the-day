import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { HexColorPicker } from 'react-colorful';
import './ProjectModal.css';

// Implements requirement D5: Project creation modal
const ProjectModal = ({ project, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    color: '#3b82f6'
  });
  const [errors, setErrors] = useState({});
  const [showColorPicker, setShowColorPicker] = useState(false);

  // Predefined color palette
  const colorPalette = [
    '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
    '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1',
    '#14b8a6', '#f43f5e', '#8b5a2b', '#64748b', '#dc2626'
  ];

  // Initialize form data when editing
  useEffect(() => {
    if (project) {
      setFormData({
        name: project.name,
        color: project.color
      });
    }
  }, [project]);

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

  const handleColorChange = (color) => {
    setFormData(prev => ({
      ...prev,
      color: color
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Project name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Project name must be at least 2 characters';
    } else if (formData.name.trim().length > 50) {
      newErrors.name = 'Project name must be less than 50 characters';
    }

    if (!formData.color) {
      newErrors.color = 'Project color is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSave({
        name: formData.name.trim(),
        color: formData.color
      });
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content project-modal">
        <div className="modal-header">
          <h3>{project ? 'Edit Project' : 'Create New Project'}</h3>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {/* Project name input */}
            <div className="form-group">
              <label htmlFor="projectName" className="form-label">
                Project Name *
              </label>
              <input
                id="projectName"
                name="name"
                type="text"
                className={`input ${errors.name ? 'input-error' : ''}`}
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Enter project name..."
                autoFocus
              />
              {errors.name && (
                <div className="form-error">{errors.name}</div>
              )}
            </div>

            {/* Color selection */}
            <div className="form-group">
              <label className="form-label">
                Project Color *
              </label>
              
              {/* Color palette */}
              <div className="color-palette">
                {colorPalette.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`color-swatch ${formData.color === color ? 'selected' : ''}`}
                    style={{ backgroundColor: color }}
                    onClick={() => handleColorChange(color)}
                    title={`Select ${color}`}
                  />
                ))}
                <button
                  type="button"
                  className={`color-swatch custom-color ${showColorPicker ? 'selected' : ''}`}
                  onClick={() => setShowColorPicker(!showColorPicker)}
                  title="Custom color"
                >
                  <span>+</span>
                </button>
              </div>

              {/* Custom color picker */}
              {showColorPicker && (
                <div className="color-picker-container">
                  <HexColorPicker 
                    color={formData.color} 
                    onChange={handleColorChange}
                  />
                  <div className="color-picker-info">
                    <input
                      type="text"
                      className="input color-input"
                      value={formData.color}
                      onChange={(e) => handleColorChange(e.target.value)}
                      placeholder="#000000"
                    />
                  </div>
                </div>
              )}

              {/* Color preview */}
              <div className="color-preview">
                <span className="color-preview-label">Selected color:</span>
                <div 
                  className="color-preview-swatch"
                  style={{ backgroundColor: formData.color }}
                />
                <span className="color-preview-value">{formData.color}</span>
              </div>

              {errors.color && (
                <div className="form-error">{errors.color}</div>
              )}
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {project ? 'Update Project' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProjectModal; 