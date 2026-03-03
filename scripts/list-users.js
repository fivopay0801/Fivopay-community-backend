'use strict';

const { User } = require('../models');

async function list() {
    try {
        const count = await User.count();
        console.log(`Total users: ${count}`);

        const users = await User.findAll({
            limit: 10,
            attributes: ['id', 'email', 'name', 'role', 'organizationCategory', 'faith', 'organizationSubtype']
        });

        console.log('Sample users:');
        users.forEach(u => console.log(u.toJSON()));
    } catch (err) {
        console.error('Failed:', err);
    }
    process.exit(0);
}

list();
