'use strict';

const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api'; // Adjust port if needed
const SUPER_ADMIN_EMAIL = 'superadmin@example.com';
const ADMIN_EMAIL = 'admin@example.com';
const NEW_PASSWORD = 'newpassword123';
const STATIC_OTP = '0000';

async function testForgotPasswordFlow(role, email) {
    const roleUrl = role === 'super-admin' ? `${BASE_URL}/super-admin` : `${BASE_URL}/admin`;

    try {
        console.log(`--- Testing ${role} Forgot Password Flow for ${email} ---`);

        // 1. Forgot Password
        console.log(`Step 1: Requesting OTP for forgot password...`);
        const forgotRes = await axios.post(`${roleUrl}/forgot-password`, { email });
        console.log('Response:', forgotRes.data.message);

        // 2. Verify OTP
        console.log('\nStep 2: Verifying OTP...');
        const verifyRes = await axios.post(`${roleUrl}/verify-forgot-otp`, {
            email,
            otp: STATIC_OTP
        });
        console.log('Response:', verifyRes.data.message);

        // 3. Reset Password
        console.log('\nStep 3: Resetting password...');
        const resetRes = await axios.post(`${roleUrl}/reset-password`, {
            email,
            otp: STATIC_OTP,
            password: NEW_PASSWORD
        });
        console.log('Response:', resetRes.data.message);

        // 4. Verify Login with New Password
        console.log('\nStep 4: Verifying login with new password...');
        const loginRes = await axios.post(`${roleUrl}/login`, {
            email,
            password: NEW_PASSWORD
        });
        console.log('Login successful! Token:', loginRes.data.data.token.substring(0, 20) + '...');

        console.log(`\n--- ${role} Test Completed Successfully ---`);
    } catch (error) {
        console.error(`\n--- ${role} Test Failed ---`);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.error('Error:', error.message);
        }
    }
}

async function runTests() {
    await testForgotPasswordFlow('super-admin', SUPER_ADMIN_EMAIL);
    console.log('\n' + '='.repeat(50) + '\n');
    await testForgotPasswordFlow('admin', ADMIN_EMAIL);
}

runTests();
