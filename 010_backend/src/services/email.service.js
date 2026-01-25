const nodemailer = require('nodemailer');

/**
 * Email Service
 * Handles all email sending functionality using Nodemailer
 */

// Create transporter with SMTP configuration
// Create transporter with SMTP configuration
const createTransporter = () => {
  let port = parseInt(process.env.SMTP_PORT) || 25;

  // FIX: Force Port 25 if 465 is detected, because 465 is blocked/broken on this server environment
  if (port === 465) {
    console.warn('⚠️ DETECTED BROKEN PORT 465. FORCING FALLBACK TO PORT 25 (Unencrypted).');
    port = 25;
  }

  // Secure is false for port 25
  const isSecure = false;

  console.log(`📧 Initializing Email Transporter: Host=${process.env.SMTP_HOST} Port=${port} Secure=${isSecure} User=${process.env.SMTP_USER}`);

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: port,
    secure: isSecure,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    // Connection settings
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 20000,
    tls: {
      rejectUnauthorized: false
    },
    ignoreTLS: true // Always force true for Port 25 fallback
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

  console.log(`📧 Sending Email: To=${to} Subject=${subject} Text=${text} Html=${html}`);

  const mailOptions = {
    from: 'noreply@musig-elgg.ch', // email absender!!!
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
Musig Elgg
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
      <p>Freundliche Grüsse<br>Musig Elgg</p>
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
Musig Elgg
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
      <p>Freundliche Grüsse<br>Musig Elgg</p>
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



/**
 * Send event created notification
 */
const sendEventCreatedEmail = async (user, event) => {
  const formattedDate = new Date(event.date).toLocaleDateString('de-CH');
  const subject = `Neuer Termin: ${event.title}`;
  const text = `
Hallo ${user.firstName},

Ein neuer Termin wurde erstellt:

${event.title}
Datum: ${formattedDate}
Zeit: ${event.startTime} - ${event.endTime}
${event.location ? `Ort: ${event.location}` : ''}

Bitte kontrolliere deine Verfügbarkeit.

Freundliche Grüsse
Musig Elgg
    `.trim();

  return sendEmail({ to: user.email, subject, text });
};

/**
 * Send event updated notification
 */
const sendEventUpdatedEmail = async (user, event) => {
  const formattedDate = new Date(event.date).toLocaleDateString('de-CH');
  const subject = `Termin aktualisiert: ${event.title}`;
  const text = `
Hallo ${user.firstName},

Ein Termin wurde bearbeitet:

${event.title}
Datum: ${formattedDate}
Zeit: ${event.startTime} - ${event.endTime}

Freundliche Grüsse
Musig Elgg
    `.trim();

  return sendEmail({ to: user.email, subject, text });
};

/**
 * Send event deleted notification
 */
const sendEventDeletedEmail = async (user, event) => {
  const formattedDate = new Date(event.date).toLocaleDateString('de-CH');
  const subject = `Termin abgesagt: ${event.title}`;
  const text = `
Hallo ${user.firstName},

Der folgende Termin wurde abgesagt/gelöscht:

${event.title}
Datum: ${formattedDate}

Freundliche Grüsse
Musig Elgg
    `.trim();
  console.log('sendEventDeletedEmail', "to:" + user.email + " subject:" + subject + " text:" + text);

  return sendEmail({ to: user.email, subject, text });
};

/**
 * Send file uploaded notification
 */
const sendFileUploadedEmail = async (user, file) => {
  const subject = `Neue Datei: ${file.originalName}`;
  const text = `
Hallo ${user.firstName},

Eine neue Datei wurde hochgeladen:
${file.originalName}

Du kannst sie im Mitgliederbereich herunterladen.

Freundliche Grüsse
Musig Elgg
    `.trim();

  return sendEmail({ to: user.email, subject, text });
};

/**
 * Send file deleted notification
 */
const sendFileDeletedEmail = async (user, file) => {
  const subject = `Datei gelöscht: ${file.originalName}`;
  const text = `
Hallo ${user.firstName},

Eine Datei wurde gelöscht:
${file.originalName}

Freundliche Grüsse
Musig Elgg
    `.trim();

  return sendEmail({ to: user.email, subject, text });
};


/**
 * Send event reminder (custom time before)
 */
const sendEventReminderNotification = async (user, event, hoursBefore) => {
  const formattedDate = new Date(event.date).toLocaleDateString('de-CH');
  const subject = `Erinnerung: Termin in ${hoursBefore} Stunden`;
  const text = `
Hallo ${user.firstName},

Dies ist eine Erinnerung, dass in Kürze folgender Termin stattfindet:

${event.title}
Datum: ${formattedDate}
Zeit: ${event.startTime}

Freundliche Grüsse
Musig Elgg
    `.trim();

  return sendEmail({ to: user.email, subject, text });
};



/**
 * Send contact form email
 * @param {Object} data - Contact form data
 * @param {string} data.name - Sender name
 * @param {string} data.email - Sender email
 * @param {string} data.subject - Email subject
 * @param {string} data.message - Email message
 */
const sendContactFormEmail = async ({ name, email, subject, message }) => {
  const to = 'info@musig-elgg.ch'; // Target email address
  const emailSubject = `[Kontaktformular] ${subject}`;

  const text = `
Neue Nachricht über das Kontaktformular:

Von: ${name} (${email})
Betreff: ${subject}

Nachricht:
${message}
  `.trim();

  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; }
    .header { background: #f4f4f4; padding: 10px; border-bottom: 1px solid #ddd; }
    .content { padding: 20px 0; }
    .label { font-weight: bold; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>Neue Kontaktanfrage</h2>
    </div>
    <div class="content">
      <p><span class="label">Von:</span> ${name} (<a href="mailto:${email}">${email}</a>)</p>
      <p><span class="label">Betreff:</span> ${subject}</p>
      <hr>
      <p><span class="label">Nachricht:</span></p>
      <p style="white-space: pre-wrap;">${message}</p>
    </div>
  </div>
</body>
</html>
  `.trim();

  // Determine valid Sender address
  let fromAddress = process.env.SMTP_FROM || process.env.SMTP_USER;
  if (!fromAddress.includes('@')) {
    fromAddress = 'noreply@musig-elgg.ch';
  }

  // Create custom transporter options to set Reply-To
  const transporter = createTransporter();
  const mailOptions = {
    from: fromAddress,
    to,
    replyTo: email, // Set Reply-To to the sender's email
    subject: emailSubject,
    text,
    html,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Contact form email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Contact form email error:', error);
    throw error;
  }
};

/**
 * Send password reset email
 * @param {Object} user - User object
 * @param {string} resetUrl - Password reset URL
 */
const sendPasswordResetEmail = async (user, resetUrl) => {
  const subject = 'Passwort zurücksetzen - Musig Elgg';

  const text = `
Hallo ${user.firstName},

Du hast das Zurücksetzen deines Passworts angefordert.
Bitte klicke auf den folgenden Link, um ein neues Passwort zu erstellen:

${resetUrl}

Dieser Link ist 1 Stunde gültig.
Falls du dies nicht angefordert hast, kannst du diese E-Mail ignorieren.

Freundliche Grüsse
Musig Elgg
  `.trim();

  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; }
    .button { display: inline-block; padding: 10px 20px; background-color: #1a365d; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <h2>Passwort zurücksetzen</h2>
    <p>Hallo ${user.firstName},</p>
    <p>Du hast das Zurücksetzen deines Passworts angefordert.</p>
    <p>Bitte klicke auf den folgenden Button, um ein neues Passwort zu erstellen:</p>
    <a href="${resetUrl}" class="button">Passwort zurücksetzen</a>
    <p>Oder verwende diesen Link:</p>
    <p><a href="${resetUrl}">${resetUrl}</a></p>
    <p>Dieser Link ist 1 Stunde gültig.</p>
    <hr>
    <p style="font-size: 12px; color: #666;">Falls du dies nicht angefordert hast, kannst du diese E-Mail ignorieren.</p>
  </div>
</body>
</html>
  `.trim();

  return sendEmail({ to: user.email, subject, text, html });
};

/**
 * Send personalized event reminder to user
 * @param {Object} user - User object
 * @param {Object} event - Event object
 * @param {string} timeDisplay - e.g. "2 Stunden" or "1 Tag"
 */
const sendPersonalEventReminder = async (user, event, timeDisplay) => {
  const formattedDate = new Date(event.date).toLocaleDateString('de-CH', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const subject = `Erinnerung: ${event.title}`;

  const text = `
Hallo ${user.firstName},

Dies ist eine Erinnerung an folgenden Termin in ${timeDisplay}:

${event.title}
Datum: ${formattedDate}
Zeit: ${event.startTime} - ${event.endTime}
${event.location ? `Ort: ${event.location}` : ''}
${event.description ? `\nDetails: ${event.description}` : ''}

Freundliche Grüsse
Musig Elgg
  `.trim();

  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; }
    .event-box { background-color: #f8fafc; border-left: 4px solid #1a365d; padding: 15px; margin: 20px 0; }
    .button { display: inline-block; padding: 10px 20px; background-color: #1a365d; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <h2>Erinnerung: ${event.title}</h2>
    <p>Hallo ${user.firstName},</p>
    <p>Dies ist deine persönliche Erinnerung an einen Termin in <strong>${timeDisplay}</strong>:</p>
    
    <div class="event-box">
      <h3 style="margin-top: 0;">${event.title}</h3>
      <p><strong>Datum:</strong> ${formattedDate}</p>
      <p><strong>Zeit:</strong> ${event.startTime} - ${event.endTime}</p>
      ${event.location ? `<p><strong>Ort:</strong> ${event.location}</p>` : ''}
    </div>

    ${event.description ? `<p>${event.description}</p>` : ''}

    <a href="${process.env.FRONTEND_URL}/events/${event.id}" class="button">Zum Termin</a>
    
    <hr>
    <p style="font-size: 12px; color: #666;">Du erhältst diese E-Mail aufgrund deiner persönlichen Erinnerungs-Einstellungen.</p>
  </div>
</body>
</html>
  `.trim();

  return sendEmail({ to: user.email, subject, text, html });
};

module.exports = {
  sendEmail,
  sendEventReminder,
  sendWelcomeEmail,
  sendBulkEventReminders,
  sendEventCreatedEmail,
  sendEventUpdatedEmail,
  sendEventDeletedEmail,
  sendFileUploadedEmail,
  sendFileDeletedEmail,
  sendPersonalEventReminder, // New function
  sendContactFormEmail,
  sendPasswordResetEmail
};
