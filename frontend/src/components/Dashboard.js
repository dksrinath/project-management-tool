import React, { useState, useEffect } from 'react';
import api from '../api';

function Dashboard() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get('/dashboard').then(res => setStats(res.data));
  }, []);

  if (!stats) return <div>Loading...</div>;

  return (
    <div className="dashboard">
      <h1>Dashboard</h1>
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Projects</h3>
          <p>{stats.stats.total_projects}</p>
        </div>
        <div className="stat-card">
          <h3>Tasks</h3>
          <p>{stats.stats.total_tasks}</p>
        </div>
        <div className="stat-card">
          <h3>To Do</h3>
          <p>{stats.stats.todo}</p>
        </div>
        <div className="stat-card">
          <h3>In Progress</h3>
          <p>{stats.stats.in_progress}</p>
        </div>
        <div className="stat-card">
          <h3>Done</h3>
          <p>{stats.stats.done}</p>
        </div>
        <div className="stat-card warning">
          <h3>Overdue</h3>
          <p>{stats.stats.overdue}</p>
        </div>
      </div>
      <div className="recent-tasks">
        <h2>Recent Tasks</h2>
        {stats.recent_tasks.map(task => (
          <div key={task.id} className="task-item">
            <span>{task.title}</span>
            <span className={`status ${task.status}`}>{task.status}</span>
            <span>{task.project}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Dashboard;
