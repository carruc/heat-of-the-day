# Heat of the Day

A comprehensive task management and long-term time management tool that allows users to plan months in advance while keeping track of milestones, deadlines, and tasks associated with projects.

## 🚀 Features

### Project Management
- **R1.1-R1.2**: Create and delete projects
- **R2.1-R2.2**: Name and rename projects  
- **R3.1-R3.2**: Assign and change project colors
- **R4**: Add at most one deadline per project
- **R5.1-R5.2**: Add and remove milestones from projects
- **R6.1-R6.2**: Add and remove tasks from projects

### Milestones & Deadlines
- **R7.1-R7.2**: Create and delete milestones/deadlines
- **R8.1-R8.2**: Name and rename events
- **R9.1-R9.3**: Set dates/times (cannot be in the past)

### Task Management
- **R10.1-R10.2**: Create and delete tasks
- **R11.1-R11.2**: Name and rename tasks
- **R12.1-R12.3**: Assign tasks to projects and optionally to milestones/deadlines
- **R13.1-R13.2**: Mark tasks as completed/incomplete

### Heatmap Calendar
- **R14-R15**: Visualize calendar with different time scales
- **D1.1-D1.3**: Time columns, project rows, month headers, time scale selection
- **D2**: Task completion intensity visualization (0-10 range)
- **D3**: Visual markers for milestones (neutral outline) and deadlines (accent outline)
- **D4**: Current day centered with scrollable navigation
- **D5**: Project creation modal with name and color selection
- **D6**: Event creation modal with project assignment
- **D7**: Hide/show projects functionality
- **D8**: Reorder projects when expanded

### Task Lists
- **R16**: Visualize task lists for each project
- **D9**: Add and complete tasks
- **D10**: Collapsed view (to-do only) vs expanded view (all tasks)
- **D11**: Associate tasks with milestones/deadlines during creation
- **D12**: Hide/show individual project task lists

## 🛠️ Tech Stack

- **Frontend**: React.js 18
- **Backend**: Node.js with Express
- **Styling**: Custom CSS with CSS custom properties
- **Icons**: Lucide React
- **Color Picker**: React Colorful
- **Date Handling**: date-fns

## 📦 Installation

### Prerequisites
- Node.js 14 or higher
- npm or yarn

### Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd heat-of-the-day-wip
   ```

2. **Install dependencies**
   ```bash
   npm run install-all
   ```

3. **Start the development servers**
   ```bash
   npm run dev
   ```

4. **Open the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

### Manual Setup

If you prefer to set up the servers individually:

1. **Install root dependencies**
   ```bash
   npm install
   ```

2. **Install client dependencies**
   ```bash
   cd client
   npm install
   cd ..
   ```

3. **Start the backend server**
   ```bash
   npm run server
   ```

4. **Start the frontend (in a new terminal)**
   ```bash
   npm run client
   ```

## 🎯 Usage Guide

### Creating Projects
1. Click the "New Project" button in the header
2. Enter a project name and select a color
3. The project will appear in both the heatmap and task lists

### Managing Events (Milestones & Deadlines)
1. Click "New Event" in the header
2. Choose the project, enter a name, and set the date
3. Select whether it's a milestone or deadline
4. Events appear as visual markers in the heatmap

### Working with Tasks
1. In the task lists section, click "Add Task" on any project card
2. Enter the task name and optionally associate it with an event
3. Check/uncheck tasks to mark them complete
4. Completed tasks create heat intensity in the calendar

### Heatmap Navigation
- Use arrow buttons or "Today" to navigate through time
- Adjust the time scale to show more or fewer days per cell
- Expand/collapse projects to see event names
- Right-click cells for context menus
- Hide projects using the eye icon

## 🏗️ Project Structure

```
heat-of-the-day/
├── server/                 # Backend API
│   └── index.js           # Express server with all endpoints
├── client/                # React frontend
│   ├── public/           # Static files
│   └── src/
│       ├── components/   # React components
│       ├── services/     # API service and utilities
│       ├── App.js       # Main application component
│       └── index.js     # React entry point
├── docs/                 # Documentation and requirements
├── package.json         # Root package configuration
└── README.md           # This file
```

## 🌟 Key Components

### Backend (server/index.js)
- RESTful API endpoints for projects, events, and tasks
- In-memory data storage (easily replaceable with database)
- Data validation and error handling
- CORS enabled for development

### Frontend Components
- **App.js**: Main application orchestrator
- **HeatmapCalendar**: Complex grid visualization with interactions
- **TaskLists**: Card-based task management interface
- **ProjectModal**: Project creation/editing with color picker
- **EventModal**: Event creation with date/time selection
- **TaskModal**: Task creation with event association

### API Service (client/src/services/api.js)
- Centralized API communication
- Error handling and response processing
- Data utility functions for calculations and formatting

## 🎨 Design Features

- **Minimalist UI**: Clean, modern design with subtle shadows and transitions
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Color-Coded Projects**: Visual project identification throughout the interface
- **Interactive Heatmap**: Hover effects, context menus, and smooth animations
- **Progress Tracking**: Visual progress bars and completion statistics
- **Accessibility**: Keyboard navigation and focus indicators

## 🚀 Deployment

### Production Build
```bash
npm run build
```

### Running in Production
```bash
npm start
```

The application is designed to be lightweight and can be easily deployed to:
- Heroku
- Vercel
- Netlify
- AWS
- DigitalOcean
- Or any Node.js hosting platform

For GitHub Pages deployment, build the client and configure the server endpoint accordingly.

## 🔧 Configuration

The application uses environment variables for configuration:
- `PORT`: Server port (default: 5000)
- `NODE_ENV`: Environment mode

## 📝 API Endpoints

### Projects
- `GET /api/projects` - Get all projects
- `POST /api/projects` - Create project
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

### Events (Milestones & Deadlines)
- `GET /api/events` - Get all events
- `POST /api/events` - Create event
- `PUT /api/events/:id` - Update event
- `DELETE /api/events/:id` - Delete event

### Tasks
- `GET /api/tasks` - Get all tasks
- `POST /api/tasks` - Create task
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task

### Analytics
- `GET /api/analytics/heatmap` - Get heatmap data

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🐛 Known Issues

- Data is stored in memory and will reset on server restart
- Date handling uses browser timezone
- Large numbers of projects may affect heatmap performance

## 🎯 Future Enhancements

- Persistent database storage
- User authentication and multi-user support
- Data export/import functionality
- Advanced analytics and reporting
- Email notifications for deadlines
- Calendar integration
- Mobile app versions

## 📞 Support

For questions or issues, please:
1. Check the documentation
2. Search existing issues
3. Create a new issue with detailed information

---

**Heat of the Day** - Transform your productivity with visual project management. 