const nodemailer = require('nodemailer');
const path = require('path');

/**
 * Send an email through the SMTP service configured in the environment.
 * @param {Object} options
 * @param {string|string[]} options.to - Receiver email(s)
 * @param {string} options.subject - Email subject
 * @param {string} [options.text] - Plain text content
 * @param {string} [options.html] - HTML content
 * @returns {Promise<{id: string}>} Message id on success
 */
const sendEmail = async ({ to, subject, text, html }) => {
  // Preserve the existing test-mode behavior: never send real emails.
  if (process.env.NODE_ENV === 'test') {
    return { id: 'test-mode-no-send' };
  }

  for (const key of ['EMAIL_SERVICE', 'EMAIL_USER', 'EMAIL_PASSWORD', 'EMAIL_FROM_ADDRESS']) {
    if (!process.env[key]) {
      throw new Error(`${key} is not set - cannot send emails`);
    }
  }

  // Read configuration at send time because app.js loads dotenv after imports.
  const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  const result = await transporter.sendMail({
    from: { name: 'ITI Hub', address: process.env.EMAIL_FROM_ADDRESS },
    to,
    subject,
    ...(text ? { text } : {}),
    ...(html ? { html } : {}),
    ...(html?.includes('cid:iti-hub-logo') ? {
      attachments: [{
        filename: 'logo.png',
        path: path.join(__dirname, '../assets/logo.png'),
        cid: 'iti-hub-logo',
        contentDisposition: 'inline',
      }],
    } : {}),
  });

  return { id: result.messageId };
};

module.exports = sendEmail;
