import unittest
import json
import os
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from database import User, Project, Task, Comment, UserStory
from auth import hash_password, verify_password, role_required
from ai_service import generate_user_stories
from datetime import datetime, timedelta

def create_test_app():
    test_app = Flask(__name__)
    test_app.config['TESTING'] = True
    test_app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
    test_app.config['JWT_SECRET_KEY'] = 'test-secret-key'
    test_app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    from database import db
    db.init_app(test_app)
    jwt = JWTManager(test_app)
    CORS(test_app)

    from routes import api
    test_app.register_blueprint(api, url_prefix='/api')

    with test_app.app_context():
        db.create_all()

    return test_app, db

class ProjectManagementTestCase(unittest.TestCase):
    def setUp(self):
        self.app, self.db = create_test_app()
        self.client = self.app.test_client()

        with self.app.app_context():
            import time
            timestamp = str(int(time.time()))

            admin = User(username=f'admin_{timestamp}', password=hash_password('admin123'), role='admin')
            manager = User(username=f'manager_{timestamp}', password=hash_password('manager123'), role='manager')
            developer = User(username=f'developer_{timestamp}', password=hash_password('dev123'), role='developer')

            self.db.session.add_all([admin, manager, developer])
            self.db.session.commit()

            self.admin_id = admin.id
            self.manager_id = manager.id
            self.developer_id = developer.id
            self.admin_username = admin.username
            self.manager_username = manager.username
            self.developer_username = developer.username

    def tearDown(self):
        """Clean up after each test."""
        with self.app.app_context():
            self.db.session.remove()
            self.db.drop_all()

    def login_user(self, username, password):
        """Helper method to login and get JWT token."""
        response = self.client.post('/api/login',
                                data=json.dumps({'username': username, 'password': password}),
                                content_type='application/json')
        data = json.loads(response.data)
        return data.get('token')

    def test_user_registration(self):
        """Test user registration endpoint."""
        response = self.client.post('/api/register',
                                data=json.dumps({
                                    'username': 'newuser',
                                    'password': 'newpass123',
                                    'role': 'developer'
                                }),
                                content_type='application/json')

        self.assertEqual(response.status_code, 201)
        data = json.loads(response.data)
        self.assertIn('message', data)
        self.assertEqual(data['message'], 'User created successfully')

    def test_duplicate_user_registration(self):
        """Test registration with existing username."""
        response = self.client.post('/api/register',
                                data=json.dumps({
                                    'username': self.admin_username,
                                    'password': 'newpass123'
                                }),
                                content_type='application/json')

        self.assertEqual(response.status_code, 400)
        data = json.loads(response.data)
        self.assertIn('error', data)

    def test_user_login(self):
        """Test user login with valid credentials."""
        response = self.client.post('/api/login',
                                data=json.dumps({
                                    'username': self.admin_username,
                                    'password': 'admin123'
                                }),
                                content_type='application/json')

        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertIn('token', data)
        self.assertIn('user', data)
        self.assertEqual(data['user']['username'], self.admin_username)

    def test_invalid_login(self):
        """Test login with invalid credentials."""
        response = self.client.post('/api/login',
                                data=json.dumps({
                                    'username': self.admin_username,
                                    'password': 'wrongpass'
                                }),
                                content_type='application/json')

        self.assertEqual(response.status_code, 401)
        data = json.loads(response.data)
        self.assertIn('error', data)

    def test_create_project(self):
        """Test project creation."""
        token = self.login_user(self.admin_username, 'admin123')
        response = self.client.post('/api/projects',
                                data=json.dumps({
                                    'name': 'Test Project',
                                    'description': 'A test project'
                                }),
                                content_type='application/json',
                                headers={'Authorization': f'Bearer {token}'})

        self.assertEqual(response.status_code, 201)
        data = json.loads(response.data)
        self.assertIn('id', data)
        self.assertEqual(data['name'], 'Test Project')

    def test_get_projects_unauthorized(self):
        """Test getting projects without authentication."""
        response = self.client.get('/api/projects')
        self.assertEqual(response.status_code, 401)

    def test_get_projects_as_admin(self):
        token = self.login_user(self.admin_username, 'admin123')

        self.client.post('/api/projects',
                     data=json.dumps({'name': 'Admin Project'}),
                     content_type='application/json',
                     headers={'Authorization': f'Bearer {token}'})

        response = self.client.get('/api/projects',
                               headers={'Authorization': f'Bearer {token}'})

        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertIsInstance(data, list)

    def test_create_task(self):
        admin_token = self.login_user(self.admin_username, 'admin123')

        project_response = self.client.post('/api/projects',
                                       data=json.dumps({'name': 'Task Project'}),
                                       content_type='application/json',
                                       headers={'Authorization': f'Bearer {admin_token}'})
        project_id = json.loads(project_response.data)['id']

        response = self.client.post('/api/tasks',
                                data=json.dumps({
                                    'title': 'Test Task',
                                    'description': 'A test task',
                                    'project_id': project_id,
                                    'assigned_to': self.developer_id
                                }),
                                content_type='application/json',
                                headers={'Authorization': f'Bearer {admin_token}'})

        self.assertEqual(response.status_code, 201)
        data = json.loads(response.data)
        self.assertEqual(data['title'], 'Test Task')

    def test_update_task_status(self):
        admin_token = self.login_user(self.admin_username, 'admin123')

        with self.app.app_context():
            project = Project(name='Status Test Project', created_by=self.admin_id)
            self.db.session.add(project)
            self.db.session.commit()

            task = Task(title='Status Task', project_id=project.id, assigned_to=self.developer_id)
            self.db.session.add(task)
            self.db.session.commit()
            task_id = task.id

        response = self.client.put(f'/api/tasks/{task_id}',
                               data=json.dumps({'status': 'in_progress'}),
                               content_type='application/json',
                               headers={'Authorization': f'Bearer {admin_token}'})

        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertEqual(data['status'], 'in_progress')

    def test_add_task_comment(self):
        admin_token = self.login_user(self.admin_username, 'admin123')

        with self.app.app_context():
            project = Project(name='Comment Test Project', created_by=self.admin_id)
            self.db.session.add(project)
            self.db.session.commit()

            task = Task(title='Comment Task', project_id=project.id)
            self.db.session.add(task)
            self.db.session.commit()
            task_id = task.id

        response = self.client.post(f'/api/tasks/{task_id}/comments',
                                data=json.dumps({'content': 'Test comment'}),
                                content_type='application/json',
                                headers={'Authorization': f'Bearer {admin_token}'})

        self.assertEqual(response.status_code, 201)
        data = json.loads(response.data)
        self.assertIn('id', data)

    def test_dashboard_access(self):
        """Test dashboard access with authentication."""
        token = self.login_user(self.admin_username, 'admin123')
        response = self.client.get('/api/dashboard',
                               headers={'Authorization': f'Bearer {token}'})

        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertIn('stats', data)
        self.assertIn('recent_tasks', data)

    def test_role_based_access_users_endpoint(self):
        admin_token = self.login_user(self.admin_username, 'admin123')
        response = self.client.get('/api/users',
                               headers={'Authorization': f'Bearer {admin_token}'})
        self.assertEqual(response.status_code, 200)

        manager_token = self.login_user(self.manager_username, 'manager123')
        response = self.client.get('/api/users',
                               headers={'Authorization': f'Bearer {manager_token}'})
        self.assertEqual(response.status_code, 200)

        dev_token = self.login_user(self.developer_username, 'dev123')
        response = self.client.get('/api/users',
                               headers={'Authorization': f'Bearer {dev_token}'})
        self.assertEqual(response.status_code, 403)

    def test_ai_user_stories_generation(self):
        """Test AI user stories generation endpoint."""
        response = self.client.post('/api/ai/generate-user-stories',
                                data=json.dumps({
                                    'projectDescription': 'A simple todo app where users can add and complete tasks'
                                }),
                                content_type='application/json')

        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertIsInstance(data, list)

if __name__ == '__main__':
    unittest.main()