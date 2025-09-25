from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, create_access_token
from database import db, User, Project, Task, Comment, UserStory
from auth import hash_password, verify_password, role_required
from ai_service import generate_user_stories
from datetime import datetime, timedelta

api = Blueprint('api', __name__)

@api.route('/register', methods=['POST'])
def register():
    try:
        data = request.json
        if not data:
            return {'error': 'No data provided'}, 400
        
        required_fields = ['username', 'password']
        for field in required_fields:
            if not data.get(field):
                return {'error': f'{field} is required'}, 400
        
        if len(data['password']) < 6:
            return {'error': 'Password must be at least 6 characters'}, 400
            
        if User.query.filter_by(username=data['username']).first():
            return {'error': 'Username already exists'}, 400

        user = User(
            username=data['username'],
            password=hash_password(data['password']),
            role=data.get('role', 'developer')
        )
        db.session.add(user)
        db.session.commit()
        return {'message': 'User created successfully', 'id': user.id}, 201
    except Exception as e:
        db.session.rollback()
        return {'error': 'Registration failed'}, 500

@api.route('/login', methods=['POST'])
def login():
    try:
        data = request.json
        if not data:
            return {'error': 'No data provided'}, 400
        
        username = data.get('username')
        password = data.get('password')
        
        if not username or not password:
            return {'error': 'Username and password are required'}, 400
            
        user = User.query.filter_by(username=username).first()

        if not user or not verify_password(password, user.password):
            return {'error': 'Invalid credentials'}, 401

        token = create_access_token(identity=str(user.id), expires_delta=timedelta(days=1))
        return {
            'token': token,
            'user': {'id': user.id, 'username': user.username, 'role': user.role}
        }, 200
    except Exception as e:
        return {'error': 'Login failed'}, 500

@api.route('/projects', methods=['GET', 'POST'])
@jwt_required()
def projects():
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)

    if request.method == 'POST':
        data = request.json
        project = Project(
            name=data['name'],
            description=data.get('description', ''),
            created_by=user_id
        )
        db.session.add(project)
        db.session.commit()
        return {'id': project.id, 'name': project.name}, 201

    if user.role == 'admin':
        projects = Project.query.all()
    else:
        projects = Project.query.filter(
            (Project.created_by == user_id) | (Project.team_members.contains(user))
        ).all()

    return jsonify([{
        'id': p.id,
        'name': p.name,
        'description': p.description,
        'status': p.status,
        'task_count': len(p.tasks),
        'team_members': [{'id': m.id, 'username': m.username} for m in p.team_members]
    } for p in projects])

@api.route('/projects/<int:id>', methods=['GET', 'PUT', 'DELETE'])
@jwt_required()
def project_detail(id):
    project = Project.query.get_or_404(id)

    if request.method == 'DELETE':
        db.session.delete(project)
        db.session.commit()
        return '', 204

    if request.method == 'PUT':
        data = request.json
        project.name = data.get('name', project.name)
        project.description = data.get('description', project.description)
        project.status = data.get('status', project.status)
        db.session.commit()

    return {
        'id': project.id,
        'name': project.name,
        'description': project.description,
        'status': project.status,
        'tasks': [{
            'id': t.id,
            'title': t.title,
            'status': t.status,
            'deadline': t.deadline.isoformat() if t.deadline else None,
            'assigned_to': t.assigned_to
        } for t in project.tasks],
        'team_members': [{
            'id': m.id,
            'username': m.username,
            'role': m.role
        } for m in project.team_members]
    }

@api.route('/projects/<int:id>/members', methods=['POST'])
@jwt_required()
def add_member(id):
    project = Project.query.get_or_404(id)
    data = request.json
    user = User.query.get(data['user_id'])
    if user and user not in project.team_members:
        project.team_members.append(user)
        db.session.commit()
    return {'message': 'Member added'}, 200

@api.route('/tasks', methods=['GET', 'POST'])
@jwt_required()
def tasks():
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)

    if request.method == 'POST':
        data = request.json
        task = Task(
            title=data['title'],
            description=data.get('description', ''),
            project_id=data['project_id'],
            assigned_to=data.get('assigned_to'),
            deadline=datetime.fromisoformat(data['deadline']) if data.get('deadline') else None
        )
        db.session.add(task)
        db.session.commit()
        return {'id': task.id, 'title': task.title}, 201

    if user.role == 'admin':
        tasks = Task.query.all()
    elif user.role == 'manager':
        projects = Project.query.filter(
            (Project.created_by == user_id) | (Project.team_members.contains(user))
        ).all()
        project_ids = [p.id for p in projects]
        tasks = Task.query.filter(Task.project_id.in_(project_ids)).all()
    else:
        tasks = Task.query.filter_by(assigned_to=user_id).all()

    return jsonify([{
        'id': t.id,
        'title': t.title,
        'status': t.status,
        'project_id': t.project_id,
        'project_name': t.project.name if t.project else None,
        'assigned_to': t.assigned_to,
        'assignee_name': t.assignee.username if t.assignee else None,
        'deadline': t.deadline.isoformat() if t.deadline else None,
        'overdue': t.deadline < datetime.utcnow() if t.deadline and t.status != 'done' else False
    } for t in tasks])

