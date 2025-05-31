import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight, EyeOff } from 'lucide-react';
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
  const [daysToShow, setDaysToShow] = useState(51); // Simple fixed value for now
  const [hoveredCell, setHoveredCell] = useState(null);
  const [contextMenu, setContextMenu] = useState(null);
  const calendarRef = useRef(null);

  // Calculate how many days can fit in the visible area
  // Th Iis determines the number of columns that will be visible without horizontal scrolling
  const calculateDaysThatFit = useCallback(() => {
    if (!calendarRef.current) return 52; // Fallback
    
    // 1. Get date-headers element
    const dateHeadersDiv = calendarRef.current.querySelector('.date-headers');
    if (!dateHeadersDiv) return 52; // Fallback
    
    // 2. Get date-headers width and subtract project column width
    const dateHeadersWidth = dateHeadersDiv.offsetWidth;
    const projectColumnWidth = window.innerWidth <= 768 ? 160 : window.innerWidth <= 1024 ? 200 : 250;
    
    // 3. Calculate available space for date columns
    const availableSpace = dateHeadersWidth - projectColumnWidth;
    
    // 4. Divide available space by minimum column width (32px)
    const minColumnWidth = 32;
    const maxColumns = availableSpace / minColumnWidth;
    
    // 5. Take the rounded ceiling of that number
    const result = Math.ceil(maxColumns);
    
    // 6. Return that number
    return Math.max(result, 20); // Ensure minimum of 20 columns
  }, []);

  // Use the calculated number of days that fit in the visible area
  const visibleDays = calculateDaysThatFit();

  // Update daysToShow when the calculation changes
  useEffect(() => {
    const newDaysToShow = calculateDaysThatFit();
    setDaysToShow(newDaysToShow);
  }, [calculateDaysThatFit]);

  // Recalculate on window resize
  useEffect(() => {
    const handleResize = () => {
      setTimeout(() => {
        const newDaysToShow = calculateDaysThatFit();
        setDaysToShow(newDaysToShow);
      }, 100);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [calculateDaysThatFit]);

  // Create the grid template for exactly the number of visible days
  const gridTemplateColumns = `250px repeat(${visibleDays}, minmax(20px, 32px))`;

  // Generate date range for the heatmap - Implements D1.1, D4
  const dateRange = useMemo(() => {
    // Custom date range generation for fixed number of columns
    const generateFixedColumnDateRange = (centerDate, timeScale, numColumns) => {
      const dates = [];
      const center = new Date(centerDate);
      
      // Start from 7 days before the center date
      const startDate = new Date(center);
      startDate.setDate(center.getDate() - 7);
      
      // Generate exactly numColumns dates, each representing timeScale days
      for (let i = 0; i < numColumns; i++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + (i * timeScale));
        dates.push(new Date(date));
      }
      
      return dates;
    };
    
    return generateFixedColumnDateRange(currentDate, timeScale, visibleDays);
  }, [currentDate, timeScale, visibleDays]);

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
    const potentialHeaders = [];
    
    dateRange.forEach((date, index) => {
      // For each cell, check if the 1st of any month falls within its timeScale period
      const cellStartDate = new Date(date);
      const cellEndDate = new Date(date);
      cellEndDate.setDate(cellStartDate.getDate() + timeScale - 1);
      
      // Check if the 1st of any month falls within this cell's date range
      let monthStartInCell = null;
      
      // Check each day within the cell's timeScale period
      for (let dayOffset = 0; dayOffset < timeScale; dayOffset++) {
        const checkDate = new Date(cellStartDate);
        checkDate.setDate(cellStartDate.getDate() + dayOffset);
        
        if (checkDate.getDate() === 1) {
          monthStartInCell = checkDate;
          break;
        }
      }
      
      // If we found a month start within this cell, add to potential headers
      if (monthStartInCell) {
        const monthYear = `${monthStartInCell.getFullYear()}-${monthStartInCell.getMonth()}`;
        
        // Make sure we haven't already added this month
        if (!potentialHeaders.some(h => h.monthYear === monthYear)) {
          const monthName = monthStartInCell.toLocaleDateString('en-US', { month: 'short' });
          
          potentialHeaders.push({
            month: monthName,
            monthYear: monthYear,
            position: index + 1, // +1 to account for project column
            year: monthStartInCell.getFullYear(),
            date: new Date(monthStartInCell),
            isJanuary: monthName === 'Jan'
          });
        }
      }
      
      // Special case: if this is the first cell and no month header was added yet,
      // add the current month to avoid empty headers
      if (index === 0 && potentialHeaders.length === 0) {
        const monthName = date.toLocaleDateString('en-US', { month: 'short' });
        const monthYear = `${date.getFullYear()}-${date.getMonth()}`;
        
        potentialHeaders.push({
          month: monthName,
          monthYear: monthYear,
          position: index + 1,
          year: date.getFullYear(),
          date: new Date(date),
          isJanuary: monthName === 'Jan'
        });
      }
    });
    
    // Filter headers to ensure at least 3 cells apart, prioritizing more recent months
    const filteredHeaders = [];
    
    // Sort by position (chronological order)
    const sortedHeaders = potentialHeaders.sort((a, b) => a.position - b.position);
    
    for (let i = 0; i < sortedHeaders.length; i++) {
      const currentHeader = sortedHeaders[i];
      let shouldInclude = true;
      
      // Check if this header is too close to any already included header
      for (const includedHeader of filteredHeaders) {
        const distance = Math.abs(currentHeader.position - includedHeader.position);
        
        if (distance < 3) {
          // Too close - prioritize the more recent one
          if (currentHeader.date > includedHeader.date) {
            // Remove the older header and include the current one
            const indexToRemove = filteredHeaders.findIndex(h => h.monthYear === includedHeader.monthYear);
            filteredHeaders.splice(indexToRemove, 1);
          } else {
            // Keep the existing newer header, skip current one
            shouldInclude = false;
            break;
          }
        }
      }
      
      if (shouldInclude) {
        filteredHeaders.push(currentHeader);
      }
    }
    
    return filteredHeaders;
  };

  const monthHeaders = getMonthHeaders();

  return (
    <div className="heatmap-calendar" ref={calendarRef}>
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
        <div className="month-headers" style={{ gridTemplateColumns }}>
          <div className="project-column-header"></div>
          {dateRange.map((date, index) => {
            const monthHeader = monthHeaders.find(h => h.position === index + 1);
            return (
              <div key={index} className={`month-header ${monthHeader?.isJanuary ? 'january-header' : ''}`}>
                {monthHeader && (
                  <>
                    {monthHeader.isJanuary && (
                      <div className="month-year">{monthHeader.year}</div>
                    )}
                    <div className="month-name">{monthHeader.month}</div>
                  </>
                )}
              </div>
            );
          })}
        </div>

        {/* Date headers */}
        <div className="date-headers" style={{ gridTemplateColumns }}>
          <div className="project-column-header">Projects</div>
          {dateRange.map((date, index) => {
            const today = new Date();
            const isPastDate = date < today && date.toDateString() !== today.toDateString();
            
            // Get weekday initial (M, T, W, T, F, S, SS)
            const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
            const weekdayInitials = ['SS', 'M', 'T', 'W', 'T', 'F', 'S'];
            const weekdayInitial = weekdayInitials[dayOfWeek];
            
            return (
              <div key={index} className={`date-header ${isPastDate ? 'past-date' : ''}`}>
                <span className="date-day">{date.getDate()}</span>
                <span className="date-weekday">
                  {weekdayInitial}
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
            gridTemplateColumns={gridTemplateColumns}
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
  gridTemplateColumns,
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

  return (
    <>
      <div className="project-row" style={{ gridTemplateColumns }}>
        {/* Project header */}
        <div 
          className="project-header"
          style={{ borderLeftColor: project.color }}
          onClick={onToggleCollapsed}
        >
          {/* Collapse/expand toggle on the left */}
          <div className="project-controls">
            <button
              className="btn-ghost btn-sm"
              onClick={(e) => {
                e.stopPropagation();
                onToggleCollapsed();
              }}
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
                  onClick={(e) => {
                    e.stopPropagation();
                    onMoveUp();
                  }}
                  title="Move up"
                >
                  <ChevronUp size={12} />
                </button>
                <button 
                  className="btn-ghost btn-sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onMoveDown();
                  }}
                  title="Move down"
                >
                  <ChevronDown size={12} />
                </button>
              </div>
            )}
          </div>

          {/* Hide project button */}
          <div className="project-actions">
            <button
              className="btn-ghost btn-sm"
              onClick={(e) => {
                e.stopPropagation();
                onToggleHidden();
              }}
              title="Hide project"
            >
              <EyeOff size={14} />
            </button>
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
              onContextMenu={(e) => onCellContextMenu(e, project, date)}
              onMouseEnter={() => onCellHover({
                project,
                date,
                data: cellData
              })}
              onMouseLeave={() => onCellHover(null)}
              title={`${project.name} - ${dataUtils.formatDate(date)}: ${cellData.completedTasks} tasks completed`}
            >
              {/* Rounded square indicator for heatmap intensity */}
              <div 
                className="heatmap-square"
                style={{ 
                  backgroundColor: cellData.intensity > 0 ? project.color : 'var(--border)',
                  border: cellData.intensity === 0 ? `1px solid ${project.color}15` : 'none',
                  opacity: (() => {
                    let baseOpacity;
                    if (cellData.intensity === 0) {
                      baseOpacity = 0.4; // Subtle grey for 0 tasks
                    } else {
                      // Scale from 0.3 to 1.0 based on tasks (max at 10+ tasks)
                      const normalizedIntensity = Math.min(cellData.completedTasks / 10, 1);
                      baseOpacity = 0.3 + (normalizedIntensity * 0.7);
                    }
                    // Reduce opacity for past dates
                    return isPastDate ? baseOpacity * 0.7 : baseOpacity;
                  })()
                }}
              />
              
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
        <div className="project-events-row" style={{ gridTemplateColumns }}>
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
                  Edit
                </button>
                <button
                  className="btn-ghost btn-sm"
                  onClick={() => {
                    onEventDelete(event.id);
                    onClose();
                  }}
                >
                  Delete
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