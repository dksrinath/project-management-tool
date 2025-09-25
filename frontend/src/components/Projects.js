import React, { useState, useEffect } from 'react';
import api from '../api';

function Projects() {
  const [projects, setProjects] = useState([]);
  const [form, setForm] = useState({ name: '', description: '' });
  const [showForm, setShowForm] = useState(false);
  const [newMemberId, setNewMemberId] = useState('');
  const [allUsers, setAllUsers] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [userRole, setUserRole] = useState(localStorage.getItem('role') || 'developer');

  useEffect(() => {
    loadProjects();
    if (userRole === 'admin' || userRole === 'manager') {
      api.get('/users')
        .then(res => setAllUsers(res.data))
        .catch(console.error);
    }
  }, [userRole]);

  const loadProjects = () =>
    api.get('/projects').then(res => setProjects(res.data));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await api.post('/projects', form);
    const projectId = res.data.id;

    // assign selected members
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
  };

  const deleteProject = async (id) => {
    await api.delete(`/projects/${id}`);
    loadProjects();
  };

  const addMember = async (projectId) => {
    if (!newMemberId) return;
    await api.post(`/projects/${projectId}/members`, { user_id: newMemberId });
    setNewMemberId('');
    loadProjects();
  };

  return (
    <div className="projects">
      <h1>Projects</h1>
      <button onClick={() => setShowForm(!showForm)}>New Project</button>

      {showForm && (
        <form onSubmit={handleSubmit}>
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

          {(userRole === 'admin' || userRole === 'manager') && (
            <div>
              <label>Assign Team Members:</label>
              <select
                multiple
                value={selectedMembers}
                onChange={(e) => {
                  const options = Array.from(e.target.selectedOptions);
                  setSelectedMembers(options.map(opt => opt.value));
                }}
              >
                {allUsers.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.username}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button type="submit">Create</button>
        </form>
      )}

      <div className="project-list">
        {projects.map(project => (
          <div key={project.id} className="project-card">
            <h3>{project.name}</h3>
            <p>{project.description}</p>
            <div className="project-meta">
              <span>Tasks: {project.task_count}</span>
              <span>Status: {project.status}</span>
              <button onClick={() => deleteProject(project.id)}>Delete</button>
            </div>

            <div>
              <h4>Team Members</h4>
              <ul>
                {project.team_members?.map(m => (
                  <li key={m.id}>{m.username}</li>
                ))}
              </ul>
            </div>

            {(userRole === 'admin' || userRole === 'manager') && (
              <div>
                <h4>Add Team Member</h4>
                <select
                  value={newMemberId}
                  onChange={e => setNewMemberId(e.target.value)}
                >
                  <option value="">Select user</option>
                  {allUsers
                    .filter(u => !project.team_members?.some(tm => tm.id === u.id))
                    .map(u => (
                      <option key={u.id} value={u.id}>
                        {u.username}
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
