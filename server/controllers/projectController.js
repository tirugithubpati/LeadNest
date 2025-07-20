const Project = require('../models/project.model');
const { deleteTasksByProject } = require('./taskController');
const User = require('../models/User');
const { transporter, emailTemplates } = require('./authController');

const hasManagerAccess = (project, userId) => {
  if (project.projectType === 'personal') {
    return project.createdBy.equals(userId);
  }
  return project.createdBy.equals(userId) || 
         project.collaborators.some(c => c.userId.equals(userId) && c.role === 'manager');
};

function getUserRole(project, userId) {
  if (project.projectType === 'personal') {
    return project.createdBy._id?.toString() === userId.toString() || 
           project.createdBy.toString() === userId.toString() ? 'manager' : null;
  }
  if (project.createdBy._id?.toString() === userId.toString() || project.createdBy.toString() === userId.toString()) {
    return 'manager';
  }
  const collaborator = project.collaborators.find(c => c.userId._id?.toString() === userId.toString() || c.userId.toString() === userId.toString());
  return collaborator ? collaborator.role : null;
}

exports.createProject = async (req, res) => {
  try {
    console.log('Creating project with data:', req.body);
    const { title, description, githubLink, projectType, collaborators } = req.body;
    const userId = req.user.userId || req.user._id;

    if (!title) {
      return res.status(400).json({ message: 'Title is required' });
    }

    const project = new Project({
      title,
      description,
      githubLink,
      projectType: projectType || 'personal',
      createdBy: userId,
      collaborators: [
        { userId, role: 'manager' }, 
        ...(collaborators || [])
      ],
      status: 'active'
    });

    console.log('Project object created:', project);
    const savedProject = await project.save();
    console.log('Project saved successfully:', savedProject);

    await savedProject.populate('createdBy', 'fullName username email');
    await savedProject.populate('collaborators.userId', 'fullName username email');

    if (savedProject.collaborators.length > 1) {
      const creator = savedProject.createdBy;
      console.log('\n=== Sending Project Collaboration Emails ===');
      console.log('Project:', savedProject.title);
      console.log('Creator:', creator.fullName);
      console.log('Total collaborators:', savedProject.collaborators.length);
      
      const emailPromises = savedProject.collaborators
        .filter(collab => !collab.userId._id.equals(creator._id))
        .map(async (collab) => {
          const collaborator = collab.userId;
          console.log(`\nPreparing email for collaborator: ${collaborator.fullName} (${collaborator.email})`);
          console.log('Role:', collab.role);
          
          const emailTemplate = emailTemplates.projectCollaboration(
            savedProject,
            { ...collab.toObject(), fullName: collaborator.fullName },
            creator
          );

          try {
            console.log('Sending email...');
            await transporter.sendMail({
              from: process.env.EMAIL_USER,
              to: collaborator.email,
              subject: emailTemplate.subject,
              html: emailTemplate.html
            });
            console.log('✅ Email sent successfully to:', collaborator.email);
          } catch (emailError) {
            console.error('❌ Failed to send email to', collaborator.email);
            console.error('Error details:', emailError.message);
          }
        });

      console.log('\nWaiting for all emails to be sent...');
      await Promise.all(emailPromises);
      console.log('=== Email sending process completed ===\n');
    }

    res.status(201).json(savedProject);
  } catch (error) {
    console.error('Create project error:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: 'Validation error', 
        details: Object.values(error.errors).map(err => err.message)
      });
    }
    if (error.code === 11000) {
      return res.status(400).json({
        message: 'You already have a project with this title'
      });
    }
    res.status(500).json({
      message: error.message || 'Error creating project'
    });
  }
};

exports.getProjects = async (req, res) => {
  try {
    const userId = req.user.id;

    const projects = await Project.find({
      $or: [
        { createdBy: userId },
        { 'collaborators.userId': userId }
      ]
    })
    .select('+shortId')
    .populate('createdBy', 'fullName username')
    .populate('collaborators.userId', 'fullName username')
    .sort({ createdAt: -1 });

    res.json(projects);
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({
      message: error.message || 'Error fetching projects'
    });
  }
};

