const https = require('https');

/**
 * Send an OTP SMS via Fast2SMS using DLT route.
 * Expects process.env.FAST2SMS_API_KEY and process.env.FAST2SMS_SENDER_ID to be set.
 * @param {string} phoneNumber - Recipient mobile number
 * @param {string} templateId - The DLT Template ID (passed as 'message' field)
 * @param {string} variablesValues - The variable values (passed as 'variables_values' field, e.g. '1234|')
 * @returns {Promise<{ok: boolean, statusCode: number, body: any}>}
 */
async function sendOtpSms(phoneNumber, templateId, variablesValues) {
    return new Promise((resolve) => {
        const apiKey = process.env.FAST2SMS_API_KEY;
        const senderId = process.env.FAST2SMS_SENDER_ID;

        if (!apiKey) {
            console.warn('FAST2SMS_API_KEY is not set. Skipping SMS send.');
            return resolve({ ok: false, statusCode: 0, body: { message: 'API key missing' } });
        }

        const payload = JSON.stringify({
            route: 'dlt',
            sender_id: senderId || '',
            message: String(templateId),
            variables_values: String(variablesValues),
            numbers: String(phoneNumber)
        });

        const options = {
            hostname: 'www.fast2sms.com',
            path: '/dev/bulkV2',
            method: 'POST',
            headers: {
                authorization: apiKey,
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(payload)
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                let body = data;
                try { body = JSON.parse(data); } catch (_) { }
                const ok = res.statusCode >= 200 && res.statusCode < 300;
                if (!ok) {
                    console.error('Fast2SMS error:', res.statusCode, body);
                }
                resolve({ ok, statusCode: res.statusCode, body });
            });
        });

        req.on('error', (err) => {
            console.error('Fast2SMS request failed:', err);
            resolve({ ok: false, statusCode: 0, body: { error: err.message } });
        });

        req.write(payload);
        req.end();
    });
}

module.exports = { sendOtpSms };