import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Link } from 'react-router-dom';
import config from '../config';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import LoadingAnimation from './LoadingAnimation';
import Footer from './Footer';
import '../styles/ResetPassword.css';

const ResetPassword = () => {
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { token } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      setError('Invalid reset token');
    }
  }, [token]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      console.log('Sending reset password request with token:', token);
      const response = await axios.post(`${config.API_URL}/api/auth/reset-password/${token}`, {
        password: formData.password
      });

      console.log('Reset password response:', response.data);
      setSuccess(true);
      
      setTimeout(() => {
        navigate('/login', { 
          state: { 
            message: 'Password reset successful! Please login with your new password.' 
          }
        });
      }, 3000);
    } catch (error) {
      console.error('Reset password error:', error);
      if (error.response?.status === 400 && error.response?.data?.message?.includes('same as old password')) {
        setError('New password cannot be the same as your old password');
      } else {
        setError(error.response?.data?.message || 'Error resetting password');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="reset-container">
        <div className="reset-content">
          <div className="reset-card">
            <div className="reset-message error">Invalid reset token</div>
            <div className="reset-footer">
              <Link to="/forgot-password" className="reset-link">
                Request a new password reset
              </Link>
              <Link to="/login" className="reset-link">
                Back to Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading) return <LoadingAnimation message="Resetting your password..." />;

  return (
    <div className="reset-container">
      <div className="reset-logo-section">
        <img src="/logo.png" alt="KarmaSync Logo" className="reset-logo" />
        <div className="reset-logo-text">KarmaSync</div>
      </div>
      <div className="reset-content">
        <div className="reset-card">
          <div className="reset-header">
            <h2>Reset Password</h2>
            <p className="reset-subtitle">Enter your new password</p>
          </div>
          
          {error && <div className="reset-message error">{error}</div>}
          {success && (
            <div className="reset-message success">
              Password reset successful, redirecting to login
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="reset-form">
            <div className="form-group password-group">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                required
                className="reset-input"
                placeholder="New Password"
                value={formData.password}
                onChange={handleChange}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
            
            <div className="form-group password-group">
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                required
                className="reset-input"
                placeholder="Confirm New Password"
                value={formData.confirmPassword}
                onChange={handleChange}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
            
            <button 
              type="submit" 
              className="reset-button"
              disabled={loading || success}
            >
              {loading ? 'Resetting Password...' : 'Reset Password'}
            </button>
          </form>
          
          <div className="reset-footer">
            <Link to="/login" className="reset-link">
              Back to Login
            </Link>
            <Link to="/" className="reset-link reset-back-link">
              Back to Home
            </Link>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default ResetPassword; 