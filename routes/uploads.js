// routes/uploads.js
const express = require('express');
const router = express.Router();
const { uploadLogo, uploadBanner } = require('../controllers/uploadsController');
const { authenticateToken } = require('../middleware/auth');
const multer = require('multer');

const upload = multer({ storage: multer.memoryStorage() });

router.post('/logo', authenticateToken, upload.single('file'), uploadLogo);
router.post('/banner', authenticateToken, upload.single('file'), uploadBanner);

module.exports = router;
