const multer = require('multer');

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    const allowedImageTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    const allowedDocTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    const allowedVideoTypes = ['video/mp4', 'video/mpeg', 'video/quicktime'];

    const allowedMimeTypes = [...allowedImageTypes, ...allowedDocTypes, ...allowedVideoTypes];

    if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only JPG, PNG, PDF, DOCX, and video files are allowed.'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 100 * 1024 * 1024, // 100MB limit
    }
});

module.exports = upload;