exports.getProjectById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const project = await Project.findOne({
      _id: id,
      $or: [
        { createdBy: userId },
        { 'collaborators.userId': userId }
      ]
    })
    .select('+shortId')
    .populate('createdBy', 'fullName username email')
    .populate('collaborators.userId', 'fullName username email');

    if (!project) {
      return res.status(404).json({
        message: 'Project not found or you do not have access'
      });
    }

    const currentUserRole = getUserRole(project, userId);

    res.json({
      ...project.toObject(),
      currentUserRole
    });
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({
      message: error.message || 'Error fetching project'
    });
  }
};

exports.updateProject = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id || req.user._id;
    const { title, description, githubLink, collaborators } = req.body;

    const project = await Project.findOne({
      _id: id,
      $or: [
        { createdBy: userId },
        { 'collaborators.userId': userId }
      ]
    });

    if (!project) {
      return res.status(404).json({
        message: 'Project not found or you do not have permission to update'
      });
    }

    if (project.projectType === 'personal') {
      if (!project.createdBy.equals(userId)) {
        return res.status(403).json({
          message: 'Only the project creator can update personal projects'
        });
      }
    } else {
    if (!hasManagerAccess(project, userId)) {
      return res.status(403).json({
          message: 'Only Project Managers can update project details'
      });
      }
    }

    if (title) project.title = title;
    if (description) project.description = description;
    if (githubLink) project.githubLink = githubLink;

    if (project.projectType === 'collaborative' && collaborators) {
      project.collaborators = collaborators;
    }

    const updatedProject = await project.save();
    await updatedProject.populate('createdBy', 'fullName username email');
    await updatedProject.populate('collaborators.userId', 'fullName username email');

    res.json(updatedProject);
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({
      message: error.message || 'Error updating project'
    });
  }
};

exports.deleteProject = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id || req.user._id;

    const project = await Project.findOne({
      _id: id,
      $or: [
        { createdBy: userId },
        { 'collaborators.userId': userId }
      ]
    });

    if (!project) {
      return res.status(404).json({
        message: 'Project not found or you do not have permission to delete'
      });
    }

    if (project.projectType === 'personal') {
      if (!project.createdBy.equals(userId)) {
        return res.status(403).json({
          message: 'Only the project creator can delete personal projects'
        });
      }
    } else {
    if (!hasManagerAccess(project, userId)) {
      return res.status(403).json({
          message: 'Only Project Managers can delete the project'
      });
      }
    }

    await deleteTasksByProject(id);

    await project.deleteOne();

    res.json({
      message: 'Project and associated tasks deleted successfully'
    });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({
      message: error.message || 'Error deleting project'
    });
  }
};

exports.addCustomBoard = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    const userId = req.user.userId || req.user._id;

    const project = await Project.findOne({
      _id: id,
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

    const boardId = name.toLowerCase().replace(/\s+/g, '-');

    if (project.customBoards && project.customBoards.some(board => board.id === boardId)) {
      return res.status(400).json({
        message: 'A board with this name already exists'
      });
    }

    project.customBoards = project.customBoards || [];
    project.customBoards.push({
      id: boardId,
      name
    });

    await project.save();

    res.json({
      id: boardId,
      name
    });
  } catch (error) {
    console.error('Add custom board error:', error);
    res.status(500).json({
      message: error.message || 'Error adding custom board'
    });
  }
};

