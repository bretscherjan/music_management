const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { adminOnly } = require('../middlewares/roleCheck.middleware');
const { authMiddleware } = require('../middlewares/auth.middleware');
const cmsController = require('../controllers/cms.controller');

// Multer Storage Configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const { type } = req.query; // type can be 'sponsors', 'carousel', 'gallery', 'flyers'
        const uploadDir = path.join(process.cwd(), 'uploads', 'cms', type || 'misc');

        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage });

/**
 * Public Routes
 */
router.get('/sponsors', cmsController.getSponsors);
router.get('/gallery', cmsController.getGalleryImages);
router.get('/flyers', cmsController.getFlyers);

/**
 * Admin Routes (Protected)
 */
router.use(authMiddleware, adminOnly);

// Sponsors
router.post('/sponsors', upload.single('logo'), cmsController.createSponsor);
router.put('/sponsors/:id', upload.single('logo'), cmsController.updateSponsor);
router.delete('/sponsors/:id', cmsController.deleteSponsor);


// Gallery
router.post('/gallery', upload.single('image'), cmsController.createGalleryImage);
router.put('/gallery/:id', cmsController.updateGalleryImage);
router.delete('/gallery/:id', cmsController.deleteGalleryImage);

// Flyers
router.post('/flyers', upload.single('image'), cmsController.createFlyer);
router.delete('/flyers/:id', cmsController.deleteFlyer);

module.exports = router;
