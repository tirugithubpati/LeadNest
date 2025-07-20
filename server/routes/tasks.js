const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const taskController = require('../controllers/taskController');

router.get('/projects/:projectId/tasks', auth, taskController.getTasksByProject);

router.get('/tasks/:id', auth, taskController.getTaskById);

router.post('/tasks', auth, taskController.createTask);

router.patch('/tasks/:id', auth, taskController.updateTaskStatus);

router.put('/tasks/:id', auth, taskController.updateTask);

router.delete('/tasks/:id', auth, taskController.deleteTask);

router.post('/tasks/:id/comments', auth, taskController.addComment);

module.exports = router;
