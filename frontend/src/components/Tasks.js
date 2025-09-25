import React, { useState, useEffect } from 'react';
import api from '../api';

function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [projectMembers, setProjectMembers] = useState([]);
  const [form, setForm] = useState({ title: '', description: '', project_id: '', deadline: '', assigned_to: '' });
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    loadTasks();
    api.get('/projects').then(res => setProjects(res.data));
  }, []);

  useEffect(() => {
    if (form.project_id) {
      api.get(`/projects/${form.project_id}`)
        .then(res => setProjectMembers(res.data.team_members || []))
        .catch(err => console.error('Failed to load members:', err));
    } else {
      setProjectMembers([]);
    }
  }, [form.project_id]);

  const loadTasks = () => api.get('/tasks').then(res => setTasks(res.data));

  const handleSubmit = async (e) => {
    e.preventDefault();
    await api.post('/tasks', form);
    setForm({ title: '', description: '', project_id: '', deadline: '', assigned_to: '' });
    setShowForm(false);
    loadTasks();
  };

  const updateStatus = async (id, status) => {
    await api.put(`/tasks/${id}`, { status });
    loadTasks();
  };

  const deleteTask = async (id) => {
    await api.delete(`/tasks/${id}`);
    loadTasks();
  };

  return (
    <div className="tasks">
      <h1>Tasks</h1>
      <button onClick={() => setShowForm(!showForm)}>New Task</button>

      {showForm && (
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Task Title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
          />
          <textarea
            placeholder="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <select
            value={form.project_id}
            onChange={(e) => setForm({ ...form, project_id: e.target.value })}
            required
          >
            <option value="">Select Project</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>

          {form.project_id && (
            <select
              value={form.assigned_to}
              onChange={(e) => setForm({ ...form, assigned_to: e.target.value })}
              required
            >
              <option value="">Assign to...</option>
              {projectMembers.map(user => (
                <option key={user.id} value={user.id}>
                  {user.username}
                </option>
              ))}
            </select>
          )}

          <input
            type="datetime-local"
            value={form.deadline}
            onChange={(e) => setForm({ ...form, deadline: e.target.value })}
          />
          <button type="submit">Create</button>
        </form>
      )}

      <div className="task-board">
        <div className="task-column">
          <h3>To Do</h3>
          {tasks.filter(t => t.status === 'todo').map(task => (
            <div key={task.id} className={`task-card ${task.overdue ? 'overdue' : ''}`}>
              <h4>{task.title}</h4>
              {task.deadline && <span>Due: {new Date(task.deadline).toLocaleDateString()}</span>}
              {task.assigned_to && <p>Assigned to: {task.assigned_user?.username}</p>}
              <div className="task-actions">
                <button onClick={() => updateStatus(task.id, 'in_progress')}>Start</button>
                <button onClick={() => deleteTask(task.id)}>Delete</button>
              </div>
            </div>
          ))}
        </div>

        <div className="task-column">
          <h3>In Progress</h3>
          {tasks.filter(t => t.status === 'in_progress').map(task => (
            <div key={task.id} className="task-card">
              <h4>{task.title}</h4>
              {task.assigned_to && <p>Assigned to: {task.assigned_user?.username}</p>}
              <div className="task-actions">
                <button onClick={() => updateStatus(task.id, 'done')}>Complete</button>
                <button onClick={() => updateStatus(task.id, 'todo')}>Back</button>
              </div>
            </div>
          ))}
        </div>

        <div className="task-column">
          <h3>Done</h3>
          {tasks.filter(t => t.status === 'done').map(task => (
            <div key={task.id} className="task-card done">
              <h4>{task.title}</h4>
              {task.assigned_to && <p>Assigned to: {task.assigned_user?.username}</p>}
              <button onClick={() => deleteTask(task.id)}>Delete</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Tasks;