@api.route('/tasks/<int:id>', methods=['GET', 'PUT', 'DELETE'])
@jwt_required()
def task_detail(id):
    task = Task.query.get_or_404(id)

    if request.method == 'DELETE':
        db.session.delete(task)
        db.session.commit()
        return '', 204

    if request.method == 'PUT':
        data = request.json
        task.title = data.get('title', task.title)
        task.description = data.get('description', task.description)
        task.status = data.get('status', task.status)
        task.assigned_to = data.get('assigned_to', task.assigned_to)
        if data.get('deadline'):
            task.deadline = datetime.fromisoformat(data['deadline'])
        db.session.commit()

    return {
        'id': task.id,
        'title': task.title,
        'description': task.description,
        'status': task.status,
        'deadline': task.deadline.isoformat() if task.deadline else None,
        'assigned_to': task.assigned_to,
        'comments': [{
            'id': c.id,
            'content': c.content,
            'user': c.user.username,
            'created_at': c.created_at.isoformat()
        } for c in task.comments]
    }

@api.route('/tasks/<int:id>/comments', methods=['POST'])
@jwt_required()
def add_comment(id):
    data = request.json
    comment = Comment(
        content=data['content'],
        task_id=id,
        user_id=int(get_jwt_identity())
    )
    db.session.add(comment)
    db.session.commit()
    return {'id': comment.id}, 201

@api.route('/dashboard', methods=['GET'])
@jwt_required()
def dashboard():
    try:
        user_id = int(get_jwt_identity())
        user = User.query.get_or_404(user_id)

        if user.role == 'admin':
            tasks = Task.query.all()
            projects = Project.query.all()
        elif user.role == 'manager':
            projects = Project.query.filter(
                (Project.created_by == user_id) | (Project.team_members.contains(user))
            ).all()
            project_ids = [p.id for p in projects]
            tasks = Task.query.filter(Task.project_id.in_(project_ids)).all()
        else:
            tasks = Task.query.filter_by(assigned_to=user_id).all()
            projects = Project.query.filter(Project.team_members.contains(user)).all()

        overdue = [t for t in tasks if t.deadline and t.deadline < datetime.utcnow() and t.status != 'done']

        return {
            'stats': {
                'total_projects': len(projects),
                'total_tasks': len(tasks),
                'todo': len([t for t in tasks if t.status == 'todo']),
                'in_progress': len([t for t in tasks if t.status == 'in_progress']),
                'done': len([t for t in tasks if t.status == 'done']),
                'overdue': len(overdue)
            },
            'recent_tasks': [{
                'id': t.id,
                'title': t.title,
                'status': t.status,
                'project': t.project.name if t.project else None,
                'deadline': t.deadline.isoformat() if t.deadline else None
            } for t in sorted(tasks, key=lambda x: x.created_at, reverse=True)[:5]],
            'overdue_tasks': [{
                'id': t.id,
                'title': t.title,
                'project': t.project.name if t.project else None,
                'deadline': t.deadline.isoformat() if t.deadline else None
            } for t in overdue[:5]]
        }
    except Exception as e:
        print(f"Error in dashboard: {e}")
        return {'error': str(e)}, 500

@api.route('/ai/generate-user-stories', methods=['POST'])
def generate_stories():
    data = request.json
    description = data.get('projectDescription', '')
    project_id = data.get('projectId')

    if not description:
        return {'error': 'Description required'}, 400

    result = generate_user_stories(description)
    
    if isinstance(result, tuple):
        content, status_code = result
        if status_code != 200:
            return content, status_code
        stories = content
    else:
        # Fallback for old format
        stories = result

    if project_id:
        for story in stories:
            user_story = UserStory(project_id=project_id, story=story)
            db.session.add(user_story)
        db.session.commit()

    return jsonify(stories), 200

@api.route('/users', methods=['GET'])
@jwt_required()
@role_required(['admin', 'manager'])
def users():
    users = User.query.all()
    return jsonify([{
        'id': u.id,
        'username': u.username,
        'role': u.role
    } for u in users])
