const {Router} = require('express');
const adminRouter = Router();

// * Import Controller
const AdminController = require('../controller/admin.controller');

// Add a route to reset the sequence if needed
adminRouter.post('/api/admin/reset-sequence', AdminController.resetSequence);

module.exports = adminRouter;