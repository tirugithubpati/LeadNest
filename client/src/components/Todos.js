import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTodos, createTodo, updateTodo, deleteTodo, updateTodoStatus } from '../api/todosApi';
import LoadingAnimation from './LoadingAnimation';
import '../styles/Todos.css';
import Footer from './Footer';

const Todos = () => {
  const navigate = useNavigate();
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingTodo, setEditingTodo] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [customCategory, setCustomCategory] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    priority: 'Low',
    category: 'General',
    dueDate: '',
    status: 'Pending'
  });
  const [deleteConfirmation, setDeleteConfirmation] = useState(null);

  useEffect(() => {
    fetchTodos();
  }, []);

  const fetchTodos = async () => {
    try {
      const data = await getTodos();
      setTodos(data);
      setError('');
    } catch (err) {
      setError('Failed to fetch todos');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'category' && value === 'Custom') {
      setCustomCategory('');
    }
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const todoData = {
        ...formData,
        category: formData.category === 'Custom' ? customCategory : formData.category
      };

      console.log('Submitting todo data:', todoData);

      if (editingTodo) {
        await updateTodo(editingTodo._id, todoData);
      } else {
        await createTodo(todoData);
      }

      setShowForm(false);
      setEditingTodo(null);
      setFormData({
        name: '',
        priority: 'Low',
        category: 'General',
        dueDate: '',
        status: 'Pending'
      });
      setCustomCategory('');
      await fetchTodos();
    } catch (err) {
      console.error('Error saving todo:', err);
      setError(err.response?.data?.message || 'Failed to save todo');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (todo) => {
    setEditingTodo(todo);
    setFormData({
      name: todo.name,
      priority: todo.priority,
      category: todo.category,
      dueDate: todo.dueDate ? new Date(todo.dueDate).toISOString().split('T')[0] : '',
      status: todo.status
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    try {
      await deleteTodo(id);
      fetchTodos();
    } catch (err) {
      setError('Failed to delete todo');
    }
  };

  const handleStatusChange = async (todo) => {
    try {
      await updateTodoStatus(todo._id, todo.status === 'Pending' ? 'Done' : 'Pending');
      fetchTodos();
    } catch (err) {
      setError('Failed to update todo status');
    }
  };

  const filteredTodos = todos.filter(todo => {
    const searchLower = searchTerm.toLowerCase();
    return (
      todo.name.toLowerCase().includes(searchLower) ||
      todo.category.toLowerCase().includes(searchLower) ||
      todo.priority.toLowerCase().includes(searchLower) ||
      todo.status.toLowerCase().includes(searchLower) ||
      (todo.dueDate && new Date(todo.dueDate).toLocaleDateString().includes(searchLower))
    );
  });

  const renderTodoItem = (todo) => (
    <div key={todo._id} className="todo-item">
      <div className="todo-header">
        <h3 className="todo-name">{todo.name}</h3>
        <span className={`todo-status ${todo.status.toLowerCase()}`}>
          {todo.status}
        </span>
      </div>
      
      <div className="todo-details">
        <div className="todo-tags">
          <span className="todo-category">{todo.category}</span>
          <span className={`todo-priority ${todo.priority.toLowerCase()}`}>
            {todo.priority}
          </span>
          <div className="todo-due-date">
            <i className="fas fa-calendar"></i>
            {new Date(todo.dueDate).toLocaleDateString()}
          </div>
        </div>
      </div>

      <div className="todo-actions">
        <button 
          className="mark-done"
          onClick={() => handleStatusChange(todo)}
        >
          <i className={`fas fa-${todo.status === 'Pending' ? 'check' : 'undo'}`}></i>
          {todo.status === 'Pending' ? 'Mark Done' : 'Mark Pending'}
        </button>
        <button 
          className="edit"
          onClick={() => handleEdit(todo)}
        >
          <i className="fas fa-edit"></i>
          Edit
        </button>
        <button 
          className="delete"
          onClick={() => setDeleteConfirmation(todo)}
        >
          <i className="fas fa-trash"></i>
          Delete
        </button>
      </div>
    </div>
  );

  const renderDeleteConfirmation = () => {
    if (!deleteConfirmation) return null;

    return (
      <div className="delete-confirmation-modal">
        <div className="delete-confirmation-content">
          <h3>Delete To-do</h3>
          <p>Are you sure you want to delete "{deleteConfirmation.name}"? This action cannot be undone.</p>
          <div className="delete-confirmation-actions">
            <button 
              className="cancel"
              onClick={() => setDeleteConfirmation(null)}
            >
              Cancel
            </button>
            <button 
              className="confirm"
              onClick={() => {
                handleDelete(deleteConfirmation._id);
                setDeleteConfirmation(null);
              }}
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return <LoadingAnimation message="Loading your todos..." />;
  }

  return (
    <div className="todos-container">
      <div className="todos-header">
        <div className="todos-header-content">
          <div className="todos-header-left">
            <h1>My Personal To-dos</h1>
            <p className="current-date">
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>
          <div className="todos-header-actions">
            <button 
              className="todo-back-btn"
              onClick={() => navigate('/dashboard')}
            >
              <i className="fas fa-arrow-left"></i> Back to Dashboard
            </button>
            <button 
              className="add-todo-button"
              onClick={() => setShowForm(true)}
            >
              <i className="fas fa-plus"></i> Add To-do
            </button>
          </div>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="todos-content">
        <div className="search-bar">
          <div className="search-input-wrapper">
            <i className="fas fa-search search-icon"></i>
            <input
              type="text"
              placeholder="Search by name, category, priority, status or due date..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          {searchTerm && (
            <div className="search-results-info">
              <span>
                Found {filteredTodos.length} {filteredTodos.length === 1 ? 'todo' : 'todos'} matching "{searchTerm}"
              </span>
              <button 
                className="clear-search"
                onClick={() => setSearchTerm('')}
              >
                <i className="fas fa-times"></i>
                Clear Search
              </button>
            </div>
          )}
        </div>

        <div className="todos-list">
          {filteredTodos.length === 0 ? (
            <div className="no-todos">
              {searchTerm ? (
                <>
                  <h3>No Matching To-dos</h3>
                  <p>No to-dos found matching "{searchTerm}"</p>
                  <button 
                    className="clear-search-button"
                    onClick={() => setSearchTerm('')}
                  >
                    Clear Search
                  </button>
                </>
              ) : (
                <>
                  <h3>No To-dos Found</h3>
                  <p>Add your first to-do to get started!</p>
                </>
              )}
            </div>
          ) : (
            filteredTodos.map(renderTodoItem)
          )}
        </div>
      </div>

      {renderDeleteConfirmation()}

      {showForm && (
        <div className="modal-overlay">
          <div className="todo-form-modal">
            <button 
              className="modal-close"
              onClick={() => {
                setShowForm(false);
                setEditingTodo(null);
                setFormData({
                  name: '',
                  priority: 'Low',
                  category: 'General',
                  dueDate: '',
                  status: 'Pending'
                });
                setCustomCategory('');
              }}
            >
              &times;
            </button>
            <h2>{editingTodo ? 'Edit Todo' : 'Add New Todo'}</h2>
            {isSubmitting ? (
              <div className="form-loading">
                <LoadingAnimation message={editingTodo ? "Updating todo..." : "Creating todo..."} />
              </div>
            ) : (
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="name">Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter todo name"
                />
              </div>

              <div className="form-group">
                <label htmlFor="priority">Priority</label>
                <select
                  id="priority"
                  name="priority"
                  value={formData.priority}
                  onChange={handleInputChange}
                  required
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="category">Category</label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  required
                >
                  <option value="General">General</option>
                  <option value="Health">Health</option>
                  <option value="Study">Study</option>
                  <option value="Work">Work</option>
                  <option value="Custom">Custom</option>
                </select>
              </div>

              {formData.category === 'Custom' && (
                <div className="form-group">
                  <label htmlFor="customCategory">Custom Category</label>
                  <input
                    type="text"
                    id="customCategory"
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    required
                    placeholder="Enter custom category"
                  />
                </div>
              )}

              <div className="form-group">
                <label htmlFor="dueDate">Due Date</label>
                <input
                  type="date"
                  id="dueDate"
                  name="dueDate"
                  value={formData.dueDate}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-actions">
                <button type="submit" className="submit-button">
                  {editingTodo ? 'Update Todo' : 'Add Todo'}
                </button>
              </div>
            </form>
            )}
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default Todos; 