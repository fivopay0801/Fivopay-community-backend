'use strict';

const { OnboardingForm, User } = require('../models');
const { success, error } = require('../utils/response');

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

module.exports = {
    submitOnboardingForm,
    getOnboardingForm,
};
