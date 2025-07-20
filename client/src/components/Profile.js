  import React, { useState, useEffect } from 'react';
  import { useNavigate } from 'react-router-dom';
  import { useAuth } from '../context/AuthContext';
  import { getCurrentUser, updateProfile, deleteAccount } from '../api/authApi';
  import LoadingAnimation from './LoadingAnimation';
import Footer from './Footer';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import '../styles/Profile.css';

  const DeleteAccountModal = ({ isOpen, onClose, onConfirm }) => {
    const [deleteText, setDeleteText] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e) => {
      e.preventDefault();
      if (deleteText === 'DELETE') {
        setError('');
        onConfirm();
      } else {
        setError('Please type "DELETE" to confirm');
      }
    };

    if (!isOpen) return null;

    return (
      <div className="modal-overlay">
        <div className="modal-content">
          <div className="modal-header">
            <h2>Delete Account</h2>
            {/* Removed close 'x' button */}
          </div>
          <div className="modal-body">
            <p className="modal-warning">
              Are you sure you want to delete your account? This action cannot be undone and you will lose all your data.
            </p>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Type "DELETE" to confirm:</label>
                <input
                  type="text"
                  value={deleteText}
                  onChange={(e) => setDeleteText(e.target.value)}
                  className="form-control"
                  placeholder='Type "DELETE"'
                />
              </div>
              {error && <div className="error-message">{error}</div>}
              <div className="modal-actions">
                <button type="button" className="cancel-button" onClick={onClose}>
                  Cancel
                </button>
                <button type="submit" className="delete-button">
                  Delete Account
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  };

  const Profile = () => {
    const { logout } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [userData, setUserData] = useState(null);
    const [editMode, setEditMode] = useState(false);
    const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
    const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
    const [formData, setFormData] = useState({
      fullName: '',
      username: '',
      email: ''
    });
  const [showPasswordForm, setShowPasswordForm] = useState(false);
    const [passwordData, setPasswordData] = useState({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showPassword, setShowPassword] = useState({
      current: false,
      new: false,
      confirm: false
    });
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    useEffect(() => {
      console.log('Profile component mounted');
      fetchUserData();
    }, []);

  useEffect(() => {
    let timer;
    if (error || success) {
      timer = setTimeout(() => {
        setError('');
        setSuccess('');
      }, 4000);
    }
    return () => clearTimeout(timer);
  }, [error, success]);

    const fetchUserData = async () => {
      try {
        console.log('Fetching user data...');
        setLoading(true);
        const user = await getCurrentUser();
        console.log('User data received:', user);
        setUserData(user);
        setFormData(prev => ({ ...prev, fullName: user.fullName, username: user.username, email: user.email }));
      } catch (error) {
        console.error('Error fetching user data:', error);
        console.error('Error details:', {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status
        });
        setError('Failed to load profile data');
      } finally {
        setLoading(false);
      }
    };

    const handleInputChange = (e) => {
      const { name, value } = e.target;
      console.log('Input changed:', { name, value });
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
      setError('');
    };

    const handlePasswordChange = (e) => {
      const { name, value } = e.target;
      setPasswordData(prev => ({
        ...prev,
        [name]: value
      }));
      setError('');
    };

    const togglePasswordVisibility = (field) => {
      setShowPassword(prev => ({
        ...prev,
        [field]: !prev[field]
      }));
    };

    const handleUpdateProfile = async (e) => {
    e.preventDefault(); 
    if (!editMode) return; 

      console.log('Updating profile with data:', formData);
      setError('');
      setSuccess('');
      setIsUpdatingProfile(true);

      if (!formData.fullName.trim()) {
        setError('Full name is required');
        setIsUpdatingProfile(false);
        return;
      }
      if (!formData.username.trim()) {
        setError('Username is required');
        setIsUpdatingProfile(false);
        return;
      }
      if (!formData.email.trim()) {
        setError('Email is required');
        setIsUpdatingProfile(false);
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        setError('Please enter a valid email address');
        setIsUpdatingProfile(false);
        return;
      }

      try {
        const response = await updateProfile({
          fullName: formData.fullName,
          username: formData.username,
          email: formData.email
        });
        console.log('Profile update response:', response);

        setSuccess('Profile updated successfully');
        setEditMode(false);
        await fetchUserData(); 
      } catch (error) {
        console.error('Profile update error:', error);
        console.error('Error details:', {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status
        });
        
        if (error.response?.data?.message?.includes('username')) {
          setError('Username is already taken');
        } else if (error.response?.data?.message?.includes('email')) {
          setError('Email is already registered');
        } else {
          setError(error.message || 'Failed to update profile');
        }
      } finally {
        setIsUpdatingProfile(false);
      }
    };

    const handleUpdatePassword = async (e) => {
      e.preventDefault();
      setError('');
      setSuccess('');
      setIsUpdatingPassword(true);

      if (!passwordData.currentPassword) {
        setError('Current password is required');
        setIsUpdatingPassword(false);
        return;
      }
      if (!passwordData.newPassword) {
        setError('New password is required');
        setIsUpdatingPassword(false);
        return;
      }
      if (passwordData.newPassword.length < 6) {
        setError('New password must be at least 6 characters long');
        setIsUpdatingPassword(false);
        return;
      }
      if (passwordData.newPassword !== passwordData.confirmPassword) {
        setError('New passwords do not match');
        setIsUpdatingPassword(false);
        return;
      }

      try {
        const response = await updateProfile({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        });
        console.log('Password update response:', response);

        setSuccess('Password updated successfully');
        setShowPasswordForm(false);
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      } catch (error) {
        console.error('Password update error:', error);
        if (error.response?.data?.message?.includes('current password')) {
          setError('Current password is incorrect');
        } else {
          setError(error.message || 'Failed to update password');
        }
      } finally {
        setIsUpdatingPassword(false);
      }
    };

    const handleDeleteAccount = async () => {
      setShowDeleteModal(true);
    };

    const handleConfirmDelete = async () => {
      try {
        setError('');
        await deleteAccount();
        
        const successModal = document.createElement('div');
        successModal.className = 'modal-overlay';
        successModal.innerHTML = `
          <div class="modal-content success-modal">
            <div class="modal-header">
              <h2>Account Deleted</h2>
            </div>
            <div class="modal-body">
              <p>Your account has been successfully deleted. You will be redirected to the home page.</p>
            </div>
          </div>
        `;
        document.body.appendChild(successModal);
        
        setTimeout(() => {
          document.body.removeChild(successModal);
          logout();
          navigate('/');
        }, 2000);
      } catch (error) {
        setError(error.message || 'Failed to delete account. Please try again.');
        setShowDeleteModal(false);
      }
    };

    if (loading) {
      return <LoadingAnimation message="Loading your profile..." />;
    }

    return (
      <div className="profile-wrapper">
          <div className="profile-header">
            <div className="profile-header-content">
              <div className="profile-header-left">
                <h1>Profile Settings</h1>
                <p className="profile-subtitle">Manage your account information</p>
              </div>
              <button 
            className="profile-back-btn"
                onClick={() => navigate('/dashboard')}
              >
                <i className="fas fa-arrow-left"></i> Back to Dashboard
              </button>
            </div>
          </div>

      <div className="profile-main-content">
          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}

          <div className="profile-card">
              <div className="profile-info">
                <div className="info-group">
                  <label>Full Name</label>
              {editMode ? (
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                  className="info-input"
                    required
                  />
              ) : (
                <p>{userData?.fullName}</p>
              )}
                </div>
            <div className="info-group">
              <label>Username</label>
              {editMode ? (
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                  className="info-input"
                    required
                  />
              ) : (
                <p>{userData?.username}</p>
              )}
                </div>
            <div className="info-group">
              <label>Email</label>
              {editMode ? (
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                  className="info-input"
                    required
                  />
              ) : (
                <p>{userData?.email}</p>
              )}
                </div>
            <div className="profile-actions">
              {editMode ? (
                <>
                  {isUpdatingProfile ? (
                    <div className="loading-container">
                      <LoadingAnimation message="Updating profile..." />
                    </div>
                  ) : (
                    <>
                      <button 
                        type="button" 
                        className="save-button"
                        onClick={handleUpdateProfile}
                      >
                        Save Changes
                      </button>
                      <button 
                        type="button" 
                        className="cancel-button"
                        onClick={() => {
                          setEditMode(false);
                          setFormData({
                            fullName: userData.fullName,
                            username: userData.username,
                            email: userData.email
                          });
                          setError('');
                        }}
                      >
                        Cancel
                      </button>
                    </>
                  )}
                </>
              ) : (
                <>
                  <button 
                    type="button"
                    className="edit-button"
                    onClick={() => {
                      setEditMode(true);
                      setError('');
                      setSuccess('');
                    }}
                  >
                    Edit Profile
                  </button>
                  <button 
                    type="button" 
                    className="change-password-button"
                    onClick={() => setShowPasswordForm(true)}
                  >
                    Change Password
                  </button>
                </>
              )}
            </div>
                </div>

            {showPasswordForm && (
            <>
              <div className="password-form-overlay" onClick={() => setShowPasswordForm(false)} />
              <div className="password-form-container">
                <h3>Change Password</h3>
                {isUpdatingPassword ? (
                  <div className="loading-container">
                    <LoadingAnimation message="Updating password..." />
                  </div>
                ) : (
                  <form onSubmit={handleUpdatePassword} className="password-form">
                    <div className="form-group password-group">
                      <label htmlFor="currentPassword">Current Password</label>
                      <div className="password-input-group">
                        <input
                          type={showPassword.current ? "text" : "password"}
                          id="currentPassword"
                          name="currentPassword"
                          value={passwordData.currentPassword}
                          onChange={handlePasswordChange}
                          required
                        />
                        <button
                          type="button"
                          className="password-toggle"
                          onClick={() => togglePasswordVisibility('current')}
                          data-visible={showPassword.current}
                        >
                          {showPassword.current ? <FaEyeSlash /> : <FaEye />}
                        </button>
                      </div>
                    </div>

                    <div className="form-group password-group">
                      <label htmlFor="newPassword">New Password</label>
                      <div className="password-input-group">
                        <input
                          type={showPassword.new ? "text" : "password"}
                          id="newPassword"
                          name="newPassword"
                          value={passwordData.newPassword}
                          onChange={handlePasswordChange}
                          required
                        />
                        <button
                          type="button"
                          className="password-toggle"
                          onClick={() => togglePasswordVisibility('new')}
                          data-visible={showPassword.new}
                        >
                          {showPassword.new ? <FaEyeSlash /> : <FaEye />}
                        </button>
                      </div>
                    </div>

                    <div className="form-group password-group">
                      <label htmlFor="confirmPassword">Confirm New Password</label>
                      <div className="password-input-group">
                        <input
                          type={showPassword.confirm ? "text" : "password"}
                          id="confirmPassword"
                          name="confirmPassword"
                          value={passwordData.confirmPassword}
                          onChange={handlePasswordChange}
                          required
                        />
                        <button
                          type="button"
                          className="password-toggle"
                          onClick={() => togglePasswordVisibility('confirm')}
                          data-visible={showPassword.confirm}
                        >
                          {showPassword.confirm ? <FaEyeSlash /> : <FaEye />}
                        </button>
                      </div>
                    </div>

                    <div className="form-actions">
                      <button type="submit" className="save-button">
                        Update Password
                      </button>
                      <button 
                        type="button" 
                        className="cancel-button"
                        onClick={() => {
                          setShowPasswordForm(false);
                          setPasswordData({
                            currentPassword: '',
                            newPassword: '',
                            confirmPassword: ''
                          });
                          setShowPassword({
                            current: false,
                            new: false,
                            confirm: false
                          });
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </>
            )}

            <div className="danger-zone">
              <h3>Danger Zone</h3>
              <p className="danger-text">
                Once you delete your account, there is no going back. Please be certain.
              </p>
              <button 
                className="delete-button"
                onClick={handleDeleteAccount}
              >
                Delete Account
              </button>
            </div>
          </div>
      </div>
      <Footer />

          {/* Delete Account Modal */}
          <DeleteAccountModal
            isOpen={showDeleteModal}
            onClose={() => setShowDeleteModal(false)}
            onConfirm={handleConfirmDelete}
          />
      </div>
    );
  };

  export default Profile; 