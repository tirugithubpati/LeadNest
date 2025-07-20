import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createProject } from '../api/projectApi';
import LoadingAnimation from './LoadingAnimation';
import Footer from './Footer';
import '../styles/CreatePersonalProject.css';

const CreatePersonalProject = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    githubLink: '',
    projectType: 'personal'
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      console.log('Creating personal project:', formData);
      const response = await createProject(formData);
      console.log('Project created successfully:', response);
      navigate(`/project/${response._id}/overview`);
    } catch (err) {
      console.error('Error creating project:', err);
      setError(err.message || 'Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingAnimation message="Creating your project..." />;

  return (
    <div className="projects-container">
      <div className="projects-header">
        <div className="projects-header-content">
          <div className="projects-header-left">
            <h1>Create Personal Project</h1>
          </div>
          <div className="projects-header-actions">
            <button 
              className="back-to-dashboard-button"
              onClick={() => navigate('/projects')}
            >
              <i className="fas fa-arrow-left"></i> Back to Projects
            </button>
          </div>
        </div>
      </div>

      <div className="project-form-container">
        <form onSubmit={handleSubmit} className="project-form">
          {error && <div className="error-message">{error}</div>}
          
          <div className="form-group">
            <label htmlFor="title">Project Name *</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              required
              placeholder="Enter project name"
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows="4"
              placeholder="Enter project description"
            />
          </div>

          <div className="form-group">
            <label htmlFor="githubLink">GitHub Link</label>
            <input
              type="url"
              id="githubLink"
              name="githubLink"
              value={formData.githubLink}
              onChange={handleInputChange}
              placeholder="https://github.com/username/repository"
              pattern="https://github.com/.*"
            />
            <small className="input-hint">Must be a valid GitHub URL starting with https://github.com/</small>
          </div>

          <div className="form-actions">
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Project'}
            </button>
            <button 
              type="button" 
              className="btn btn-secondary"
              onClick={() => navigate('/projects')}
              disabled={loading}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
      <Footer />
    </div>
  );
};

export default CreatePersonalProject; 