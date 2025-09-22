# Project Management Tool - ER Diagram

```mermaid
erDiagram
    User ||--o{ Project : "creates"
    User ||--o{ project_members : "belongs_to"
    project_members }o--|| Project : "has_members"
    Project ||--o{ Task : "has"
    Project ||--o{ UserStory : "has"
    Task ||--o{ Comment : "has"
    User ||--o{ Task : "assigned"
    User ||--o{ Comment : "creates"

    User {
        int id PK
        string username UK
        string password
        string role
        datetime created_at
    }

    Project {
        int id PK
        string name
        text description
        string status
        int created_by FK
        datetime created_at
    }

    project_members {
        int user_id FK
        int project_id FK
    }

    Task {
        int id PK
        string title
        text description
        string status
        datetime deadline
        int project_id FK
        int assigned_to FK
        datetime created_at
    }

    UserStory {
        int id PK
        int project_id FK
        text story
        datetime created_at
    }

    Comment {
        int id PK
        text content
        int task_id FK
        int user_id FK
        datetime created_at
    }
```

## Entity Relationships

### One-to-Many Relationships:
- **User → Project**: One user can create many projects (`created_by`)
- **Project → Task**: One project can have many tasks
- **Project → UserStory**: One project can have many user stories
- **Task → Comment**: One task can have many comments
- **User → Task**: One user can be assigned to many tasks (`assigned_to`)
- **User → Comment**: One user can create many comments

### Many-to-Many Relationships:
- **User ↔ Project**: Users can be team members of multiple projects, and projects can have multiple team members
  - Implemented via `project_members` junction table with explicit relationships:
    - User → project_members (one user can belong to many project memberships)
    - project_members → Project (one project membership belongs to one project)

## Key Constraints

- **Primary Keys**: All entities have auto-incrementing integer primary keys
- **Foreign Keys**: Properly defined with referential integrity
- **Unique Constraints**: Username must be unique
- **Not Null**: Essential fields are marked as not nullable
- **Default Values**: Status fields have sensible defaults ('todo', 'active')

## Database Schema Details

### User Table
- Stores authentication and role information
- Roles: 'admin', 'manager', 'developer'

### Project Table
- Central entity for project management
- Tracks project metadata and status

### Task Table
- Core work items within projects
- Status progression: 'todo' → 'in_progress' → 'done'
- Deadline tracking for overdue detection

### Comment Table
- Enables collaboration on tasks
- Audit trail of task discussions

### UserStory Table
- Stores AI-generated user stories
- Linked to projects for context

### Junction Table (project_members)
- Manages many-to-many relationship between users and projects
- Enables team assignment functionality
- Each record represents one user's membership in one project</content>
<parameter name="filePath">g:\project-management-tool\ER_DIAGRAM.md