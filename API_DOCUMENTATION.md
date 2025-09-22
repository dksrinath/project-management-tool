# Project Management Tool API Documentation

## Overview
A comprehensive REST API for project management with role-based access control and AI-powered user story generation.

## Base URL
```
http://localhost:5000/api
```

## Authentication
All protected endpoints require JWT token in Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## User Roles
- **Admin**: Full access to all resources
- **Manager**: Can manage projects and tasks within their scope
- **Developer**: Can view and update assigned tasks

## API Endpoints

### Authentication

#### Register User
```http
POST /api/register
```
**Body:**
```json
{
  "username": "string",
  "password": "string",
  "role": "admin|manager|developer"
}
```
**Response:** `201 Created`
```json
{
  "message": "User created",
  "id": 1
}
```

#### Login
```http
POST /api/login
```
**Body:**
```json
{
  "username": "string",
  "password": "string"
}
```
**Response:** `200 OK`
```json
{
  "token": "jwt-token-string",
  "user": {
    "id": 1,
    "username": "admin",
    "role": "admin"
  }
}
```

### Projects

#### Get Projects
```http
GET /api/projects
```
**Headers:** `Authorization: Bearer <token>`
**Response:** `200 OK`
```json
[
  {
    "id": 1,
    "name": "Project Name",
    "description": "Project description",
    "status": "active",
    "task_count": 5,
    "team_members": [
      {"id": 1, "username": "user1"}
    ]
  }
]
```

#### Create Project
```http
POST /api/projects
```
**Headers:** `Authorization: Bearer <token>`
**Body:**
```json
{
  "name": "string",
  "description": "string"
}
```

#### Get Project Details
```http
GET /api/projects/{id}
```
**Headers:** `Authorization: Bearer <token>`

#### Update Project
```http
PUT /api/projects/{id}
```
**Headers:** `Authorization: Bearer <token>`
**Body:**
```json
{
  "name": "string",
  "description": "string",
  "status": "active|completed|on_hold"
}
```

#### Delete Project
```http
DELETE /api/projects/{id}
```
**Headers:** `Authorization: Bearer <token>`

#### Add Team Member
```http
POST /api/projects/{id}/members
```
**Headers:** `Authorization: Bearer <token>`
**Body:**
```json
{
  "user_id": 1
}
```

### Tasks

#### Get Tasks
```http
GET /api/tasks
```
**Headers:** `Authorization: Bearer <token>`
**Response:** `200 OK`
```json
[
  {
    "id": 1,
    "title": "Task title",
    "status": "todo|in_progress|done",
    "project_id": 1,
    "project_name": "Project Name",
    "assigned_to": 1,
    "assignee_name": "developer",
    "deadline": "2025-09-30T00:00:00",
    "overdue": false
  }
]
```

#### Create Task
```http
POST /api/tasks
```
**Headers:** `Authorization: Bearer <token>`
**Body:**
```json
{
  "title": "string",
  "description": "string",
  "project_id": 1,
  "assigned_to": 1,
  "deadline": "2025-09-30T00:00:00"
}
```

#### Get Task Details
```http
GET /api/tasks/{id}
```
**Headers:** `Authorization: Bearer <token>`

#### Update Task
```http
PUT /api/tasks/{id}
```
**Headers:** `Authorization: Bearer <token>`
**Body:**
```json
{
  "title": "string",
  "description": "string",
  "status": "todo|in_progress|done",
  "assigned_to": 1,
  "deadline": "2025-09-30T00:00:00"
}
```

#### Delete Task
```http
DELETE /api/tasks/{id}
```
**Headers:** `Authorization: Bearer <token>`

#### Add Comment to Task
```http
POST /api/tasks/{id}/comments
```
**Headers:** `Authorization: Bearer <token>`
**Body:**
```json
{
  "content": "string"
}
```

### Dashboard

#### Get Dashboard Data
```http
GET /api/dashboard
```
**Headers:** `Authorization: Bearer <token>`
**Response:** `200 OK`
```json
{
  "stats": {
    "total_projects": 5,
    "total_tasks": 20,
    "todo": 8,
    "in_progress": 7,
    "done": 5,
    "overdue": 2
  },
  "recent_tasks": [
    {
      "id": 1,
      "title": "Task title",
      "status": "in_progress",
      "project": "Project Name",
      "deadline": "2025-09-30T00:00:00"
    }
  ],
  "overdue_tasks": [
    {
      "id": 2,
      "title": "Overdue task",
      "project": "Project Name",
      "deadline": "2025-09-20T00:00:00"
    }
  ]
}
```

### User Management

#### Get Users (Admin/Manager only)
```http
GET /api/users
```
**Headers:** `Authorization: Bearer <token>`
**Response:** `200 OK`
```json
[
  {
    "id": 1,
    "username": "admin",
    "role": "admin"
  }
]
```

### AI User Stories

#### Generate User Stories
```http
POST /api/ai/generate-user-stories
```
**Body:**
```json
{
  "projectDescription": "An ecommerce website where customers can browse products...",
  "projectId": 1
}
```
**Response:** `200 OK`
```json
[
  "As a customer, I want to browse products, so that I can choose what to buy.",
  "As a customer, I want to add products to cart, so that I can purchase them later.",
  "As an admin, I want to manage products, so that the catalog is up to date."
]
```

## Error Responses

### Common HTTP Status Codes
- `200 OK` - Request successful
- `201 Created` - Resource created successfully
- `400 Bad Request` - Invalid request data
- `401 Unauthorized` - Missing or invalid authentication
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

### Error Response Format
```json
{
  "error": "Error description"
}
```

## Role-Based Access Control

### Admin
- Full CRUD access to all projects, tasks, and users
- Can assign any role to users
- Can view all dashboard data

### Manager
- Can create and manage projects
- Can assign tasks within their projects
- Can view project team members and task progress
- Can add team members to projects

### Developer
- Can view assigned tasks and update their status
- Can add comments to tasks
- Can view projects they're assigned to
- Limited dashboard showing only their tasks

## Rate Limiting
No current rate limiting implemented. Consider adding for production use.

## Pagination
Current implementation returns all results. Consider adding pagination for large datasets.