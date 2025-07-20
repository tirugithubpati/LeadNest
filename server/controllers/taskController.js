const Task = require('../models/task.model');
const Project = require('../models/project.model');

const getUserRole = (project, userId) => {
  if (project.createdBy.equals(userId)) return 'manager';
  const collaborator = project.collaborators.find(c => c.userId.equals(userId));
  return collaborator ? collaborator.role : null;
};

const hasManagerAccess = (project, userId) => {
  return project.createdBy.equals(userId) || 
         project.collaborators.some(c => c.userId.equals(userId) && c.role === 'manager');
};

module.exports.getTasksByProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user.userId || req.user._id;

    const project = await Project.findOne({
      _id: projectId,
      $or: [
        { createdBy: userId },
        { 'collaborators.userId': userId }
      ]
    });

    if (!project) {
      return res.status(404).json({
        message: 'Project not found or you do not have access'
      });
    }

    const tasks = await Task.find({ projectId })
      .populate('assignee', 'fullName username')
      .populate('comments.user', 'fullName username')
      .sort({ createdAt: -1 });

    res.json(tasks);
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({
      message: error.message || 'Error fetching tasks'
    });
  }
};

module.exports.getTaskById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId || req.user.id || req.user._id;

    console.log('Getting task by ID:', {
      taskId: id,
      userId: userId,
      user: req.user
    });

    const task = await Task.findById(id)
      .populate('projectId', 'createdBy collaborators projectType')
      .populate('assignee', 'fullName username')
      .populate('comments.user', 'fullName username');

    if (!task) {
      console.log('Task not found:', id);
      return res.status(404).json({
        message: 'Task not found'
      });
    }

    console.log('Found task:', {
      taskId: task._id,
      projectId: task.projectId._id,
      projectType: task.projectId.projectType,
      createdBy: task.projectId.createdBy
    });

    const hasAccess = task.projectId.createdBy.toString() === userId.toString() ||
      task.projectId.collaborators.some(c => c.userId.toString() === userId.toString());

    if (!hasAccess) {
      console.log('Access denied:', {
        userId: userId,
        projectId: task.projectId._id,
        createdBy: task.projectId.createdBy,
        collaborators: task.projectId.collaborators
      });
      return res.status(403).json({
        message: 'You do not have permission to view this task'
      });
    }

    console.log('Task access granted, sending response');
    res.json(task);
  } catch (error) {
    console.error('Get task error:', error);
    res.status(500).json({
      message: error.message || 'Error fetching task'
    });
  }
};

module.exports.createTask = async (req, res) => {
  try {
    const { title, description, type, deadline, projectId, assignee } = req.body;
    const userId = req.user.userId || req.user._id;

    const project = await Project.findOne({
      _id: projectId,
      $or: [
        { createdBy: userId },
        { 'collaborators.userId': userId }
      ]
    });

    if (!project) {
      return res.status(404).json({
        message: 'Project not found or you do not have access'
      });
    }

    if (!hasManagerAccess(project, userId)) {
      return res.status(403).json({
        message: 'Only project managers can create tasks'
      });
    }

    if (assignee) {
      const isValidAssignee = project.collaborators.some(
        collab => collab.userId.toString() === assignee
      );
      if (!isValidAssignee) {
        return res.status(400).json({
          message: 'Invalid assignee - must be a project collaborator'
        });
      }
    }

    const task = new Task({
      title,
      description,
      type,
      deadline,
      projectId,
      assignee: assignee || null,
      status: req.body.status
    });

    const savedTask = await task.save();
    await savedTask.populate('assignee', 'fullName username');

    res.status(201).json(savedTask);
  } catch (error) {
    console.error('Create task error:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        message: 'Validation error',
        details: Object.values(error.errors).map(err => err.message)
      });
    }
    res.status(500).json({
      message: error.message || 'Error creating task'
    });
  }
};

