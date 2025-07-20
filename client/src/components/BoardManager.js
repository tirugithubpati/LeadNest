import React, { useState } from 'react';

const BoardManager = ({ boards, onBoardAdd, onBoardEdit, onBoardDelete }) => {
  const [showForm, setShowForm] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [boardToDelete, setBoardToDelete] = useState(null);
  const [formData, setFormData] = useState({
    id: '',
    name: ''
  });
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setError('Board name is required');
      return;
    }

    const boardId = formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    if (boardId in boards) {
      setError('A board with this name already exists');
      return;
    }

    if (formData.name.length < 3) {
      setError('Board name must be at least 3 characters long');
      return;
    }

    if (formData.name.length > 50) {
      setError('Board name must be less than 50 characters');
      return;
    }

    try {
      onBoardAdd({
        id: boardId,
        name: formData.name.trim()
      });
    setShowForm(false);
    setFormData({ id: '', name: '' });
    setError('');
    } catch (err) {
      setError(err.message || 'Failed to create board. Please try again.');
    }
  };

  const handleDelete = (boardId) => {
    if (boardId === 'todo' || boardId === 'doing' || boardId === 'done') {
      setError('Cannot delete default boards');
      return;
    }
    
    setBoardToDelete(boardId);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    onBoardDelete(boardToDelete);
    setShowDeleteModal(false);
    setBoardToDelete(null);
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setBoardToDelete(null);
  };

  return (
    <div className="board-manager">
      <div className="board-manager-header">
        <h2>Manage Boards</h2>
        <button 
          className="btn btn-primary"
          onClick={() => setShowForm(true)}
        >
          Add New Board
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {showForm && (
        <div className="board-form">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="boardName">Board Name</label>
              <input
                type="text"
                id="boardName"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter board name"
                className="form-control"
              />
            </div>
            <div className="form-actions">
              <button type="submit" className="btn btn-primary">
                Add Board
              </button>
              <button 
                type="button" 
                className="btn btn-secondary"
                onClick={() => {
                  setShowForm(false);
                  setFormData({ id: '', name: '' });
                  setError('');
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="board-list">
        {Object.entries(boards).map(([id, board]) => (
          <div key={id} className="board-item">
            <span className="board-name">{board.name}</span>
            <div className="board-actions">
              <button
                className="btn btn-danger btn-sm"
                onClick={() => handleDelete(id)}
                disabled={['todo', 'doing', 'done'].includes(id)}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Delete Board</h2>
              <button 
                className="modal-close"
                onClick={cancelDelete}
              >
                &times;
              </button>
            </div>
            <div className="modal-body">
              <p>
                Are you sure you want to delete this board? All issues in this board will be moved to the "To Do" board.
                This action cannot be undone.
              </p>
              <div className="modal-actions">
                <button 
                  className="btn btn-danger"
                  onClick={confirmDelete}
                >
                  Delete Board
                </button>
                <button 
                  className="btn btn-secondary"
                  onClick={cancelDelete}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BoardManager; 