const emailService = require('../services/email.service');
const { z } = require('zod');

/**
 * Handle contact form submission
 */
const submitContactForm = async (req, res, next) => {
    try {
        // Regex allows: Alphanumeric, German umlauts, spaces, and (),.!?;:-_
        const safeTextRegex = /^[a-zA-Z0-9\säöüÄÖÜéàèÉÀÈ(),.!?;:\-_]*$/;
        const safeTextError = 'Enthält nicht erlaubte Sonderzeichen';

        // Validation schema
        const contactSchema = z.object({
            name: z.string().min(2, 'Name muss mindestens 2 Zeichen lang sein').regex(safeTextRegex, safeTextError),
            email: z.string().email('Ungültige E-Mail-Adresse'),
            subject: z.string().min(3, 'Betreff muss mindestens 3 Zeichen lang sein').regex(safeTextRegex, safeTextError),
            message: z.string().min(10, 'Nachricht muss mindestens 10 Zeichen lang sein').regex(safeTextRegex, safeTextError),
        });

        // Validate request body
        const validatedData = contactSchema.parse(req.body);

        // Send email
        await emailService.sendContactFormEmail(validatedData);

        res.status(200).json({
            success: true,
            message: 'Nachricht erfolgreich gesendet',
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    submitContactForm,
};
