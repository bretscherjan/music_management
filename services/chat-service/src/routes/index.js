const express = require('express');
const router = express.Router();
router.use('/chat', require('./chat.routes'));
router.use('/transcribe', require('./transcribe.routes'));
router.use('/protokoll', require('./protokoll.routes'));
module.exports = router;