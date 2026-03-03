'use strict';

const { User } = require('../models');

async function check() {
    try {
        console.log('Testing User model hierarchy fields...');
        const testEmail = `test-hierarchy-${Date.now()}@example.com`;

        const user = User.build({
            name: 'Test Hierarchy',
            email: testEmail,
            role: 'admin',
            organizationCategory: 'faith',
            faith: 'hinduism',
            organizationSubtype: 'temple'
        });
        await user.setPassword('Password123!');
        await user.save();

        console.log('User created:', user.get({ plain: true }));

        const fetched = await User.findOne({ where: { email: testEmail } });
        console.log('Fetched user:', fetched.get({ plain: true }));

        // Cleanup
        await User.destroy({ where: { email: testEmail } });
        console.log('Test completed.');
    } catch (err) {
        console.error('Test failed:', err);
    }
    process.exit(0);
}

check();
