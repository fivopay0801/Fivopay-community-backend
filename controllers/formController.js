'use strict';

const { OnboardingForm, User, ContactForm } = require('../models');
const { success, error } = require('../utils/response');
const nodemailer = require('nodemailer');

/**
 * POST /api/forms/onboarding
 * Submit or update onboarding form.
 * Public access: no validation, optional adminId if logged in.
 */
async function submitOnboardingForm(req, res, next) {
    try {
        const adminId = req.user ? req.user.id : null;
        const formData = { ...req.body };

        // Handle file uploads if present (Mapping S3 locations to model fields)
        if (req.files) {
            if (req.files.registrationCertificate) formData.registrationCertificateUrl = req.files.registrationCertificate[0].location;
            if (req.files.panCard) formData.panCardUrl = req.files.panCard[0].location;
            if (req.files.addressProof) formData.addressProofUrl = req.files.addressProof[0].location;
            if (req.files.idProof) formData.idProofUrl = req.files.idProof[0].location;
            if (req.files.bankProof) formData.bankProofUrl = req.files.bankProof[0].location;
        }

        let form;
        if (adminId) {
            form = await OnboardingForm.findOne({ where: { adminId } });
        }

        if (form) {
            await form.update(formData);
        } else {
            form = await OnboardingForm.create({ ...formData, adminId });
        }

        return success(res, { form }, 'Onboarding form submitted successfully.');
    } catch (err) {
        next(err);
    }
}

/**
 * GET /api/forms/onboarding/:id?
 * Get onboarding form details.
 * Supports logged-in admin or ID parameter.
 */
async function getOnboardingForm(req, res, next) {
    try {
        const id = req.params.id;
        const adminId = req.user ? req.user.id : null;

        let form;
        if (id) {
            form = await OnboardingForm.findByPk(id);
        } else if (adminId) {
            form = await OnboardingForm.findOne({ where: { adminId } });
        }

        if (!form) {
            return error(res, 'Onboarding form not found.', 404);
        }

        return success(res, { form });
    } catch (err) {
        next(err);
    }
}
/**
 * POST /api/form/contact
 * Submit contact form and send emails.
 * Public access.
 */
async function submitContactForm(req, res, next) {
    try {
        const { firstName, lastName, email, message } = req.body;

        if (!firstName || !lastName || !email || !message) {
            return error(res, 'All fields are required.', 400);
        }

        // Save to database
        const contactEntry = await ContactForm.create({
            firstName,
            lastName,
            email,
            message
        });

        // Email Transport Configuration
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            secure: process.env.SMTP_PORT == 465,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });

        // 1. Send confirmation email to the user
        const userMailOptions = {
            from: process.env.SMTP_USER,
            to: email,
            subject: 'Thank you for contacting us!',
            text: `Hi ${firstName},\n\nThank you for reaching out to us. Our team will get back to you soon.\n\nBest regards,\nFivopay Team`,
            html: `<p>Hi <strong>${firstName}</strong>,</p><p>Thank you for reaching out to us. Our team will get back to you soon.</p><p>Best regards,<br>Fivopay Team</p>`
        };

        // 2. Send notification email to official mail
        const adminMailOptions = {
            from: process.env.SMTP_USER,
            to: process.env.OFFICIAL_MAIL,
            subject: 'New Contact Form Submission',
            text: `New contact request details:\n\nName: ${firstName} ${lastName}\nEmail: ${email}\nMessage: ${message}`,
            html: `<h3>New Contact Request Details</h3>
                   <p><strong>Name:</strong> ${firstName} ${lastName}</p>
                   <p><strong>Email:</strong> ${email}</p>
                   <p><strong>Message:</strong> ${message}</p>`
        };

        // Send emails asynchronously (don't block response)
        transporter.sendMail(userMailOptions).catch(err => console.error('Error sending user email:', err));
        transporter.sendMail(adminMailOptions).catch(err => console.error('Error sending admin email:', err));

        return success(res, { contactEntry }, 'Contact form submitted successfully. We will get back to you soon.');
    } catch (err) {
        next(err);
    }
}

module.exports = {
    submitOnboardingForm,
    getOnboardingForm,
    submitContactForm,
};
