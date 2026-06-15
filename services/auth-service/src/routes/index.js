const express = require('express');
const router = express.Router();

router.use('/auth', require('./auth.routes'));
router.use('/admin', require('./admin.routes'));
router.use('/users', require('./user.routes'));
router.use('/registers', require('./register.routes'));
router.use('/settings', require('./settings.routes'));
router.use('/contact', require('./contact.routes'));
router.use('/public', require('./public.routes'));

module.exports = router;
