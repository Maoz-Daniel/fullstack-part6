import { useEffect, useState } from 'react';
import { changeUserPassword, updateUserProfile } from '../services/usersService.js';

function buildProfileForm(user) {
  return {
    name: user.name || '',
    username: user.username || '',
    email: user.email || '',
    phone: user.phone || '',
    website: user.website || '',
  };
}

const EMPTY_PASSWORD_FORM = {
  currentPassword: '',
  newPassword: '',
};

export function UserInfoPanel({ user, updateSession, currentPath, onUsernameChange, onClose }) {
  const [profileForm, setProfileForm] = useState(() => buildProfileForm(user));
  const [passwordForm, setPasswordForm] = useState(EMPTY_PASSWORD_FORM);
  const [profileError, setProfileError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [profileMessage, setProfileMessage] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  // Close the popup on Escape, like a native dialog.
  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  function handleProfileChange(event) {
    const { name, value } = event.target;
    setProfileForm((current) => ({ ...current, [name]: value }));
    setProfileError('');
    setProfileMessage('');
  }

  function handlePasswordChange(event) {
    const { name, value } = event.target;
    setPasswordForm((current) => ({ ...current, [name]: value }));
    setPasswordError('');
    setPasswordMessage('');
  }

  async function handleProfileSubmit(event) {
    event.preventDefault();
    const payload = {
      name: profileForm.name.trim(),
      username: profileForm.username.trim(),
      email: profileForm.email.trim(),
      phone: profileForm.phone.trim(),
      website: profileForm.website.trim(),
    };

    if (!payload.name || !payload.username || !payload.email) {
      setProfileError('Name, username, and email are required.');
      return;
    }

    setIsSavingProfile(true);
    setProfileError('');
    setProfileMessage('');

    try {
      const nextSession = await updateUserProfile(user.id, payload);
      const savedSession = updateSession(nextSession);
      setProfileForm(buildProfileForm(savedSession.user));
      setProfileMessage('Profile updated.');

      if (savedSession.user.username !== user.username) {
        onUsernameChange(savedSession.user.username, currentPath);
      }
    } catch (err) {
      setProfileError(err.message || 'Profile update failed.');
    } finally {
      setIsSavingProfile(false);
    }
  }

  async function handlePasswordSubmit(event) {
    event.preventDefault();

    if (!passwordForm.currentPassword || passwordForm.newPassword.length < 6) {
      setPasswordError('Current password is required and new password must be at least 6 characters.');
      return;
    }

    setIsSavingPassword(true);
    setPasswordError('');
    setPasswordMessage('');

    try {
      await changeUserPassword(user.id, passwordForm);
      setPasswordForm(EMPTY_PASSWORD_FORM);
      setPasswordMessage('Password updated.');
    } catch (err) {
      setPasswordError(err.message || 'Password update failed.');
    } finally {
      setIsSavingPassword(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <aside
        className="info-panel info-modal"
        id="user-info"
        role="dialog"
        aria-modal="true"
        aria-label="User information"
        onClick={(event) => event.stopPropagation()}
      >
        <button type="button" className="modal__close" aria-label="Close" onClick={onClose}>
          &times;
        </button>

      <div>
        <p className="eyebrow">Info</p>
        <h2>Personal details</h2>
        <p className="panel-copy">View and update your account details without leaving this page.</p>
      </div>

      <form className="form form--grid profile-form" onSubmit={handleProfileSubmit}>
        <label className="form-field">
          <span>Name</span>
          <input name="name" value={profileForm.name} onChange={handleProfileChange} />
        </label>
        <label className="form-field">
          <span>Username</span>
          <input name="username" value={profileForm.username} onChange={handleProfileChange} />
        </label>
        <label className="form-field">
          <span>Email</span>
          <input name="email" type="email" value={profileForm.email} onChange={handleProfileChange} />
        </label>
        <label className="form-field">
          <span>Phone</span>
          <input name="phone" value={profileForm.phone} onChange={handleProfileChange} />
        </label>
        <label className="form-field form-error--wide">
          <span>Website</span>
          <input name="website" value={profileForm.website} onChange={handleProfileChange} />
        </label>

        {profileError ? <p className="form-error form-error--wide">{profileError}</p> : null}
        {profileMessage ? <p className="form-success form-error--wide">{profileMessage}</p> : null}

        <div className="button-row button-row--wide">
          <button className="button" type="submit" disabled={isSavingProfile}>
            {isSavingProfile ? 'Saving...' : 'Save details'}
          </button>
        </div>
      </form>

      <form className="form form--grid profile-form" onSubmit={handlePasswordSubmit}>
        <div className="profile-section-title form-error--wide">
          <h3>Change password</h3>
          <p>Use your current password before setting a new one.</p>
        </div>
        <label className="form-field">
          <span>Current password</span>
          <input
            name="currentPassword"
            type="password"
            value={passwordForm.currentPassword}
            onChange={handlePasswordChange}
          />
        </label>
        <label className="form-field">
          <span>New password</span>
          <input
            name="newPassword"
            type="password"
            value={passwordForm.newPassword}
            onChange={handlePasswordChange}
          />
        </label>

        {passwordError ? <p className="form-error form-error--wide">{passwordError}</p> : null}
        {passwordMessage ? <p className="form-success form-error--wide">{passwordMessage}</p> : null}

        <div className="button-row button-row--wide">
          <button className="button" type="submit" disabled={isSavingPassword}>
            {isSavingPassword ? 'Saving...' : 'Change password'}
          </button>
        </div>
      </form>
      </aside>
    </div>
  );
}
