import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { loginUser } from '../services/authService.js';

export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
    if (error) setError('');
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!formData.username.trim() || !formData.password) {
      setError('Username and password are required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const authSession = await loginUser({
        username: formData.username.trim(),
        password: formData.password,
      });
      const savedSession = login(authSession);
      navigate(`/users/${savedSession.user.username}/posts`, { replace: true });
    } catch (err) {
      setError(err.message || 'Invalid username or password.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="app app--public">
      <section className="auth-panel">
        <p className="eyebrow">Welcome back</p>
        <h1>Login</h1>
        <p className="panel-copy">Enter an existing username and password from the database.</p>

        <form className="form" onSubmit={handleSubmit}>
          <label className="form-field">
            <span>Username</span>
            <input name="username" value={formData.username} onChange={handleChange} />
          </label>

          <label className="form-field">
            <span>Password</span>
            <input
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
            />
          </label>

          {error ? <p className="form-error">{error}</p> : null}

          <div className="button-row">
            <button className="button" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Checking...' : 'Login'}
            </button>
            <Link className="button button--secondary" to="/register">
              Register
            </Link>
          </div>
        </form>
      </section>
    </main>
  );
}
