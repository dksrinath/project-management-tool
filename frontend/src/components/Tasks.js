import React, { useState, useEffect } from 'react';
import api from '../api';

function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [projectMembers, setProjectMembers] = useState([]);
  const [form, setForm] = useState({
    title: '',
    description: '',
    project_id: '',
    deadline: '',
    assigned_to: ''
  });
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    loadTasks();
    api.get('/projects')
      .then(res => setProjects(res.data))
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (form.project_id) {
      api.get(`/projects/${form.project_id}`)
        .then(res => {
          const members = res.data.team_members || [];
          console.log('Loaded team members:', members); // 📌 Debug line
          setProjectMembers(members);
        })
        .catch(err => {
          console.error('Failed to load members:', err);
          setProjectMembers([]);
        });
    } else {
      setProjectMembers([]);
    }
  }, [form.project_id]);

  const loadTasks = () => {
    api.get('/tasks')
      .then(res => setTasks(res.data))
      .catch(console.error);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/tasks', form);
      setForm({
        title: '',
        description: '',
        project_id: '',
        deadline: '',
        assigned_to: ''
      });
      setShowForm(false);
      loadTasks();
    } catch (err) {
      alert('Failed to create task');
      console.error(err);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await api.put(`/tasks/${id}`, { status });
      loadTasks();
    } catch (err) {
      alert('Failed to update task');
      console.error(err);
    }
  };

  const deleteTask = async (id) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await api.delete(`/tasks/${id}`);
      loadTasks();
    } catch (err) {
      alert('Failed to delete task');
      console.error(err);
    }
  };

  return (
    <div className="tasks">
      <h1>Tasks</h1>
      <button onClick={() => setShowForm(!showForm)}>
        {showForm ? 'Cancel' : 'New Task'}
      </button>

      {showForm && (
        <form onSubmit={handleSubmit} style={{ marginBottom: '2rem' }}>
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
            style={{ marginTop: '1rem' }}
          >
            <option value="">Select Project</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>

          {/* Assignee Dropdown */}
          {form.project_id && (
            <>
              {projectMembers.length > 0 ? (
                <select
                  value={form.assigned_to}
                  onChange={(e) => setForm({ ...form, assigned_to: e.target.value })}
                  required
                  style={{ marginTop: '1rem' }}
                >
                  <option value="">Assign to...</option>
                  {projectMembers.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.username}
                    </option>
                  ))}
                </select>
              ) : (
                <p style={{ color: '#e74c3c', marginTop: '0.5rem' }}>
                  No team members in this project. Add members in the Projects tab.
                </p>
              )}
            </>
          )}

          <input
            type="datetime-local"
            value={form.deadline}
            onChange={(e) => setForm({ ...form, deadline: e.target.value })}
            style={{ marginTop: '1rem' }}
          />
          <button type="submit" style={{ marginTop: '1rem' }}>Create</button>
        </form>
      )}

      {/* Kanban Board */}
      <div className="task-board" style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
        {['todo', 'in_progress', 'done'].map(status => (
          <div key={status} className="task-column" style={{ flex: 1, border: '1px solid #ddd', padding: '1rem' }}>
            <h3 style={{ textTransform: 'capitalize' }}>
              {status === 'todo' ? 'To Do' : status === 'in_progress' ? 'In Progress' : 'Done'}
            </h3>
            {tasks
              .filter(t => t.status === status)
              .map(task => (
                <div
                  key={task.id}
                  className={`task-card ${task.overdue ? 'overdue' : ''}`}
                  style={{
                    border: '1px solid #999',
                    padding: '0.75rem',
                    margin: '0.5rem 0',
                    backgroundColor: task.overdue ? '#ffe6e6' : '#f9f9f9'
                  }}
                >
                  <h4>{task.title}</h4>
                  {task.deadline && (
                    <p>Due: {new Date(task.deadline).toLocaleString()}</p>
                  )}
                  {task.assignee_name && (
                    <p>Assigned to: {task.assignee_name}</p>
                  )}
                  <div className="task-actions" style={{ marginTop: '0.5rem' }}>
                    {status === 'todo' && (
                      <button onClick={() => updateStatus(task.id, 'in_progress')}>
                        Start
                      </button>
                    )}
                    {status === 'in_progress' && (
                      <>
                        <button onClick={() => updateStatus(task.id, 'done')}>
                          Complete
                        </button>
                        <button onClick={() => updateStatus(task.id, 'todo')}>
                          Back
                        </button>
                      </>
                    )}
                    <button onClick={() => deleteTask(task.id)}>Delete</button>
                  </div>
                </div>
              ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default Tasks;
