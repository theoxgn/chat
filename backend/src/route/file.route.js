const {Router} = require('express');
const fileRouter = Router();

// * Import controller
const FileController = require('../controller/file.controller');

// * Import service
const FileService = require('../service/file.service');

fileRouter.post('/api/upload', FileService.upload.single('file'), FileController.uploadFile);

module.exports = fileRouter;