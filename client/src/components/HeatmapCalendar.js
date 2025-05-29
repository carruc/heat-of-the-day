import React, { useState, useEffect, useMemo } from 'react';
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Eye, EyeOff, MoreVertical, Edit, Trash2 } from 'lucide-react';
import { dataUtils } from '../services/api';
import './HeatmapCalendar.css';

// Implements requirements R14, R15, D1-D8
const HeatmapCalendar = ({
  projects,
  tasks,
  events,
  timeScale,
  currentDate,
  onTimeScaleChange,
  onCurrentDateChange,
  onProjectUpdate,
  onProjectDelete,
  onProjectEdit,
  onEventEdit,
  onEventDelete,
  onNewProject,
  onNewEvent
}) => {
  const [daysToShow, setDaysToShow] = useState(30);
  const [hoveredCell, setHoveredCell] = useState(null);
  const [contextMenu, setContextMenu] = useState(null);

  // Generate date range for the heatmap - Implements D1.1, D4
  const dateRange = useMemo(() => {
    return dataUtils.generateDateRange(currentDate, timeScale, daysToShow);
  }, [currentDate, timeScale, daysToShow]);

  // Sort and filter projects - Implements D7, D8
  const visibleProjects = useMemo(() => {
    return dataUtils.getVisibleProjects(dataUtils.sortProjects(projects));
  }, [projects]);

  const hiddenProjects = useMemo(() => {
    return dataUtils.getHiddenProjects(projects);
  }, [projects]);

  // Calculate heatmap data - Implements D2
  const heatmapData = useMemo(() => {
    const data = {};
    
    projects.forEach(project => {
      data[project.id] = {};
      dateRange.forEach(date => {
        const completedCount = dataUtils.getCompletedTasksCount(tasks, project.id, date);
        const intensity = dataUtils.getHeatmapIntensity(completedCount);
        const eventsForDate = dataUtils.getEventsForDate(
          dataUtils.getProjectEvents(events, project.id), 
          date
        );
        
        data[project.id][date.toISOString()] = {
          completedTasks: completedCount,
          intensity,
          events: eventsForDate,
          color: dataUtils.getHeatmapCellColor(project.color, intensity)
        };
      });
    });
    
    return data;
  }, [projects, tasks, events, dateRange]);

  // Handle project order changes - Implements D8
  const handleMoveProject = async (projectId, direction) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;

    const currentOrder = project.order;
    const newOrder = direction === 'up' ? currentOrder - 1 : currentOrder + 1;
    
    // Find the project to swap with
    const targetProject = projects.find(p => p.order === newOrder);
    if (!targetProject) return;

    // Swap orders
    await onProjectUpdate(projectId, { order: newOrder });
    await onProjectUpdate(targetProject.id, { order: currentOrder });
  };

  // Handle project visibility toggle - Implements D7
  const handleToggleHidden = async (projectId) => {
    const project = projects.find(p => p.id === projectId);
    if (project) {
      await onProjectUpdate(projectId, { hidden: !project.hidden });
    }
  };

  // Handle project collapse toggle - Implements D3
  const handleToggleCollapsed = async (projectId) => {
    const project = projects.find(p => p.id === projectId);
    if (project) {
      await onProjectUpdate(projectId, { collapsed: !project.collapsed });
    }
  };

  // Navigate calendar - Implements D4
  const navigateCalendar = (direction) => {
    const newDate = new Date(currentDate);
    const days = direction === 'left' ? -timeScale * 7 : timeScale * 7;
    newDate.setDate(newDate.getDate() + days);
    onCurrentDateChange(newDate);
  };

  // Handle context menu
  const handleCellContextMenu = (e, project, date) => {
    e.preventDefault();
    const cellEvents = heatmapData[project.id]?.[date.toISOString()]?.events || [];
    
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      project,
      date,
      events: cellEvents
    });
  };

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setContextMenu(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Get month headers - Implements D1.2
  const getMonthHeaders = () => {
    const headers = [];
    let currentMonth = null;
    let monthStart = 0;
    
    dateRange.forEach((date, index) => {
      const month = date.getMonth();
      const year = date.getFullYear();
      const monthKey = `${year}-${month}`;
      
      if (currentMonth !== monthKey) {
        if (currentMonth !== null) {
          headers.push({
            month: new Date(currentMonth.split('-')[0], currentMonth.split('-')[1]).toLocaleDateString('en-US', { month: 'short' }),
            start: monthStart,
            width: index - monthStart
          });
        }
        currentMonth = monthKey;
        monthStart = index;
      }
    });
    
    // Add the last month
    if (currentMonth !== null) {
      headers.push({
        month: new Date(currentMonth.split('-')[0], currentMonth.split('-')[1]).toLocaleDateString('en-US', { month: 'short' }),
        start: monthStart,
        width: dateRange.length - monthStart
      });
    }
    
    return headers;
  };

  const monthHeaders = getMonthHeaders();

  return (
    <div className="heatmap-calendar">
      {/* Header with controls - Implements R15, D1.3 */}
      <div className="heatmap-header">
        <div className="heatmap-controls">
          <button 
            className="btn btn-ghost"
            onClick={() => navigateCalendar('left')}
            title="Previous week"
          >
            <ChevronLeft size={16} />
          </button>
          
          <button 
            className="btn btn-ghost"
            onClick={() => onCurrentDateChange(new Date())}
            title="Go to today"
          >
            Today
          </button>
          
          <button 
            className="btn btn-ghost"
            onClick={() => navigateCalendar('right')}
            title="Next week"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        <div className="timescale-control">
          <label className="form-label">
            Time scale (days per cell):
            <input
              type="number"
              min="1"
              max="7"
              value={timeScale}
              onChange={(e) => onTimeScaleChange(parseInt(e.target.value) || 1)}
              className="input"
              style={{ width: '80px', marginLeft: '8px' }}
            />
          </label>
        </div>
      </div>

      {/* Calendar grid */}
      <div className="heatmap-grid">
        {/* Month headers - Implements D1.2 */}
        <div className="month-headers">
          <div className="project-column-header"></div>
          {monthHeaders.map((header, index) => (
            <div
              key={index}
              className="month-header"
              style={{
                gridColumn: `span ${header.width}`,
                textAlign: 'center'
              }}
            >
              {header.month}
            </div>
          ))}
        </div>

        {/* Date headers */}
        <div className="date-headers">
          <div className="project-column-header">Projects</div>
          {dateRange.map((date, index) => {
            const today = new Date();
            const isPastDate = date < today && date.toDateString() !== today.toDateString();
            
            return (
              <div key={index} className={`date-header ${isPastDate ? 'past-date' : ''}`}>
                <span className="date-day">{date.getDate()}</span>
                <span className="date-weekday">
                  {date.toLocaleDateString('en-US', { weekday: 'short' })}
                </span>
              </div>
            );
          })}
        </div>

        {/* Project rows - Implements D1.1, D3, D7, D8 */}
        {visibleProjects.map((project) => (
          <ProjectRow
            key={project.id}
            project={project}
            dateRange={dateRange}
            heatmapData={heatmapData[project.id] || {}}
            onToggleCollapsed={() => handleToggleCollapsed(project.id)}
            onMoveUp={() => handleMoveProject(project.id, 'up')}
            onMoveDown={() => handleMoveProject(project.id, 'down')}
            onToggleHidden={() => handleToggleHidden(project.id)}
            onEdit={() => onProjectEdit(project)}
            onDelete={() => onProjectDelete(project.id)}
            onCellContextMenu={handleCellContextMenu}
            onCellHover={setHoveredCell}
            events={dataUtils.getProjectEvents(events, project.id)}
          />
        ))}

        {/* Hidden projects bar - Implements D7 */}
        {hiddenProjects.length > 0 && (
          <div className="hidden-projects-bar">
            <span className="text-muted">Hidden projects:</span>
            {hiddenProjects.map(project => (
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

        {/* Action buttons */}
        <div className="heatmap-action-buttons">
          <button 
            className="btn btn-primary btn-project"
            onClick={onNewProject}
          >
            + New Project
          </button>
          <button 
            className="btn btn-secondary btn-event"
            onClick={onNewEvent}
          >
            + New Event
          </button>
        </div>
      </div>

      {/* Context menu for cells */}
      {contextMenu && (
        <ContextMenu
          contextMenu={contextMenu}
          onEventEdit={onEventEdit}
          onEventDelete={onEventDelete}
          onClose={() => setContextMenu(null)}
        />
      )}

      {/* Tooltip for hovered cell */}
      {hoveredCell && (
        <CellTooltip hoveredCell={hoveredCell} />
      )}
    </div>
  );
};

// Project row component - Implements D3, D8
const ProjectRow = ({
  project,
  dateRange,
  heatmapData,
  onToggleCollapsed,
  onMoveUp,
  onMoveDown,
  onToggleHidden,
  onEdit,
  onDelete,
  onCellContextMenu,
  onCellHover,
  events
}) => {
  const [showActions, setShowActions] = useState(false);

  return (
    <>
      <div className="project-row">
        {/* Project header */}
        <div 
          className="project-header"
          style={{ borderLeftColor: project.color }}
        >
          {/* Collapse/expand toggle on the left */}
          <div className="project-controls">
            <button
              className="btn-ghost btn-sm"
              onClick={onToggleCollapsed}
              title={project.collapsed ? "Expand" : "Collapse"}
            >
              {project.collapsed ? '▶' : '▼'}
            </button>
          </div>

          {/* Project info in the center */}
          <div className="project-info">
            <div className="project-main-info">
              <span className="project-name" title={project.name}>{project.name}</span>
              {!project.collapsed && events.length > 0 && (
                <span className="project-events-count text-muted">
                  {events.length} event{events.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>
            
            {/* Move buttons - only visible when expanded */}
            {!project.collapsed && (
              <div className="project-move-controls">
                <button 
                  className="btn-ghost btn-sm"
                  onClick={onMoveUp}
                  title="Move up"
                >
                  <ChevronUp size={12} />
                </button>
                <button 
                  className="btn-ghost btn-sm"
                  onClick={onMoveDown}
                  title="Move down"
                >
                  <ChevronDown size={12} />
                </button>
              </div>
            )}
          </div>

          {/* Three dots menu on the right */}
          <div className="project-actions">
            <button
              className="btn-ghost btn-sm"
              onClick={() => setShowActions(!showActions)}
            >
              <MoreVertical size={14} />
            </button>
            
            {showActions && (
              <div className="project-actions-menu">
                <button onClick={onEdit} className="btn-ghost btn-sm">
                  <Edit size={12} /> Edit
                </button>
                <button 
                  onClick={() => onToggleHidden()} 
                  className="btn-ghost btn-sm"
                >
                  <EyeOff size={12} /> Hide
                </button>
                <button onClick={onDelete} className="btn-ghost btn-sm text-error">
                  <Trash2 size={12} /> Delete
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Heatmap cells - Implements D2, D3 */}
        {dateRange.map((date, dateIndex) => {
          const cellData = heatmapData[date.toISOString()] || {
            completedTasks: 0,
            intensity: 0,
            events: [],
            color: 'transparent'
          };

          const hasDeadline = cellData.events.some(e => e.type === 'deadline');
          const hasMilestone = cellData.events.some(e => e.type === 'milestone');
          const today = new Date();
          const isPastDate = date < today && date.toDateString() !== today.toDateString();

          return (
            <div
              key={dateIndex}
              className={`heatmap-cell ${hasDeadline ? 'has-deadline' : ''} ${hasMilestone ? 'has-milestone' : ''} ${isPastDate ? 'past-date' : ''}`}
              style={{ backgroundColor: cellData.color }}
              onContextMenu={(e) => onCellContextMenu(e, project, date)}
              onMouseEnter={() => onCellHover({
                project,
                date,
                data: cellData
              })}
              onMouseLeave={() => onCellHover(null)}
              title={`${project.name} - ${dataUtils.formatDate(date)}: ${cellData.completedTasks} tasks completed`}
            >
              {/* Event indicators - Implements D3 */}
              {!project.collapsed && cellData.events.map(event => (
                <div
                  key={event.id}
                  className={`event-indicator ${event.type}`}
                  title={`${event.type}: ${event.name}`}
                >
                  {event.name.substring(0, 1)}
                </div>
              ))}
            </div>
          );
        })}
      </div>

      {/* Expanded view with event names - Implements D3 */}
      {!project.collapsed && events.length > 0 && (
        <div className="project-events-row">
          <div className="project-events-header">
            <span className="text-muted text-sm">Events</span>
          </div>
          {dateRange.map((date, dateIndex) => {
            const cellData = heatmapData[date.toISOString()] || { events: [] };
            const today = new Date();
            const isPastDate = date < today && date.toDateString() !== today.toDateString();
            
            return (
              <div key={dateIndex} className={`event-names-cell ${isPastDate ? 'past-date' : ''}`}>
                {cellData.events.map(event => (
                  <div
                    key={event.id}
                    className={`event-name ${event.type}`}
                    onClick={() => onEdit && onEdit(event)}
                  >
                    {event.name}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
};

// Context menu component
const ContextMenu = ({ contextMenu, onEventEdit, onEventDelete, onClose }) => {
  const { x, y, project, date, events } = contextMenu;

  return (
    <div
      className="context-menu"
      style={{ 
        position: 'fixed', 
        left: x, 
        top: y,
        zIndex: 1000
      }}
    >
      <div className="context-menu-header">
        <strong>{project.name}</strong>
        <br />
        <span className="text-muted">{dataUtils.formatDate(date, 'long')}</span>
      </div>
      
      {events.length > 0 && (
        <div className="context-menu-section">
          <div className="context-menu-label">Events:</div>
          {events.map(event => (
            <div key={event.id} className="context-menu-item">
              <span className={`event-type-badge ${event.type}`}>
                {event.type}
              </span>
              <span>{event.name}</span>
              <div className="event-actions">
                <button
                  className="btn-ghost btn-sm"
                  onClick={() => {
                    onEventEdit(event);
                    onClose();
                  }}
                >
                  <Edit size={10} />
                </button>
                <button
                  className="btn-ghost btn-sm"
                  onClick={() => {
                    onEventDelete(event.id);
                    onClose();
                  }}
                >
                  <Trash2 size={10} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Cell tooltip component
const CellTooltip = ({ hoveredCell }) => {
  const { project, date, data } = hoveredCell;

  return (
    <div className="cell-tooltip">
      <div className="tooltip-header">
        <strong style={{ color: project.color }}>{project.name}</strong>
        <span className="text-muted">{dataUtils.formatDate(date, 'long')}</span>
      </div>
      <div className="tooltip-content">
        <div>Tasks completed: {data.completedTasks}</div>
        {data.events.length > 0 && (
          <div>
            Events: {data.events.map(e => e.name).join(', ')}
          </div>
        )}
      </div>
    </div>
  );
};

export default HeatmapCalendar; 