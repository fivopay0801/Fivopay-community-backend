'use strict';

const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_PORT == 465,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

/**
 * Send an email.
 * @param {Object} options - Mail options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} [options.text] - Plain text content
 * @param {string} [options.html] - HTML content
 * @returns {Promise<boolean>}
 */
async function sendMail({ to, subject, text, html }) {
    const mailOptions = {
        from: `${process.env.APP_NAME || 'Fivopay'} <${process.env.SMTP_USER}>`,
        to,
        subject,
        text,
        html,
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('[Email] Sent:', info.messageId);
        return true;
    } catch (error) {
        console.error('[Email] Error details:', {
            message: error.message,
            code: error.code,
            command: error.command
        });
        return false;
    }
}

module.exports = {
    sendMail,
};
