const nodemailer = require('nodemailer');

/**
 * Email Service
 * Handles all email sending functionality using Nodemailer
 */

// Create transporter with SMTP configuration
const createTransporter = () => {
    return nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });
};

/**
 * Send an email
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.text - Plain text content
 * @param {string} [options.html] - HTML content (optional)
 */
const sendEmail = async ({ to, subject, text, html }) => {
    const transporter = createTransporter();

    const mailOptions = {
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to,
        subject,
        text,
        html,
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('Email error:', error);
        throw error;
    }
};

/**
 * Send event reminder to user
 * @param {Object} user - User object with email, firstName, lastName
 * @param {Object} event - Event object with title, date, startTime, location
 */
const sendEventReminder = async (user, event) => {
    const formattedDate = new Date(event.date).toLocaleDateString('de-CH', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    const subject = `Erinnerung: ${event.title} - Bitte um Rückmeldung`;

    const text = `
Hallo ${user.firstName},

Du hast noch nicht auf folgenden Termin geantwortet:

${event.title}
Datum: ${formattedDate}
Zeit: ${event.startTime} - ${event.endTime}
${event.location ? `Ort: ${event.location}` : ''}

Bitte gib uns Bescheid, ob du teilnehmen kannst.

Freundliche Grüsse
Dein Verein
  `.trim();

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #1a365d; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background: #f7fafc; }
    .event-details { background: white; padding: 15px; border-radius: 8px; margin: 15px 0; }
    .event-title { font-size: 18px; font-weight: bold; color: #1a365d; }
    .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Erinnerung</h1>
    </div>
    <div class="content">
      <p>Hallo ${user.firstName},</p>
      <p>Du hast noch nicht auf folgenden Termin geantwortet:</p>
      
      <div class="event-details">
        <div class="event-title">${event.title}</div>
        <p><strong>Datum:</strong> ${formattedDate}</p>
        <p><strong>Zeit:</strong> ${event.startTime} - ${event.endTime}</p>
        ${event.location ? `<p><strong>Ort:</strong> ${event.location}</p>` : ''}
      </div>
      
      <p>Bitte gib uns Bescheid, ob du teilnehmen kannst.</p>
      <p>Freundliche Grüsse<br>Dein Verein</p>
    </div>
    <div class="footer">
      <p>Diese E-Mail wurde automatisch generiert.</p>
    </div>
  </div>
</body>
</html>
  `.trim();

    return sendEmail({ to: user.email, subject, text, html });
};

/**
 * Send welcome email to new user
 * @param {Object} user - User object with email, firstName
 */
const sendWelcomeEmail = async (user) => {
    const subject = 'Willkommen im Verein!';

    const text = `
Hallo ${user.firstName},

Herzlich willkommen! Dein Konto wurde erfolgreich erstellt.

Du kannst dich jetzt mit deiner E-Mail-Adresse einloggen und auf alle Vereinsfunktionen zugreifen.

Freundliche Grüsse
Dein Verein
  `.trim();

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #1a365d; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background: #f7fafc; }
    .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Willkommen!</h1>
    </div>
    <div class="content">
      <p>Hallo ${user.firstName},</p>
      <p>Herzlich willkommen! Dein Konto wurde erfolgreich erstellt.</p>
      <p>Du kannst dich jetzt mit deiner E-Mail-Adresse einloggen und auf alle Vereinsfunktionen zugreifen.</p>
      <p>Freundliche Grüsse<br>Dein Verein</p>
    </div>
    <div class="footer">
      <p>Diese E-Mail wurde automatisch generiert.</p>
    </div>
  </div>
</body>
</html>
  `.trim();

    return sendEmail({ to: user.email, subject, text, html });
};

/**
 * Send bulk reminders to users who haven't responded to an event
 * @param {Array} users - Array of user objects
 * @param {Object} event - Event object
 */
const sendBulkEventReminders = async (users, event) => {
    const results = await Promise.allSettled(
        users.map(user => sendEventReminder(user, event))
    );

    const sent = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    return { sent, failed, total: users.length };
};

module.exports = {
    sendEmail,
    sendEventReminder,
    sendWelcomeEmail,
    sendBulkEventReminders,
};