exports.updateCustomBoard = async (req, res) => {
  try {
    const { id, boardId } = req.params;
    const { name } = req.body;
    const userId = req.user.userId || req.user._id;

    const project = await Project.findOne({
      _id: id,
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

    const board = project.customBoards.find(b => b.id === boardId);
    if (!board) {
      return res.status(404).json({
        message: 'Board not found'
      });
    }

    board.name = name;
    await project.save();

    res.json(board);
  } catch (error) {
    console.error('Update custom board error:', error);
    res.status(500).json({
      message: error.message || 'Error updating custom board'
    });
  }
};

exports.deleteCustomBoard = async (req, res) => {
  try {
    const { id, boardId } = req.params;
    const userId = req.user.userId || req.user._id;

    const project = await Project.findOne({
      _id: id,
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

    project.customBoards = project.customBoards.filter(board => board.id !== boardId);
    await project.save();

    res.json({
      message: 'Board deleted successfully'
    });
  } catch (error) {
    console.error('Delete custom board error:', error);
    res.status(500).json({
      message: error.message || 'Error deleting custom board'
    });
  }
}; 

exports.addCollaborator = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, role } = req.body;
    const currentUserId = req.user.userId || req.user._id;

    const project = await Project.findOne({
      _id: id,
      $or: [
        { createdBy: currentUserId },
        { 'collaborators.userId': currentUserId }
      ]
    }).populate('collaborators.userId', 'fullName username email');

    if (!project) {
      return res.status(404).json({
        message: 'Project not found or you do not have access'
      });
    }

    const currentUserRole = project.collaborators.find(
      c => c.userId._id.toString() === currentUserId.toString()
    )?.role;

    if (!currentUserRole || currentUserRole !== 'manager') {
      return res.status(403).json({
        message: 'Only project managers can add collaborators'
      });
    }

    const isAlreadyCollaborator = project.collaborators.some(
      c => c.userId._id.toString() === userId
    );

    if (isAlreadyCollaborator) {
      return res.status(400).json({
        message: 'User is already a collaborator in this project'
      });
    }

    project.collaborators.push({ userId, role });

    await project.save();

    const newCollaborator = await User.findById(userId);
    const creator = await User.findById(project.createdBy);

    if (newCollaborator && creator) {
      const emailTemplate = emailTemplates.projectCollaboration(
        project,
        { userId: newCollaborator._id, role },
        creator
      );

      try {
        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: newCollaborator.email,
          subject: emailTemplate.subject,
          html: emailTemplate.html
        });
      } catch (emailError) {
        console.error('Failed to send collaboration email:', emailError);
      }
    }

    res.json({
      message: 'Collaborator added successfully',
      project: await project.populate('collaborators.userId', 'fullName username email')
    });
  } catch (error) {
    console.error('Add collaborator error:', error);
    res.status(500).json({
      message: error.message || 'Error adding collaborator'
    });
  }
}; 

exports.removeCollaborator = async (req, res) => {
  try {
    const { id } = req.params;
    const { collaboratorId } = req.body;
    const userId = req.user.userId || req.user._id;

    const project = await Project.findOne({
      _id: id,
      $or: [
        { createdBy: userId },
        { 'collaborators.userId': userId }
      ]
    }).populate('collaborators.userId', 'fullName username email');

    if (!project) {
      return res.status(404).json({
        message: 'Project not found or you do not have access'
      });
    }

    const currentUserRole = project.collaborators.find(
      c => c.userId._id.toString() === userId.toString()
    )?.role;

    if (!currentUserRole || currentUserRole !== 'manager') {
      return res.status(403).json({
        message: 'Only project managers can remove collaborators'
      });
    }

    const collaboratorExists = project.collaborators.some(
      c => c.userId._id.toString() === collaboratorId
    );

    if (!collaboratorExists) {
      return res.status(404).json({
        message: 'Collaborator not found in this project'
      });
    }

    project.collaborators = project.collaborators.filter(
      c => c.userId._id.toString() !== collaboratorId
    );

    await project.save();

    res.json({
      message: 'Collaborator removed successfully',
      project: await project.populate('collaborators.userId', 'fullName username email')
    });
  } catch (error) {
    console.error('Remove collaborator error:', error);
    res.status(500).json({
      message: error.message || 'Error removing collaborator'
    });
  }
};

exports.leaveProject = async (req, res) => {
  try {
    const projectId = req.params.id;
    const userId = req.user._id;

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (project.projectType !== 'collaborative') {
      return res.status(400).json({ message: 'Cannot leave a personal project' });
    }

    const collaboratorIndex = project.collaborators.findIndex(
      collab => collab.userId.toString() === userId.toString()
    );

    if (collaboratorIndex === -1) {
      return res.status(404).json({ message: 'You are not a collaborator in this project' });
    }

    const isManager = project.collaborators[collaboratorIndex].role === 'manager';
    const managerCount = project.collaborators.filter(collab => collab.role === 'manager').length;

    if (isManager && managerCount <= 1) {
      return res.status(400).json({ 
        message: 'Cannot leave project as you are the last manager. Please assign another manager or delete the project.' 
      });
    }

    project.collaborators.splice(collaboratorIndex, 1);
    await project.save();

    res.json({ 
      message: 'Successfully left the project',
      project 
    });
  } catch (error) {
    console.error('Error leaving project:', error);
    res.status(500).json({ message: 'Error leaving project' });
  }
}; 