require("dotenv").config();
const {PutObjectCommand} = require('@aws-sdk/client-s3');
const s3Client = require('../service/s3Client.service');
const {v4: uuidv4} = require('uuid');
const path = require('path');

class FileService {
    async uploadFile(file) {
        try {
            const fileExtension = path.extname(file.originalname);
            const fileName = `${uuidv4()}${fileExtension}`;
            const fileType = this._determineFileType(file.mimetype);

            // Upload to S3
            const uploadResult = await this._uploadToS3(file, fileName);

            // Create thumbnail for images
            let thumbnailUrl = null;
            if (fileType === 'image') {
                thumbnailUrl = await this._generateThumbnail(file, fileName);
            }

            // Save file record in database
            return {
                originalName: file.originalname,
                name: fileName,
                thumbnailFileUrl: thumbnailUrl,
                fileUrl: uploadResult.Location,
                fileType,
                extension: fileExtension.substring(1), // Remove the dot
            };

        } catch (error) {
            console.error('Error in file upload:', error);
            throw error;
        }
    }

    async _uploadToS3(file, fileName) {
        const params = {
            Bucket: process.env.AWS_S3_BUCKET,
            Key: `uploads/${fileName}`,
            Body: file.buffer,
            ContentType: file.mimetype,
            ACL: 'public-read'
        };

        try {
            await s3Client.send(new PutObjectCommand(params));
            return {
                Location: `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/uploads/${fileName}`
            };
        } catch (error) {
            console.error('S3 upload error:', error);
            throw new Error('Failed to upload file to S3');
        }
    }

    _determineFileType(mimetype) {
        const imageTypes = ['image/jpeg', 'image/png', 'image/jpg'];
        const videoTypes = ['video/mp4', 'video/mpeg', 'video/quicktime'];
        const documentTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

        if (imageTypes.includes(mimetype)) return 'image';
        if (videoTypes.includes(mimetype)) return 'video';
        if (documentTypes.includes(mimetype)) return 'document';
        return 'file';
    }

    async _generateThumbnail(file, originalFileName) {
        // Implementation for thumbnail generation
        // This would typically use sharp or another image processing library
        // For brevity, this is left as an exercise
        return null;
    }
}

module.exports = new FileService();