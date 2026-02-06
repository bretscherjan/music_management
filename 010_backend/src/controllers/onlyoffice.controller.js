const onlyOfficeService = require('../services/onlyoffice.service');
const { asyncHandler } = require('../middlewares/errorHandler.middleware');

const getEditorConfig = asyncHandler(async (req, res) => {
    const config = await onlyOfficeService.getEditorConfig(req.params.id, req.user);
    res.json(config);
});

const callback = asyncHandler(async (req, res) => {
    // Pass everything OnlyOffice sends + fileId from query
    const result = await onlyOfficeService.handleCallback(
        req.query.fileId,
        req.body,
        req.headers['authorization']
    );
    res.json(result);
});

module.exports = {
    getEditorConfig,
    callback
};
