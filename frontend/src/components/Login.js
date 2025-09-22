import React, { useState } from 'react';
import api from '../api';

function Login({ onLogin }) {
  const [form, setForm] = useState({ username: '', password: '', isRegister: false });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const endpoint = form.isRegister ? '/register' : '/login';
      const response = await api.post(endpoint, form);
      if (!form.isRegister) {
        onLogin(response.data);
      } else {
        alert('Registration successful! Please login with your credentials.');
        setForm({ ...form, isRegister: false, password: '' });
      }
    } catch (error) {
      alert('Error: ' + error.response?.data?.error || 'Failed');
    }
  };

  return (
    <div className="login-container">
      <form onSubmit={handleSubmit}>
        <h2>{form.isRegister ? 'Register' : 'Login'}</h2>
        <input
          type="text"
          placeholder="Username"
          value={form.username}
          onChange={(e) => setForm({ ...form, username: e.target.value })}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          required
        />
        {form.isRegister && (
          <select onChange={(e) => setForm({ ...form, role: e.target.value })}>
            <option value="developer">Developer</option>
            <option value="manager">Manager</option>
            <option value="admin">Admin</option>
          </select>
        )}
        <button type="submit">{form.isRegister ? 'Register' : 'Login'}</button>
        <p onClick={() => setForm({ ...form, isRegister: !form.isRegister })}>
          {form.isRegister ? 'Have an account? Login' : 'Need an account? Register'}
        </p>
      </form>
    </div>
  );
}

export default Login;