module.exports.updateTaskStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user.userId || req.user.id || req.user._id;

    console.log('Updating task status:', {
      taskId: id,
      newStatus: status,
      userId: userId,
      user: req.user
    });

    const validStatuses = ['todo', 'doing', 'done'];
    if (!validStatuses.includes(status)) {
      console.log('Invalid status:', status);
      return res.status(400).json({
        message: 'Invalid status. Must be one of: todo, doing, done'
      });
    }

    const task = await Task.findById(id)
      .populate('projectId', 'createdBy collaborators projectType');

    if (!task) {
      console.log('Task not found:', id);
      return res.status(404).json({
        message: 'Task not found'
      });
    }

    console.log('Found task:', {
      taskId: task._id,
      projectId: task.projectId._id,
      projectType: task.projectId.projectType,
      createdBy: task.projectId.createdBy
    });

    const hasAccess = task.projectId.createdBy.toString() === userId.toString() ||
      task.projectId.collaborators.some(c => c.userId.toString() === userId.toString());

    if (!hasAccess) {
      console.log('Access denied:', {
        userId: userId,
        projectId: task.projectId._id,
        createdBy: task.projectId.createdBy,
        collaborators: task.projectId.collaborators
      });
      return res.status(403).json({
        message: 'You do not have permission to update this task'
      });
    }

    if (task.projectId.projectType === 'collaborative') {
      const isProjectMember = task.projectId.collaborators.some(c => 
        c.userId.toString() === userId.toString() && 
        (c.role === 'developer' || c.role === 'manager')
      );
      
      if (!isProjectMember && task.projectId.createdBy.toString() !== userId.toString()) {
        return res.status(403).json({
          message: 'Only project members (developers and managers) can update task status'
        });
      }
    }

    task.status = status;
    await task.save();

    console.log('Task status updated successfully:', {
      taskId: task._id,
      newStatus: status
    });

    const updatedTask = await Task.findById(id)
      .populate('projectId', 'createdBy collaborators')
      .populate('assignee', 'fullName username')
      .populate('comments.user', 'fullName username');

    console.log('Sending response with updated task:', {
      taskId: updatedTask._id,
      status: updatedTask.status
    });

    res.json(updatedTask);
  } catch (error) {
    console.error('Update task status error:', error);
    res.status(500).json({
      message: error.message || 'Error updating task status'
    });
  }
};

module.exports.updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const userId = req.user.userId || req.user._id;

    const task = await Task.findById(id)
      .populate('projectId', 'createdBy collaborators');

    if (!task) {
      return res.status(404).json({
        message: 'Task not found'
      });
    }

    const hasAccess = task.projectId.createdBy.equals(userId) ||
      task.projectId.collaborators.some(c => c.userId.equals(userId));

    if (!hasAccess) {
      return res.status(403).json({
        message: 'You do not have permission to update this task'
      });
    }

    if (!hasManagerAccess(task.projectId, userId)) {
      return res.status(403).json({
        message: 'Only project managers can update task details'
      });
    }

    if (updates.assignee) {
      const isValidAssignee = task.projectId.collaborators.some(
        collab => collab.userId.toString() === updates.assignee
      );
      if (!isValidAssignee) {
        return res.status(400).json({
          message: 'Invalid assignee - must be a project collaborator'
        });
      }
    }

    const allowedUpdates = ['title', 'description', 'type', 'deadline', 'status', 'assignee'];
    Object.keys(updates).forEach(key => {
      if (allowedUpdates.includes(key)) {
        task[key] = updates[key];
      }
    });

    await task.save();
    await task.populate('assignee', 'fullName username');

    res.json(task);
  } catch (error) {
    console.error('Update task error:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        message: 'Validation error',
        details: Object.values(error.errors).map(err => err.message)
      });
    }
    res.status(500).json({
      message: error.message || 'Error updating task'
    });
  }
};

module.exports.deleteTask = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId || req.user._id;

    const task = await Task.findById(id)
      .populate('projectId', 'createdBy collaborators');

    if (!task) {
      return res.status(404).json({
        message: 'Task not found'
      });
    }

    if (!hasManagerAccess(task.projectId, userId)) {
      return res.status(403).json({
        message: 'Only project managers can delete tasks'
      });
    }

    await task.deleteOne();

    res.json({
      message: 'Task deleted successfully'
    });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({
      message: error.message || 'Error deleting task'
    });
  }
};

module.exports.addComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body;
    const userId = req.user.userId || req.user._id;

    let task = await Task.findById(id)
      .populate('projectId', 'createdBy collaborators')
      .populate('assignee', 'fullName username')
      .populate('comments.user', 'fullName username');

    if (!task) {
      return res.status(404).json({
        message: 'Task not found'
      });
    }

    const hasAccess = task.projectId.createdBy.equals(userId) ||
      task.projectId.collaborators.some(c => c.userId.equals(userId));

    if (!hasAccess) {
      return res.status(403).json({
        message: 'You do not have permission to comment on this task'
      });
    }

    task.comments.push({
      user: userId,
      text
    });

    await task.save();

    task = await Task.findById(id)
      .populate('projectId', 'createdBy collaborators')
      .populate('assignee', 'fullName username')
      .populate('comments.user', 'fullName username');

    res.json(task);
  } catch (error) {
    console.error('Add comment error:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        message: 'Validation error',
        details: Object.values(error.errors).map(err => err.message)
      });
    }
    res.status(500).json({
      message: error.message || 'Error adding comment'
    });
  }
};

module.exports.deleteTasksByProject = async (projectId) => {
  try {
    const result = await Task.deleteMany({ projectId });
    console.log(`Deleted ${result.deletedCount} tasks for project ${projectId}`);
    return result;
  } catch (error) {
    console.error('Error deleting tasks:', error);
    throw error;
  }
}; 