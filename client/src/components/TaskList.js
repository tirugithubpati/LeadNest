import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getTasks, createTask } from '../api/taskApi';
import { getProjectById } from '../api/projectApi';
import LoadingAnimation from './LoadingAnimation';
import '../styles/TaskList.css';
import Footer from './Footer';

const TaskList = () => {
  const { id: projectId } = useParams();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [project, setProject] = useState(null);
  const [showAddIssueModal, setShowAddIssueModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [issueFormData, setIssueFormData] = useState({
    title: '',
    description: '',
    type: 'tech',
    status: 'todo',
    deadline: '',
    customType: '',
    assignee: ''
  });
  const [showCustomType, setShowCustomType] = useState(false);

  useEffect(() => {
    fetchProject();
    fetchTasks();
  }, [projectId]);

  const fetchProject = async () => {
    try {
      const data = await getProjectById(projectId);
      setProject(data);
    } catch (err) {
      console.error('Error fetching project:', err);
    }
  };

  const fetchTasks = async () => {
    try {
      const data = await getTasks(projectId);
      console.log('Fetched tasks data:', data);
      setTasks(data);
      setError('');
    } catch (err) {
      console.error('Error fetching tasks:', err);
      console.error('Error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      });
      setError('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleIssueFormChange = (e) => {
    const { name, value } = e.target;
    console.log('Form field changed:', { name, value });
    
    if (name === 'type') {
      if (value === 'custom') {
        setShowCustomType(true);
        setIssueFormData(prev => ({
          ...prev,
          [name]: prev.customType || ''
        }));
      } else {
        setShowCustomType(false);
        setIssueFormData(prev => ({
          ...prev,
          [name]: value,
          customType: ''
        }));
      }
    } else if (name === 'customType') {
      const validatedValue = value.replace(/[^a-zA-Z0-9-_]/g, '');
      setIssueFormData(prev => ({
        ...prev,
        type: validatedValue,
        customType: validatedValue
      }));
    } else if (name === 'assignee') {
      console.log('Assignee changed to:', value);
      setIssueFormData(prev => {
        const newData = {
          ...prev,
          assignee: value || null
        };
        console.log('Updated form data:', newData);
        return newData;
      });
    } else {
      setIssueFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleIssueFormSubmit = async (e) => {
    e.preventDefault();
    try {
      console.log('Form Data before submission:', issueFormData);
      console.log('Selected assignee:', issueFormData.assignee);
      
      const taskData = {
        title: issueFormData.title,
        description: issueFormData.description,
        type: issueFormData.type,
        status: issueFormData.status,
        deadline: issueFormData.deadline,
        projectId: projectId,
        assignee: issueFormData.assignee || null
      };
      
      console.log('Task Data being sent to server:', taskData);

      const newIssue = await createTask(taskData);
      console.log('Response from server after task creation:', newIssue);
      
      const updatedTasks = await getTasks(projectId);
      console.log('Updated tasks after creation:', updatedTasks);
      setTasks(updatedTasks);
      
      setShowAddIssueModal(false);
      setShowCustomType(false);
      setIssueFormData({
        title: '',
        description: '',
        type: 'tech',
        status: 'todo',
        deadline: '',
        customType: '',
        assignee: ''
      });
      setError('');
    } catch (err) {
      console.error('Error creating issue:', err);
      console.error('Error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      });
      setError(err.message || 'Failed to create issue');
    }
  };

  const handleModalClose = () => {
    setShowAddIssueModal(false);
    setShowCustomType(false);
    setIssueFormData({
      title: '',
      description: '',
      type: 'tech',
      status: 'todo',
      deadline: '',
      customType: '',
      assignee: ''
    });
  };

  const ErrorModal = () => (
    <div className="modal-overlay">
      <div className="modal-content error-modal">
        <div className="modal-header">
          <h2>Access Denied</h2>
          <button 
            className="modal-close"
            onClick={() => {
              setShowErrorModal(false);
              setErrorMessage('');
            }}
          >
            ×
          </button>
        </div>
        <div className="modal-body">
          <div className="error-icon">
            <i className="fas fa-exclamation-circle"></i>
          </div>
          <p className="error-message">{errorMessage}</p>
        </div>
        <div className="modal-actions">
          <button 
            className="btn btn-secondary"
            onClick={() => {
              setShowErrorModal(false);
              setErrorMessage('');
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );

  const handleAddIssueClick = () => {
    if (project?.currentUserRole !== 'manager') {
      setErrorMessage('Only Project Managers can add issues');
      setShowErrorModal(true);
      return;
    }
    setShowAddIssueModal(true);
  };

  if (loading) {
    return <LoadingAnimation message="Loading your tasks..." />;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="tasks-container">
      {showErrorModal && <ErrorModal />}
      <div className="tasks-header">
        <div className="tasks-header-content">
          <h2 style={{ 
            color: '#FFFFFF', 
            fontWeight: '800',
            fontSize: '2.5rem',
            textShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
          }}>Project Issues</h2>
          <div className="tasks-header-actions">
            <button 
              className="btn btn-primary"
              onClick={handleAddIssueClick}
            >
              <i className="fas fa-plus"></i> Add Issue
            </button>
            <button 
              className="btn btn-secondary"
              onClick={() => navigate(`/project/${projectId}/kanban`)}
            >
              <i className="fas fa-columns"></i> Back to Kanban Board
            </button>
            <button 
              className="btn btn-secondary"
              onClick={() => navigate(`/project/${projectId}/overview`)}
            >
              <i className="fas fa-arrow-left"></i> Back to Overview
            </button>
          </div>
        </div>
      </div>
      
      {tasks.length === 0 ? (
        <div className="no-tasks">
          <p>No issues found</p>
          <strong>Create your first issue to get started!</strong>
        </div>
      ) : (
        <div className="tasks-list">
          {tasks.map(task => {
            console.log('Rendering task:', task);
            console.log('Task assignee:', task.assignee);
            return (
              <div 
                key={task._id} 
                className="task-item"
                onClick={() => navigate(`/task/${task._id}`)}
                style={{ cursor: 'pointer' }}
              >
                <div className="task-item-header">
                  <h3>
                    <span className="task-id">#{task.serialNumber}</span>
                    {task.title}
                  </h3>
                  <div className="task-badges">
                    <span className={`task-status ${task.status}`}>
                      {task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                    </span>
                  </div>
                </div>
                <div className="task-meta">
                  <span className="task-date">
                    Created: {new Date(task.createdAt).toLocaleDateString()}
                  </span>
                  {task.deadline && (
                    <span className="task-deadline">
                      Deadline: {new Date(task.deadline).toLocaleDateString()}
                    </span>
                  )}
                  {project?.projectType === 'collaborative' && task.assignee && (
                    <span className="task-assignee">
                      Assigned to: {task.assignee.username || task.assignee.fullName || 'Unassigned'}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showAddIssueModal && (
        <div className="modal-overlay">
          <div className="modal-content issue-modal">
            <div className="modal-header">
              <h2>Add New Issue</h2>
              <button 
                className="modal-close"
                onClick={handleModalClose}
              >
                &times;
              </button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleIssueFormSubmit} className="issue-form">
                <div className="form-row">
                <div className="form-group">
                  <label htmlFor="title">Title</label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={issueFormData.title}
                    onChange={handleIssueFormChange}
                    required
                    className="form-control"
                    placeholder="Enter issue title"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="type">Type</label>
                  <select
                    id="type"
                    name="type"
                    value={showCustomType ? 'custom' : issueFormData.type}
                    onChange={handleIssueFormChange}
                    className="form-control"
                  >
                    <option value="tech">Technical</option>
                    <option value="review">Review</option>
                    <option value="bug">Bug</option>
                    <option value="feature">Feature</option>
                    <option value="documentation">Documentation</option>
                    <option value="custom">Custom Type</option>
                  </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="description">Description</label>
                    <textarea
                      id="description"
                      name="description"
                      value={issueFormData.description}
                      onChange={handleIssueFormChange}
                      className="form-control"
                      rows="2"
                      placeholder="Enter issue description"
                    />
                  </div>
                </div>

                <div className="form-row">
                <div className="form-group">
                  <label htmlFor="status">Status</label>
                  <select
                    id="status"
                    name="status"
                    value={issueFormData.status}
                    onChange={handleIssueFormChange}
                    className="form-control"
                  >
                    <option value="todo">To Do</option>
                    <option value="doing">Doing</option>
                    <option value="done">Done</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="deadline">Deadline</label>
                  <input
                    type="date"
                    id="deadline"
                    name="deadline"
                    value={issueFormData.deadline}
                    onChange={handleIssueFormChange}
                    className="form-control"
                  />
                </div>
                </div>

                {project?.projectType === 'collaborative' && (
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="assignee">Assignee</label>
                      <select
                        id="assignee"
                        name="assignee"
                        value={issueFormData.assignee}
                        onChange={handleIssueFormChange}
                        className="form-control"
                      >
                        <option value="">Select Assignee</option>
                        {project.collaborators.map((collab) => {
                          console.log('Collaborator:', collab);
                          return (
                            <option key={collab.userId._id} value={collab.userId._id}>
                              {collab.userId.username}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                  </div>
                )}

                {showCustomType && (
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="customType">Custom Type</label>
                      <input
                        type="text"
                        name="customType"
                        value={issueFormData.customType}
                        onChange={handleIssueFormChange}
                        className="form-control custom-type-input"
                        placeholder="Enter custom issue type"
                        required
                      />
                    </div>
                  </div>
                )}

                <div className="modal-actions">
                  <button type="submit" className="btn btn-primary">
                    Create Issue
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handleModalClose}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      <Footer />
    </div>
  );
};

export default TaskList; 