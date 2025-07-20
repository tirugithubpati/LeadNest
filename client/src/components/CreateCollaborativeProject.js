import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { createProject } from '../api/projectApi';
import { searchUsers } from '../api/userApi';
import LoadingAnimation from './LoadingAnimation';
import '../styles/CreateCollaborativeProject.css';
import Footer from './Footer';

const ROLE_TYPES = {
  MANAGER: 'manager',
  DEVELOPER: 'developer'
};

const CreateCollaborativeProject = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedCollaborators, setSelectedCollaborators] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    githubLink: '',
    projectType: 'collaborative'
  });

  const debouncedSearch = useCallback(
    async (term) => {
      if (term.length < 2) {
        setSearchResults([]);
        return;
      }

      setSearchLoading(true);
      try {
        console.log('Searching for users with term:', term);
        const results = await searchUsers(term);
        console.log('Search results:', results);
        
        const filteredResults = results.filter(user => 
          !selectedCollaborators.some(collab => collab._id === user._id)
        );
        console.log('Filtered results (excluding selected collaborators):', filteredResults);
        
        setSearchResults(filteredResults);
      } catch (err) {
        console.error('Error searching users:', {
          message: err.message,
          response: err.response?.data,
          status: err.response?.status,
          stack: err.stack
        });
        setError('Failed to search users. Please try again.');
      } finally {
        setSearchLoading(false);
      }
    },
    [selectedCollaborators]
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      debouncedSearch(searchTerm);
    }, 300); 

    return () => clearTimeout(timer);
  }, [searchTerm, debouncedSearch]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleAddCollaborator = (user) => {
    setSelectedUser(user);
    setShowRoleModal(true);
    setSearchResults([]);
    setSearchTerm('');
  };

  const handleRoleSelect = (role) => {
    if (selectedUser) {
      setSelectedCollaborators(prev => [...prev, { ...selectedUser, role }]);
      setShowRoleModal(false);
      setSelectedUser(null);
    }
  };

  const handleRemoveCollaborator = (userId) => {
    setSelectedCollaborators(prev => 
      prev.filter(collab => collab._id !== userId)
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedCollaborators.length === 0) {
      setError('Please add at least one collaborator');
      return;
    }

    setLoading(true);
    try {
      const projectData = {
        ...formData,
        collaborators: selectedCollaborators.map(collab => ({
          userId: collab._id,
          role: collab.role
        }))
      };
      await createProject(projectData);
      navigate('/projects');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingAnimation message="Creating project..." />;

  return (
    <div className="projects-container">
      <div className="projects-header">
        <div className="projects-header-content">
          <div className="projects-header-left">
            <h1>Create Collaborative Project</h1>
          </div>
          <button 
            className="back-to-dashboard-button"
            onClick={() => navigate('/projects')}
          >
            <i className="fas fa-arrow-left"></i> Back to Projects
          </button>
        </div>
      </div>

      <div className="project-form-container">
        <form onSubmit={handleSubmit} className="project-form">
          {error && <div className="error-message">{error}</div>}

          <div className="form-group">
            <label htmlFor="title">Project Name*</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="Enter project name"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Enter project description"
              rows="4"
            />
          </div>

          <div className="form-group">
            <label htmlFor="collaborators">Collaborators*</label>
            <div className="collaborator-search-container">
              <input
                type="text"
                id="collaborators"
                placeholder="Search users by username"
                value={searchTerm}
                onChange={handleSearch}
                className="collaborator-search-input"
              />
              {searchResults.length > 0 && (
                <div className="search-results">
                  {searchResults.map(user => (
                    <div 
                      key={user._id} 
                      className="search-result-item"
                      onClick={() => handleAddCollaborator(user)}
                    >
                      <div className="user-info">
                        <span className="username">{user.username}</span>
                        <span className="user-email">{user.email}</span>
                      </div>
                      <i className="fas fa-plus add-icon"></i>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="selected-collaborators">
              {selectedCollaborators.map(collab => (
                <div key={collab._id} className="collaborator-tag">
                  <div className="collaborator-info">
                    <span className="username">{collab.username}</span>
                    <span className="user-email">{collab.email}</span>
                    <span className={`collaborator-role ${collab.role}`}>
                      {collab.role === ROLE_TYPES.MANAGER ? 'Project Manager' : 'Developer'}
                    </span>
                  </div>
                  <button 
                    type="button"
                    onClick={() => handleRemoveCollaborator(collab._id)}
                    className="remove-collaborator"
                    title="Remove collaborator"
                  >
                    <span className="cross-icon">×</span>
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="githubLink">GitHub Link</label>
            <input
              type="url"
              id="githubLink"
              name="githubLink"
              value={formData.githubLink}
              onChange={handleInputChange}
              placeholder="Enter GitHub repository URL"
            />
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-primary">
              Create Project
            </button>
            <button 
              type="button" 
              className="btn btn-secondary"
              onClick={() => navigate('/projects')}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>

      {showRoleModal && (
        <div className="modal-overlay">
          <div className="role-selection-modal">
            <h3>Select Role for {selectedUser?.username}</h3>
            <div className="role-options">
              <button
                className="role-option manager"
                onClick={() => handleRoleSelect(ROLE_TYPES.MANAGER)}
              >
                <h4>Project Manager</h4>
                <p>Full access to project management</p>
                <ul>
                  <li>Create, edit, and delete tasks</li>
                  <li>Manage project details</li>
                  <li>Manage collaborators</li>
                  <li>Full commenting access</li>
                </ul>
              </button>
              <button
                className="role-option developer"
                onClick={() => handleRoleSelect(ROLE_TYPES.DEVELOPER)}
              >
                <h4>Developer</h4>
                <p>Task execution and updates</p>
                <ul>
                  <li>View and update task status</li>
                  <li>Comment on any tasks tasks</li>
                  <li>Limited project access</li>
                </ul>
              </button>
            </div>
            <button
              className="close-modal"
              onClick={() => {
                setShowRoleModal(false);
                setSelectedUser(null);
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      <Footer />
    </div>
  );
};

export default CreateCollaborativeProject; 