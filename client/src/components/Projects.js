import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProjects, createProject, updateProject, deleteProject } from '../api/projectApi';
import LoadingAnimation from './LoadingAnimation';
import '../styles/Projects.css';
import Footer from './Footer';

const Projects = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: ''
  });

  useEffect(() => {
    console.log('Projects component mounted');
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      console.log('Fetching projects...');
      const data = await getProjects();
      console.log('Projects fetched successfully:', data);
      setProjects(data);
      setError('');
    } catch (err) {
      console.error('Error fetching projects:', err);
      setError('Failed to fetch projects');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      console.log('Submitting project data:', formData);
      if (editingProject) {
        console.log('Updating existing project:', editingProject._id);
        await updateProject(editingProject._id, formData);
        console.log('Project updated successfully');
      } else {
        console.log('Creating new project');
        console.log('Form data being sent:', formData);
        const response = await createProject(formData);
        console.log('Project created successfully:', response);
      }
      setShowForm(false);
      setEditingProject(null);
      setFormData({ title: '', description: '' });
      fetchProjects();
    } catch (err) {
      console.error('Error in handleSubmit:', err);
      setError(err.response?.data?.message || 'Failed to create project');
    }
  };

  const handleEdit = (project) => {
    console.log('Editing project:', project);
    setEditingProject(project);
    setFormData({
      title: project.title,
      description: project.description
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this project?')) {
      try {
        console.log('Deleting project:', id);
        await deleteProject(id);
        console.log('Project deleted successfully');
        fetchProjects();
      } catch (err) {
        console.error('Error deleting project:', err);
        setError('Failed to delete project');
      }
    }
  };

  const handleProjectTypeSelect = (type) => {
    if (type === 'personal') {
      navigate('/create-personal-project');
    } else {
      navigate('/create-collaborative-project');
    }
    setShowTypeModal(false);
  };

  if (loading) {
    return <LoadingAnimation message="Loading your projects..." />;
  }

  return (
    <div className="projects-container">
      <div className="projects-header">
        <div className="projects-header-content">
          <div className="projects-header-left">
            <h1>My Projects</h1>
          </div>
          <div className="projects-header-actions">
            <button 
              className="projects-back-btn"
              onClick={() => navigate('/dashboard')}
            >
              <i className="fas fa-arrow-left"></i> Back to Dashboard
            </button>
            <button 
              className="create-project-button"
              onClick={() => setShowTypeModal(true)}
            >
              <i className="fas fa-plus"></i> Create New Project
            </button>
          </div>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="projects-list-container">
        <div className="projects-list">
          {projects.length === 0 ? (
            <div className="project-item" style={{ textAlign: 'center' }}>
              <h3>No Projects Found</h3>
              <p>Create your first project to get started!</p>
            </div>
          ) : (
            projects.map(project => (
              <div 
                key={project._id} 
                className="project-item"
                onClick={() => navigate(`/project/${project._id}/overview`)}
              >
                <div className="project-item-header">
                  <h3 className="project-item-title">{project.title}</h3>
                  <span className={`project-type-badge ${project.projectType}`}>
                    {project.projectType.charAt(0).toUpperCase() + project.projectType.slice(1)}
                  </span>
                </div>
                <p className="project-item-description">{project.description}</p>
              </div>
            ))
          )}
        </div>
      </div>

      {showTypeModal && (
  <div className="modal-overlay">
    <div className="project-type-modal">
      <button 
        className="project-type-modal-close" 
        onClick={() => setShowTypeModal(false)} 
        aria-label="Close"
      >
        &times;
      </button>
      <h2>Select Project Type</h2>
      <div className="project-type-options">
        <div 
          className="project-type-option"
          onClick={() => handleProjectTypeSelect('personal')}
        >
          <h3>Personal Project</h3>
          <p>Create a project that you'll manage on your own</p>
        </div>
        <div 
          className="project-type-option"
          onClick={() => handleProjectTypeSelect('collaborative')}
        >
          <h3>Collaborative Project</h3>
          <p>Create a project and invite team members</p>
        </div>
      </div>
    </div>
  </div>
)}

      <Footer />
    </div>
  );
};

export default Projects; 