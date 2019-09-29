const express = require('express');
const router = express.Router();
const UserController = require('../controllers/users');

router.post('/authenticate', UserController.authenticate);

router.post('/register', UserController.register);

router.get('/', UserController.getAll);

router.get('/current', UserController.getCurrent);

router.get('/:id', UserController.getById);

router.put('/:id', UserController.update);

router.delete('/:id', UserController.delete);

module.exports = router;