const axios = require('axios');

async function testContactForm() {
    const url = 'http://localhost:8000/api/form/contact';
    const data = {
        fullName: 'John Doe',
        orgName: 'Acme Corp',
        phone: '+1-234-567-8901',
        email: 'john.doe@example.com',
        message: 'Hello, this is a test message from the contact form.'
    };

    try {
        console.log('Testing Contact Form submission...');
        const response = await axios.post(url, data);
        console.log('Response Status:', response.status);
        console.log('Response Data:', JSON.stringify(response.data, null, 2));
    } catch (error) {
        console.error('Error during testing:');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.error(error.message);
        }
    }
}

testContactForm();
