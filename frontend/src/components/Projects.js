import React, { useState, useEffect } from 'react';
import api from '../api';

function Projects() {
  const savedUser = JSON.parse(localStorage.getItem('user'));
  const initialRole = savedUser?.role || 'developer';

  const [projects, setProjects] = useState([]);
  const [form, setForm] = useState({ name: '', description: '' });
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [newMemberId, setNewMemberId] = useState('');
  const [allUsers, setAllUsers] = useState([]);
  const [userRole, setUserRole] = useState(initialRole);

  useEffect(() => {
    loadProjects();
    if (userRole === 'admin' || userRole === 'manager') {
      api.get('/users')
        .then(res => setAllUsers(res.data))
        .catch(err => console.error('Failed to load users:', err));
    }
  }, [userRole]);

  const loadProjects = () => {
    api.get('/projects')
      .then(res => setProjects(res.data))
      .catch(err => console.error('Failed to load projects:', err));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/projects', form);
      const projectId = res.data.id;

      // Add selected team members
      if (selectedMembers.length > 0) {
        await Promise.all(
          selectedMembers.map(userId =>
            api.post(`/projects/${projectId}/members`, { user_id: userId })
          )
        );
      }

      setForm({ name: '', description: '' });
      setSelectedMembers([]);
      setShowForm(false);
      loadProjects();
    } catch (err) {
      alert('Failed to create project');
      console.error(err);
    }
  };

  const deleteProject = async (id) => {
    if (!window.confirm('Delete this project?')) return;
    try {
      await api.delete(`/projects/${id}`);
      loadProjects();
    } catch (err) {
      alert('Failed to delete project');
      console.error(err);
    }
  };

  const addMember = async (projectId) => {
    if (!newMemberId) return;
    try {
      await api.post(`/projects/${projectId}/members`, { user_id: newMemberId });
      setNewMemberId('');
      loadProjects();
    } catch (err) {
      alert('Failed to add member');
      console.error(err);
    }
  };

  return (
    <div className="projects">
      <h1>Projects</h1>
      <button onClick={() => setShowForm(!showForm)}>
        {showForm ? 'Cancel' : 'New Project'}
      </button>

      {showForm && (
        <form onSubmit={handleSubmit} style={{ marginBottom: '2rem' }}>
          <input
            type="text"
            placeholder="Project Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <textarea
            placeholder="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          
          {/* Team Assignment at Creation */}
          {(userRole === 'admin' || userRole === 'manager') && (
            <div style={{ marginTop: '1rem' }}>
              <label>Assign Team Members:</label>
              <select
                multiple
                value={selectedMembers}
                onChange={(e) => {
                  const options = Array.from(e.target.selectedOptions);
                  setSelectedMembers(options.map(opt => opt.value));
                }}
                style={{ width: '100%', marginTop: '0.5rem' }}
              >
                {allUsers.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.username} ({user.role})
                  </option>
                ))}
              </select>
            </div>
          )}

          <button type="submit" style={{ marginTop: '1rem' }}>Create</button>
        </form>
      )}

      <div className="project-list">
        {projects.map(project => (
          <div key={project.id} className="project-card" style={{ border: '1px solid #ccc', padding: '1rem', margin: '1rem 0' }}>
            <h3>{project.name}</h3>
            <p>{project.description}</p>
            <div className="project-meta" style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
              <span>Tasks: {project.task_count}</span>
              <span>Status: {project.status}</span>
              {(userRole === 'admin' || userRole === 'manager') && (
                <button onClick={() => deleteProject(project.id)}>Delete</button>
              )}
            </div>

            {/* Team Members List */}
            <div style={{ marginTop: '1rem' }}>
              <h4>Team Members</h4>
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {project.team_members?.map(m => (
                  <li key={m.id}>{m.username} ({m.role})</li>
                ))}
              </ul>
            </div>

            {/* Add Member After Creation */}
            {(userRole === 'admin' || userRole === 'manager') && (
              <div style={{ marginTop: '1rem' }}>
                <h4>Add Team Member</h4>
                <select
                  value={newMemberId}
                  onChange={e => setNewMemberId(e.target.value)}
                  style={{ marginRight: '0.5rem' }}
                >
                  <option value="">Select user</option>
                  {allUsers
                    .filter(u => !project.team_members?.some(tm => tm.id === u.id))
                    .map(u => (
                      <option key={u.id} value={u.id}>
                        {u.username} ({u.role})
                      </option>
                    ))}
                </select>
                <button onClick={() => addMember(project.id)}>Add</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default Projects;
