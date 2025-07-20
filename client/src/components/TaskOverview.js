import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getTaskById, updateTask, deleteTask, addTaskComment, updateTaskStatus } from '../api/taskApi';
import { getProjectById } from '../api/projectApi';
import LoadingAnimation from './LoadingAnimation';
import '../styles/TaskOverview.css';
import Footer from './Footer';

const TaskOverview = () => {
  const { id: taskId } = useParams();
  const navigate = useNavigate();
  const [task, setTask] = useState(null);
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [comment, setComment] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: '',
    status: '',
    deadline: '',
    customType: '',
    assignee: ''
  });
  const [showCustomType, setShowCustomType] = useState(false);
  const [isEditingStatus, setIsEditingStatus] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    fetchTaskAndProject();
  }, [taskId]);

  const fetchTaskAndProject = async () => {
    try {
      const taskData = await getTaskById(taskId);
      setTask(taskData);
      setFormData({
        title: taskData.title,
        description: taskData.description,
        type: taskData.type,
        status: taskData.status,
        deadline: taskData.deadline,
        assignee: taskData.assignee?._id || ''
      });

      const projectId = taskData.projectId._id || taskData.projectId;
      const projectData = await getProjectById(projectId);
      setProject(projectData);
      setError('');
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.message || 'Failed to load task details');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'type') {
      if (value === 'custom') {
        setShowCustomType(true);
        setFormData(prev => ({
          ...prev,
          [name]: prev.customType || ''
        }));
      } else {
        setShowCustomType(false);
        setFormData(prev => ({
          ...prev,
          [name]: value,
          customType: ''
        }));
      }
    } else if (name === 'customType') {
      const validatedValue = value.replace(/[^a-zA-Z0-9-_]/g, '');
      setFormData(prev => ({
        ...prev,
        type: validatedValue,
        customType: validatedValue
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const updatedTask = await updateTask(taskId, {
        ...formData,
        assignee: formData.assignee || task.assignee?._id || task.assignee
      });
      
      const refreshedTask = await getTaskById(taskId);
      setTask(refreshedTask);
      setEditing(false);
      setError('');
    } catch (err) {
      console.error('Error updating task:', err);
      setError(err.message || 'Failed to update task');
    }
  };

  const handleDelete = async () => {
    try {
      await deleteTask(taskId);
      navigate(`/project/${project._id}/tasks`);
    } catch (err) {
      console.error('Error deleting task:', err);
      setError(err.message || 'Failed to delete task');
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;

    try {
      const updatedTask = await addTaskComment(taskId, comment);
      setTask(updatedTask);
      setComment('');
      setError('');
    } catch (err) {
      console.error('Error adding comment:', err);
      setError(err.message || 'Failed to add comment');
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      console.log('Starting status change to:', newStatus);
      setLoading(true);
      setError(''); 
      
      console.log('Calling updateTaskStatus API...');
      const updatedTask = await updateTaskStatus(taskId, newStatus);
      console.log('API Response:', updatedTask);
      
      if (!updatedTask) {
        throw new Error('No response received from server');
      }
      
      setTask(prevTask => ({
        ...prevTask,
        ...updatedTask
      }));
      
      setIsEditingStatus(false);
      console.log('Status change completed successfully');
    } catch (err) {
      console.error('Error updating status:', err);
      console.error('Error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      });
      
      setError(err.response?.data?.message || err.message || 'Failed to update status');
      
      setNewStatus(task.status);
    } finally {
      setLoading(false);
      console.log('Status change operation finished');
    }
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

  const handleEditClick = () => {
    if (project?.currentUserRole !== 'manager') {
      setErrorMessage('Only Project Managers can edit issue details');
      setShowErrorModal(true);
      return;
    }
    setEditing(true);
  };

  if (loading) return <LoadingAnimation message="Loading task details..." />;

  if (error) return <div className="error-message">{error}</div>;
  if (!task) return <div className="error-message">Task not found</div>;

  return (
    <div className="task-overview-container">
      {showErrorModal && <ErrorModal />}
      <div className="task-overview-header">
        <div className="task-overview-header-content">
          <div className="task-overview-header-left">
            <h1 style={{ 
              color: '#FFFFFF', 
              fontWeight: '800',
              fontSize: '2.5rem',
              textShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
            }}>Issue Details</h1>
            {project && (
              <div className="project-info">
                <span className="task-id" style={{ 
                  color: '#FFFFFF', 
                  fontWeight: '800',
                  fontSize: '1.2rem',
                  textShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
                }}>#{task.serialNumber}</span>
                <span className="task-date" style={{ 
                  color: 'var(--text-color)', 
                  fontWeight: '800',
                  fontSize: '1.2rem',
                  textShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
                }}>
                  Created: {new Date(task.createdAt).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>
          <div className="task-overview-header-actions">
            <button 
              className="btn btn-secondary"
              onClick={() => navigate(`/project/${project._id}/tasks`)}
            >
              <i className="fas fa-arrow-left"></i> Back to Issues List
            </button>
            <button 
              className="btn btn-secondary"
              onClick={() => navigate(`/project/${project._id}/kanban`)}
            >
              <i className="fas fa-columns"></i> View in Kanban
            </button>
            {!editing && (
              <button 
                className="btn btn-primary"
                onClick={handleEditClick}
              >
                <i className="fas fa-edit"></i> Edit Issue
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="task-overview-content">
        {editing ? (
          <div className="edit-modal-overlay">
            <div className="edit-modal-container">
              <form onSubmit={handleSubmit} className="edit-modal-form">
                <div className="edit-modal-header">
                  <h2>Edit Issue</h2>
                </div>
                <div className="edit-modal-body">
            <div className="form-group">
              <label htmlFor="title">Title</label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className="form-control"
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
                className="form-control"
                rows="4"
              />
            </div>

            <div className="form-group">
              <label htmlFor="type">Type</label>
              <select
                id="type"
                name="type"
                value={showCustomType ? 'custom' : formData.type}
                onChange={handleInputChange}
                className="form-control"
                required
              >
                <option value="tech">Technical</option>
                <option value="review">Review</option>
                <option value="bug">Bug</option>
                <option value="feature">Feature</option>
                <option value="documentation">Documentation</option>
                <option value="custom">Custom Type</option>
              </select>
              {showCustomType && (
                <input
                  type="text"
                  name="customType"
                  value={formData.customType}
                  onChange={handleInputChange}
                  className="form-control custom-type-input"
                  placeholder="Enter custom issue type"
                  required
                />
              )}
            </div>

            <div className="form-group">
              <label htmlFor="deadline">Deadline</label>
              <input
                type="date"
                id="deadline"
                name="deadline"
                value={formData.deadline}
                onChange={handleInputChange}
                className="form-control"
              />
            </div>

            {project?.projectType === 'collaborative' && (
              <div className="form-group">
                <label htmlFor="assignee">Assignee</label>
                <select
                  id="assignee"
                  name="assignee"
                  value={formData.assignee}
                  onChange={handleInputChange}
                  className="form-control"
                >
                  <option value="">Select Assignee</option>
                  {project.collaborators.map((collab) => (
                    <option key={collab.userId._id} value={collab.userId._id}>
                      {collab.userId.username}
                    </option>
                  ))}
                </select>
              </div>
            )}
                </div>
                <div className="edit-modal-actions">
              <button type="submit" className="btn btn-primary">Save Changes</button>
              <button 
                type="button" 
                className="btn btn-secondary"
                onClick={() => {
                  setEditing(false);
                  setFormData({
                    title: task.title,
                    description: task.description,
                    type: task.type,
                    status: task.status,
                    deadline: task.deadline,
                    assignee: task.assignee?._id || ''
                  });
                }}
              >
                Cancel
              </button>
            </div>
          </form>
            </div>
          </div>
        ) : (
          <div className="task-details">
            <div className="task-section">
              <h2>{task.title}</h2>
              <div className="task-meta">
                <div className="task-meta-left">
                  <div className="task-meta-item">
                    <span className="task-meta-label">Project Name:</span>
                    <span className="task-meta-value">{project.title}</span>
                  </div>
                  <div className="task-meta-item">
                    <span className="task-meta-label">Project ID:</span>
                    <span className="task-meta-value">#{project.shortId}</span>
                  </div>
                  {project.projectType === 'collaborative' && task.assignee && (
                    <div className="task-meta-item">
                      <span className="task-meta-label">Assigned to:</span>
                      <span className="task-meta-value">{task.assignee.username || task.assignee.fullName || 'Unassigned'}</span>
                    </div>
                  )}
                </div>
                <div className="task-meta-right">
                  {task.deadline && (
                    <div className="task-meta-item">
                      <span className="task-meta-label">Deadline:</span>
                      <span className="task-meta-value">{new Date(task.deadline).toLocaleDateString()}</span>
                    </div>
                  )}
                  <div className="task-meta-item">
                    <span className="task-meta-label">Type:</span>
                    <span className={`task-meta-value task-type ${task.type}`} style={{ color: '#FFFFFF' }}>
                      {task.type === 'tech' ? 'Technical' :
                       task.type === 'review' ? 'Review' :
                       task.type === 'bug' ? 'Bug' :
                       task.type === 'feature' ? 'Feature' :
                       task.type === 'documentation' ? 'Documentation' :
                       task.type.charAt(0).toUpperCase() + task.type.slice(1)}
                </span>
                  </div>
                  <div className="task-meta-item">
                    <span className="task-meta-label">Status:</span>
                    {isEditingStatus ? (
                      <div className="status-edit-container">
                        {error && <div className="signup-message error">{error}</div>}
                        <select
                          value={newStatus}
                          onChange={(e) => setNewStatus(e.target.value)}
                          className="status-select"
                        >
                          <option value="todo">To Do</option>
                          <option value="doing">Doing</option>
                          <option value="done">Done</option>
                          {project?.customBoards?.map(board => (
                            <option key={board.id} value={board.id}>
                              {board.name}
                            </option>
                          ))}
                        </select>
                        <div className="status-edit-actions">
                          <button 
                            className="btn btn-sm btn-primary"
                            onClick={() => handleStatusChange(newStatus)}
                            disabled={loading}
                          >
                            {loading ? 'Updating...' : 'Set'}
                          </button>
                          <button 
                            className="btn btn-sm btn-secondary"
                            onClick={() => {
                              setIsEditingStatus(false);
                              setNewStatus(task.status);
                              setError('');
                            }}
                            disabled={loading}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="status-display">
                        <span className={`task-meta-value task-status ${task.status}`}>
                  {task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                </span>
                        <button 
                          className="btn btn-sm btn-link"
                          onClick={() => {
                            setIsEditingStatus(true);
                            setNewStatus(task.status);
                            setError(''); 
                          }}
                          disabled={loading}
                        >
                          Change
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="task-description">
                <h3>Description</h3>
                <p>{task.description || 'No description provided'}</p>
              </div>
            </div>

            <div className="task-section">
              <h3>Comments</h3>
              <div className="comments-list">
                {task.comments?.map(comment => (
                  <div key={comment._id} className="comment">
                    <div className="comment-content">
                      <div className="comment-header">
                        {project.projectType === 'collaborative' && (
                          <span className="comment-author">
                            {comment.user?.username || 'Unknown User'}
                          </span>
                        )}
                      <span className="comment-date">
                        {new Date(comment.createdAt).toLocaleDateString()}
                      </span>
                      </div>
                      <p className="comment-text">{comment.text}</p>
                    </div>
                  </div>
                ))}
              </div>
              <form onSubmit={handleCommentSubmit} className="comment-form">
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Add a comment..."
                  className="form-control"
                  rows="3"
                />
                <button type="submit" className="btn btn-primary">
                  Add Comment
                </button>
              </form>
            </div>

            <div className="task-section task-danger-zone">
              <h3>Danger Zone</h3>
              <div className="task-danger-zone-content">
                <div className="task-danger-action">
                  <div className="task-danger-action-info">
                    <h4>Delete this issue</h4>
                    <p>Once you delete a issue, there is no going back. Please be certain.</p>
                  </div>
                  <button 
                    className="btn btn-danger"
                    onClick={() => setShowDeleteConfirm(true)}
                  >
                    Delete Issue
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {showDeleteConfirm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Delete Issue</h2>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to delete this issue?</p>
              <p className="warning-text">This action cannot be undone.</p>
              <div className="task-to-delete">
                <strong>Issue to delete:</strong> {task.title}
              </div>
            </div>
            <div className="modal-actions">
              <button 
                className="btn btn-secondary"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </button>
              <button 
                className="btn btn-danger"
                onClick={handleDelete}
              >
                Delete Issue
              </button>
            </div>
          </div>
        </div>
      )}
      <Footer />
    </div>
  );
};

export default TaskOverview; 