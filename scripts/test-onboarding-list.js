'use strict';

const formController = require('../controllers/formController');
const { OnboardingForm, User } = require('../models');

// Mock response object
const res = {
    status: function (code) { this.statusCode = code; return this; },
    json: function (data) { this.data = data; return this; },
};

async function test() {
    console.log('Testing Get All Onboarding Forms API...');

    try {
        // 1. Mock Request
        const req = {
            user: { id: 1, role: 'super_admin' }
        };

        // 2. Test getOnboardingForm with 'all'
        console.log('\n--- Testing getOnboardingForm with ID "all" ---');
        const reqAll = {
            params: { id: 'all' },
            user: { id: 1, role: 'super_admin' }
        };
        await formController.getOnboardingForm(reqAll, res, (err) => {
            if (err) throw err;
        });

        if (res.data && res.data.success) {
            console.log('✅ Success: Returned list of forms');
            console.log('Total forms found:', res.data.data.total);
        } else {
            console.error('❌ Failure:', res.data ? res.data.message : 'Unknown error');
        }

        // 3. Test getOnboardingForm with invalid ID
        console.log('\n--- Testing getOnboardingForm with invalid string ID ---');
        const reqInvalid = {
            params: { id: 'invalid-id' },
            user: { id: 1, role: 'super_admin' }
        };
        await formController.getOnboardingForm(reqInvalid, res, (err) => {
            if (err) throw err;
        });
        if (res.statusCode === 400) {
            console.log('✅ Success: Correctly handled invalid ID with 400');
        } else {
            console.error('❌ Failure: Expected 400 but got', res.statusCode);
        }

    } catch (err) {
        console.error('❌ Error during testing:', err.message);
    }

    console.log('\nTesting completed.');
    process.exit(0);
}

test();
