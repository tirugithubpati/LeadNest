import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getCurrentUser } from '../api/authApi';
import LoadingAnimation from './LoadingAnimation';
import '../styles/Dashboard.css';
import Footer from './Footer';

const LogoutModal = ({ isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Confirm Logout</h2>
        </div>
        <div className="modal-body">
          <p>Are you sure you want to log out?</p>
          <div className="modal-actions">
            <div className="modal-buttons">
            <button className="cancel-button" onClick={onClose}>
              Cancel
            </button>
            <button className="logout-confirm-button" onClick={onConfirm}>
              Logout
            </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [lockActive, setLockActive] = useState(true);

  // Strong navigation lock logic
  useEffect(() => {
    // Push a new state so that back button stays on dashboard
    window.history.pushState(null, '', window.location.pathname);

    const handlePopState = (event) => {
      if (lockActive) {
        // Always push back to dashboard
        window.history.pushState(null, '', window.location.pathname);
      }
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [lockActive]);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        await getCurrentUser();
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const handleLogoutClick = () => {
    setShowLogoutModal(true);
  };

  const handleLogoutConfirm = async () => {
    try {
      setLockActive(false); // Release lock before logout
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-wrapper">
        <LoadingAnimation message="Loading your dashboard..." />
      </div>
    );
  }

  return (
    <div className="dashboard-wrapper">
      <div className="dashboard-content">
        <div className="top-bar">
          <div className="header-left">
            <img src="/logo.png" alt="KarmaSync" className="dashboard-logo" />
            <div className="header-content">
              <h1>Welcome to KarmaSync</h1>
              <p className="dashboard-subtitle">Your productivity companion</p>
            </div>
          </div>
          <button className="logout-button" onClick={handleLogoutClick}>
            <i className="fas fa-sign-out-alt"></i>
            Logout
          </button>
        </div>

        <div className="content-container">
          <div className="message-box">
            <h2>Maximize Your Productivity</h2>
            <p>
            KarmaSync helps you manage projects, track tasks, and collaborate with your team. Stay organized, meet deadlines, and achieve goals with our powerful tools and features.
            </p>
            <div className="message-footer">
              Here's what you can do:
            </div>
          </div>

          <div className="feature-grid">
            <Link to="/projects" className="feature-card">
              <div className="feature-icon">
                <i className="fas fa-project-diagram"></i>
              </div>
              <h3>Projects</h3>
              <p>Manage your projects and track progress</p>
            </Link>

            <Link to="/todos" className="feature-card">
              <div className="feature-icon">
                <i className="fas fa-tasks"></i>
              </div>
              <h3>My To-dos</h3>
              <p>Organize and track your daily tasks</p>
            </Link>

            <Link to="/profile" className="feature-card">
              <div className="feature-icon">
                <i className="fas fa-user"></i>
              </div>
              <h3>Profile</h3>
              <p>View and update your profile settings</p>
            </Link>

            <Link to="/contact" className="feature-card">
              <div className="feature-icon">
                <i className="fas fa-envelope"></i>
              </div>
              <h3>Contact Us</h3>
              <p>Get in touch with our support team</p>
            </Link>
          </div>
        </div>
      </div>

      <LogoutModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleLogoutConfirm}
      />
      <Footer />
    </div>
  );
};

export default Dashboard;