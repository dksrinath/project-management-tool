import React, { useState, useEffect } from 'react';
import api from '../api';

function UserStoryGenerator() {
  const [description, setDescription] = useState('');
  const [stories, setStories] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/projects').then(res => setProjects(res.data));
  }, []);

  const generateStories = async () => {
    setLoading(true);
    try {
      const response = await api.post('/ai/generate-user-stories', {
        projectDescription: description,
        projectId: selectedProject || null
      });
      setStories(response.data);
    } catch (error) {
      alert('Failed to generate stories');
    }
    setLoading(false);
  };

  return (
    <div className="story-generator">
      <h1>AI User Story Generator</h1>
      <div className="generator-form">
        <textarea
          placeholder="Describe your project..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows="5"
        />
        <select value={selectedProject} onChange={(e) => setSelectedProject(e.target.value)}>
          <option value="">Don't link to project</option>
          {projects.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        <button onClick={generateStories} disabled={loading || !description}>
          {loading ? 'Generating...' : 'Generate Stories'}
        </button>
      </div>

      {stories.length > 0 && (
        <div className="stories-list">
          <h2>Generated User Stories</h2>
          {stories.map((story, index) => (
            <div key={index} className="story-item">{story}</div>
          ))}
        </div>
      )}
    </div>
  );
}

export default UserStoryGenerator;
