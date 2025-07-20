const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const projectController = require('../controllers/projectController');

router.get('/', auth, projectController.getProjects);

router.get('/:id', auth, projectController.getProjectById);

router.post('/', auth, projectController.createProject);

router.put('/:id', auth, projectController.updateProject);

router.delete('/:id', auth, projectController.deleteProject);

router.post('/:id/boards', auth, projectController.addCustomBoard);
router.put('/:id/boards/:boardId', auth, projectController.updateCustomBoard);
router.delete('/:id/boards/:boardId', auth, projectController.deleteCustomBoard);

router.post('/:id/collaborators', auth, projectController.addCollaborator);
router.post('/:id/collaborators/remove', auth, projectController.removeCollaborator);

router.post('/:id/leave', auth, projectController.leaveProject);

module.exports = router; 