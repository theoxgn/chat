const {Router} = require('express');
const fileRouter = Router();
const upload = require('../middleware/file-upload.middleware');

// * Import controller
const FileController = require('../controller/file.controller');

fileRouter.post('/api/files/upload', upload.single('file'), FileController.uploadFile);

module.exports = fileRouter;