# **Heat of the Day: Introduction**

This is an introductory paragraph which is not giving specific information for development, but serves as an explanation of the scope and idea behind the app.

The “Heat of the Day” app is a task management and long-term time management tool. It must allow the user to plan their next months in advance, keeping track of milestones, deadlines, and tasks associated with one’s projects. In this way, a user can associate daily work with long-term planning and results.

Currently, the app presents a single view, featuring:

- a heatmap calendar at the top, which displays time on a horizontal axis, and projects on its vertical axis. The heatmap cells develop on the right of the project’s name.  
- a task view at the bottom, featuring a “tasks card” for each project.

While in the rest of the document these will be discussed with more precision, Heat of the Day’s main categories are:

- **Projects**, which are entities usually associated with a real-world deadline (an exam, a paper, a product, an event…);  
- **Milestones**, which are shown in the heatmap calendar, and describe a specific mid-term accomplishments or evaluation day;  
- **Deadlines**, which are shown in the heatmap calendar, and are associated with the “final” day for a project to be completed; A deadline is a “special” milestone;  
- **Tasks**, which are “bullet-point style” tasks describing a single element of work to be brought out, and can be uncompleted or completed;

Now some more specific paragraphs describing functional requirements, design requirements and other implementation specifications will be provided.

## **Functional Requirements**

These are just fundamental behaviours for the defined entities of this app. Specifics on their behaviour will follow.

### **Project**

The user must be able to:

- **R1.1**: create a new Project;  
- **R1.2**: delete a Project;  
- **R2.1**:  give a name to a Project;  
- **R2.2**:  change name to a Project;  
- **R3.1**:  associate a color to a Project;  
- **R3.2**: change the associated color to a Project;  
- **R4**: add at most one Deadline per Project;  
- **R5.1**:  add zero or more Milestones to a Project;  
- **R5.2**: remove one or more Milestones from a Project;  
- **R6.1**: add zero or more Tasks to a Project;  
- **R6.2**: remove one or more Tasks from a Project;

### **Deadlines and Milestones**

Deadline and Milestones are essentially the same thing \- but deadlines have extended functionality. For the purpose of this document, I will group some requirements, either referring to both of them or using the term Event. A user must be able to:

- **R7.1**: create a new Milestone or Deadline;  
- **R7.2**: delete a Milestone or Deadline;  
- **R8.1**: give a name to a Milestone or Deadline;  
- **R8.2**: change the name given to a Milestone or Deadline;  
- **R9.1**: associate a date and time to a Milestone or Deadline;  
- **R9.2**: change the associated date and time to a Milestone or Deadline;   
- **R9.3**: the date and time cannot be set before the system’s current date (the “today” for the user);

### **Tasks**

 The user must be able to:

- **R10.1**: create a new Task;  
- **R10.2**: delete a Task;  
- **R11.1**:  give a name to a Task;  
- **R11.2**: change the name of a Task;  
- **R12.1**: assign a task to exactly one Project;  
- **R12.2**: assign a task to at most one Milestone or Deadline of the Project;  
- **R12.3**: remove any associated Milestone or Deadline from the task;  
- **R13.1**: set the task as completed;  
- **R13.2**: set the task as not completed;

### **Heatmap Calendar**

The user must be able to

- **R14**: visualize the Heatmap Calendar;  
- **R15**: set different time-scales to visualize the calendar;

### **Task Lists**

The user must be able to:

- **R16**: visualize the Tasklist for each project;

## **Design Requirements**

This section lays the groundwork for understanding the user experience, starting with the user interface. By describing the intuition behind the visualization, we can then implement the application.

### **Heatmap Calendar**

The Heatmap Calendar

- **D1.1**: allows users to visualize discrete time units (one or more days) as columns, and all the user’s Projects as rows;  
- **D1.2**: allows users to see months passing, showing the month’s abbreviation above the column with its first day;  
- **D1.3**: allows users to choose different time-scales, by changing the amount of days a single cell corresponds to, through a text box;  
- **D2**: allows users to visualize how many tasks they have completed through a Heatmap functionality: each cell is more brightly colored as more tasks are completed. The range can be 0 to 10 tasks, for now;  
- **D3**: allows users to visualize Deadlines and Milestones for each Project, signaled respectively by: a neutral outline on cells containing a milestone, and an accent color outline cells containing deadlines;  
- **D3**: allows users to collapse or expand each project view: when collapsed, the project will show only outlines corresponding to deadlines and milestones, while when expanded it will show also the deadline/milestones names;  
- **D4**: by default shows the current day as the column in the middle, but the user can scroll to the left or to the right to visualize the past or future days;  
- **D5**: allows users to create new projects with the appropriate button; when clicked, a card appears on the screen, prompting the user to add a name and choose a color;  
- **D6**: allows the user to create new milestones or deadlines for a project with the appropriate button; when clicked, a card appears on the screen, prompting the user to choose the associated project, add a name, choose a date and choose if it is a deadline or a milestone;  
- **D7**: allows users to hide projects, by double clicking on the collapse/expand triangle; when hidden, they are listed on the bottom of the heatmap, on the same line of the create new project/event buttons; when clicking on those listed on the bottom, they show up again on the calendar.  
- **D8**: when a Project is expanded,its position in the list can be changed, by clicking on the up/down arrows on the left of the collapse/expand triangle;

**Image 1:** A schematic demo of the Heatmap Calendar layout.

![][image1]

### **Task Lists**

There’s one Task List card for each Project. It:

- **D9**: allows users to add tasks and complete them.   
- **D10**: When collapsed, it shows only to-do tasks. When expanded, it also shows already completed tasks.  
- **D11**: when creating a task by clicking the appropriate button, the user can also associate it to one of the project’s milestones or projects;  
- **D12**: users can hide single Project Task Lists, and they will show under the tasklists, as it is implemented in the calendar; when clicking on those listed on the bottom, they show up again on the screen.

**Image 2:** Task List Collapsed view:

![][image2]

**Image 3:** Task List Expanded view:

![][image3]

### **Complete Heatmap Calendar and Task Lists layout**

![][image4]

## **Tech Specs and Non-Functional Requirements:**

This app is to be developed using a web development framework, working with [Node.js](http://Node.js) and [React.js](http://React.js), as they are the best tradeoff between ease of development and aesthetics.

The objective is making a functioning app that is reliable in the few functionalities we selected. It must store data effectively, and remain as simple as possible to allow **improvement** and **expansion** in the future. It is only a single page right now.

Another requirement is minimalist and elegant UI. Creation of new apps 

This will be uploaded to GitHub and should be runnable by people by just downloading it, and executing it. In the future, it will be made so it can be hosted on one’s personal GitHub Pages, protecting the access with a password/a login. For this reason it must be **lightweight**.