'use strict';

const { generateOtp, sendOtp } = require('../services/otpService');

async function test() {
    console.log('Testing OTP Service Integration...');

    // 1. Test Generate OTP
    const otp = generateOtp();
    console.log(`Generated OTP: ${otp}`);
    if (otp.length !== 4 || isNaN(otp)) {
        console.error('FAIL: OTP must be a 4-digit number string.');
    } else {
        console.log('PASS: OTP is a 4-digit number.');
    }

    // 2. Test Send OTP (Simulation)
    console.log('\nSimulating SMS Send (Development Mode)...');
    process.env.NODE_ENV = 'development';
    const devResult = await sendOtp('9876543210', otp);
    console.log('Development Send Result:', devResult);

    // 3. Test Send OTP (Production Simulation - without API Key)
    console.log('\nSimulating SMS Send (Production Mode - API Key Missing)...');
    process.env.NODE_ENV = 'production';
    delete process.env.FAST2SMS_API_KEY;
    const prodResult = await sendOtp('9876543210', otp);
    console.log('Production (No Key) Send Result:', prodResult);

    console.log('\nVerification completed.');
    process.exit(0);
}

test();
