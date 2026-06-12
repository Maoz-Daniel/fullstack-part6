import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { loginUser, registerUser } from '../services/authService.js';

const INITIAL_FORM_DATA = {
  name: '',
  username: '',
  email: '',
  password: '',
  phone: '',
  website: '',
};

export function RegisterPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
    if (error) setError('');
  }

  function validateForm() {
    if (!formData.name.trim()) return 'Name is required.';
    if (!formData.username.trim()) return 'Username is required.';
    if (!formData.email.trim()) return 'Email is required.';
    if (formData.password.length < 6) return 'Password must be at least 6 characters.';
    return '';
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);
    let didCreateUser = false;
    try {
      const username = formData.username.trim();
      const password = formData.password;

      await registerUser({
        name: formData.name.trim(),
        username,
        email: formData.email.trim(),
        password,
        phone: formData.phone.trim(),
        website: formData.website.trim(),
      });
      didCreateUser = true;

      const authSession = await loginUser({ username, password });
      const savedSession = login(authSession);
      navigate(`/users/${savedSession.user.username}/posts`, { replace: true });
    } catch (err) {
      setError(
        err.message || (didCreateUser ? 'Account created, but automatic login failed.' : 'Registration failed.')
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="app app--public">
      <section className="auth-panel auth-panel--wide">
        <p className="eyebrow">Create account</p>
        <h1>Register</h1>
        <p className="panel-copy">Create a user record and open the application area.</p>

        <form className="form form--grid" onSubmit={handleSubmit}>
          <label className="form-field">
            <span>Name</span>
            <input name="name" value={formData.name} onChange={handleChange} />
          </label>

          <label className="form-field">
            <span>Username</span>
            <input name="username" value={formData.username} onChange={handleChange} />
          </label>

          <label className="form-field">
            <span>Email</span>
            <input name="email" type="email" value={formData.email} onChange={handleChange} />
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

          <label className="form-field">
            <span>Phone</span>
            <input name="phone" value={formData.phone} onChange={handleChange} />
          </label>

          <label className="form-field">
            <span>Website</span>
            <input name="website" value={formData.website} onChange={handleChange} />
          </label>

          {error ? <p className="form-error form-error--wide">{error}</p> : null}

          <div className="button-row button-row--wide">
            <button className="button" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Register'}
            </button>
            <Link className="button button--secondary" to="/login">
              Login
            </Link>
          </div>
        </form>
      </section>
    </main>
  );
}
