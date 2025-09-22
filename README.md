# Project Management Tool

A comprehensive full-stack project management application with role-based access control and AI-powered user story generation using GROQ API.

## Features

### Core Features
- **User Management**: Admin, Manager, Developer roles with proper authentication
- **Project Management**: Create, edit, delete projects with team assignment
- **Task Management**: Full CRUD operations with status tracking (To Do → In Progress → Done)
- **Role-Based Access Control**: Different permissions for different user roles
- **Dashboard & Reporting**: Task counts, overdue tasks, progress tracking
- **Commenting System**: Add comments to tasks for collaboration
- **Deadline Management**: Set and track task deadlines with overdue detection

### AI-Powered Features
- **User Story Generator**: Generate detailed user stories from project descriptions using GROQ API
- **Automated Task Creation**: Option to create tasks from generated user stories

## Tech Stack

- **Backend**: Python Flask, SQLAlchemy ORM, PostgreSQL
- **Frontend**: React.js with React Router
- **Authentication**: JWT (JSON Web Tokens) with bcrypt password hashing
- **AI Integration**: GROQ API with Mixtral model
- **Testing**: Python unittest framework
- **CORS**: Enabled for cross-origin requests

## Prerequisites

- Python 3.8+
- Node.js 14+
- PostgreSQL 12+
- GROQ API Key (for AI features)

## Installation & Setup

### 1. Clone Repository
```bash
git clone <repository-url>
cd project-management-tool
```

### 2. Database Setup
```sql
-- Install PostgreSQL and create database
CREATE DATABASE project_mgmt;
CREATE USER project_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE project_mgmt TO project_user;
```

### 3. Backend Setup
```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Setup environment variables
cp .env.template .env
# Edit .env with your database credentials and API keys

# Run the application
python app.py
```

### 4. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm start
```

## Environment Configuration

Create `backend/.env` file with the following variables:

```env
# Database Configuration
DATABASE_URL=postgresql://project_user:your_password@localhost:5432/project_mgmt

# JWT Secret Key (use a strong random key in production)
JWT_SECRET_KEY=your-super-secret-jwt-key-change-this-in-production

# GROQ API Configuration
GROQ_API_KEY=your-groq-api-key-here

# Application Configuration
FLASK_ENV=development
FLASK_DEBUG=True
```

## Default Credentials

- **Username**: admin
- **Password**: admin123
- **Role**: admin

## User Roles & Permissions

### Admin
- Full system access
- Manage all users, projects, and tasks
- View complete dashboard with all data
- User management capabilities

### Manager
- Create and manage projects
- Assign team members to projects
- Manage tasks within their projects
- View project-specific dashboard data

### Developer
- View and update assigned tasks
- Add comments to tasks
- View projects they're assigned to
- Personal dashboard with assigned tasks only

## Testing

Run the comprehensive test suite:

```bash
cd backend
python -m unittest test_app.py
```

**Test Coverage:**
- User registration and authentication
- Role-based access control
- Project CRUD operations
- Task management and status updates
- Comment functionality
- Dashboard data retrieval
- AI user story generation

## API Documentation

Detailed API documentation is available in `API_DOCUMENTATION.md`. Key endpoints include:

- **Authentication**: `/api/register`, `/api/login`
- **Projects**: `/api/projects` (CRUD operations)
- **Tasks**: `/api/tasks` (CRUD operations)
- **Dashboard**: `/api/dashboard`
- **AI Features**: `/api/ai/generate-user-stories`
- **User Management**: `/api/users`

## Deployment

### Production Considerations
1. **Security**: Change JWT secret key and use environment variables
2. **Database**: Use production PostgreSQL with connection pooling
3. **CORS**: Configure for specific domains only
4. **Rate Limiting**: Implement API rate limiting
5. **Logging**: Add comprehensive logging and monitoring
6. **HTTPS**: Enable SSL/TLS encryption

## AI-Powered User Story Generator

The application includes a GROQ-powered AI feature that automatically generates user stories from plain-text project descriptions.

### Example Usage:
**Input:**
```json
{
  "projectDescription": "An ecommerce website where customers can browse products, add to cart, and make payments online. Admin should manage products and view orders."
}
```

**Output:**
```json
[
  "As a customer, I want to browse products, so that I can choose what to buy.",
  "As a customer, I want to add products to a cart, so that I can purchase them later.",
  "As an admin, I want to manage the product catalog, so that the website reflects correct inventory."
]
```

## Future Enhancements

- **Real-time Updates**: WebSocket integration for live task updates
- **File Attachments**: Add file upload capability to tasks
- **Time Tracking**: Track time spent on tasks
- **Gantt Charts**: Visual project timeline representation
- **Email Notifications**: Notify users of task assignments and deadlines
- **Mobile App**: React Native mobile application
- **Advanced Reporting**: Detailed analytics and custom reports

## Known Issues & Limitations

- No current rate limiting (recommended for production)
- Limited to GROQ API for AI features (could add OpenAI as fallback)
- No file upload functionality
- Basic error handling (could be enhanced)

## Developer Information

**Author**: Srinath D K
**Email**: drdksrinath@gmail.com

## License

This project is developed as part of an internship assignment. All rights reserved.

## Acknowledgments

- Flask documentation and community
- React.js team for excellent frontend framework
- GROQ for AI capabilities
- PostgreSQL team for robust database system

---

## Quick Start Commands

```bash
# Backend
cd backend && pip install -r requirements.txt && python app.py

# Frontend (new terminal)
cd frontend && npm install && npm start

# Testing
cd backend && python -m unittest test_app.py
```

**Application URLs:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000/api
- Dashboard: http://localhost:3000/dashboard

**Default Login:** admin / admin123