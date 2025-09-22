import React, { useState, useEffect } from 'react';
import api from '../api';

function Projects() {
  const [projects, setProjects] = useState([]);
  const [form, setForm] = useState({ name: '', description: '' });
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = () => api.get('/projects').then(res => setProjects(res.data));

  const handleSubmit = async (e) => {
    e.preventDefault();
    await api.post('/projects', form);
    setForm({ name: '', description: '' });
    setShowForm(false);
    loadProjects();
  };

  const deleteProject = async (id) => {
    await api.delete(`/projects/${id}`);
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
          </div>
        ))}
      </div>
    </div>
  );
}

export default Projects;
