const nodemailer = require('nodemailer');

/**
 * Send email utility function
 * @param {Object} options
 * @param {string} options.to - Receiver email
 * @param {string} options.subject - Email subject
 * @param {string} options.text - Plain text content
 * @param {string} options.html - HTML content (optional)
 */
const sendEmail = async ({ to, subject, text, html }) => {
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false, // true لو 465
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  const mailOptions = {
    from: `"ITI Hub" <${process.env.EMAIL_FROM}>`,
    to,
    subject,
    text,
    html
  };

  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
