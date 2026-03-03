'use strict';

// Set dummy env for multer-s3 dependency
process.env.S3_BUCKET_NAME = 'dummy-bucket';
process.env.S3_ACCESS_KEY = 'dummy-key';
process.env.S3_SECRET_KEY = 'dummy-secret';
process.env.S3_REGION = 'dummy-region';
process.env.FAST2SMS_API_KEY = 'dummy-key'; // To prevent skip log in otpService
process.env.NODE_ENV = 'development'; // Use local development database

const { Devotee } = require('../models');
const devoteeController = require('../controllers/devoteeController');
const { success, error } = require('../utils/response');

// Mock response for testing
const mockRes = () => {
    const res = {};
    res.status = (code) => { res.statusCode = code; return res; };
    res.json = (data) => { res.body = data; return res; };
    return res;
};

async function testRateLimiting() {
    console.log('Testing OTP Rate Limiting...');
    const mobile = '8989898989';

    // Cleanup
    await Devotee.destroy({ where: { mobile } });

    const req = { body: { mobile } };

    // 1. First Request
    console.log('\nRequest 1...');
    const res1 = mockRes();
    await devoteeController.sendOtpHandler(req, res1, (e) => console.error(e));
    console.log('Result 1 Status:', res1.statusCode || 200);

    // 2. Second Request (Immediate - should fail 60s rule)
    console.log('\nRequest 2 (Immediate)...');
    const res2 = mockRes();
    await devoteeController.sendOtpHandler(req, res2, (e) => console.error(e));
    console.log('Result 2 Code:', res2.statusCode);
    console.log('Result 2 Body:', res2.body.message);

    // 3. Simulate 61 seconds pass
    console.log('\nSimulating 61 seconds pass...');
    const dev = await Devotee.findOne({ where: { mobile } });
    dev.lastOtpSentAt = new Date(Date.now() - 61 * 1000);
    await dev.save();

    // 4. Request 2 (After 61s)
    console.log('\nRequest 2 (After 61s wait)...');
    const res3 = mockRes();
    await devoteeController.sendOtpHandler(req, res3, (e) => console.error(e));
    console.log('Result 2 Status:', res3.statusCode || 200);

    // 5. Simulate 61s pass again
    console.log('\nSimulating 61 seconds pass...');
    dev.lastOtpSentAt = new Date(Date.now() - 61 * 1000);
    await dev.save();

    // 6. Request 3
    console.log('\nRequest 3...');
    const res4 = mockRes();
    await devoteeController.sendOtpHandler(req, res4, (e) => console.error(e));
    console.log('Result 3 Status:', res4.statusCode || 200);

    // 7. Simulate 61s pass again
    console.log('\nSimulating 61 seconds pass...');
    dev.lastOtpSentAt = new Date(Date.now() - 61 * 1000);
    await dev.save();

    // 8. Request 4 (Should fail hourly limit)
    console.log('\nRequest 4 (Should hit hourly limit of 3)...');
    const res5 = mockRes();
    await devoteeController.sendOtpHandler(req, res5, (e) => console.error(e));
    console.log('Result 4 Code:', res5.statusCode);
    console.log('Result 4 Body:', res5.body.message);

    // 9. Simulate 1 hour pass
    console.log('\nSimulating 1 hour pass...');
    dev.otpWindowStartAt = new Date(Date.now() - 61 * 60 * 1000); // 61 mins ago
    await dev.save();

    // 10. Request 4 (Should succeed now)
    console.log('\nRequest 4 (After 1 hour window reset)...');
    const res6 = mockRes();
    await devoteeController.sendOtpHandler(req, res6, (e) => console.error(e));
    console.log('Result 4 Status:', res6.statusCode || 200);

    console.log('\nAll rate limiting tests completed.');
    process.exit(0);
}

testRateLimiting().catch(err => {
    console.error(err);
    process.exit(1);
});
