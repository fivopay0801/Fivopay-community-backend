'use strict';

const devoteeController = require('../controllers/devoteeController');
const superAdminController = require('../controllers/superAdminController');
const { User } = require('../models');

// Mock response object
const res = {
    status: function (code) { this.statusCode = code; return this; },
    json: function (data) { this.data = data; return this; },
};

async function test() {
    console.log('Testing Hierarchical Selection APIs...');

    // 1. Test getOrganizationTypes
    console.log('\n--- Testing getOrganizationTypes ---');
    await devoteeController.getOrganizationTypes({}, res, (err) => console.error(err));
    console.log('Hierarchy:', JSON.stringify(res.data.data, null, 2));

    // 2. Test getOrganizations (Hinduism + Temple)
    console.log('\n--- Testing getOrganizations (Hinduism + Temple) ---');
    const reqHinduism = { query: { category: 'faith', faith: 'hinduism', subtype: 'temple' } };
    await devoteeController.getOrganizations(reqHinduism, res, (err) => console.error(err));
    console.log('Hinduism Temples Found:', res.data.data.total);
    res.data.data.organizations.forEach(o => console.log(` - ${o.name} (${o.organizationSubtype})`));

    // 3. Test getOrganizations (Islam + Dargah)
    console.log('\n--- Testing getOrganizations (Islam + Dargah) ---');
    const reqIslam = { query: { category: 'faith', faith: 'islam', subtype: 'dargah' } };
    await devoteeController.getOrganizations(reqIslam, res, (err) => console.error(err));
    console.log('Islam Dargahs Found:', res.data.data.total);
    res.data.data.organizations.forEach(o => console.log(` - ${o.name} (${o.organizationSubtype})`));

    // 4. Test getOrganizations (NGO)
    console.log('\n--- Testing getOrganizations (NGO) ---');
    const reqNGO = { query: { category: 'ngo' } };
    await devoteeController.getOrganizations(reqNGO, res, (err) => console.error(err));
    console.log('NGOs Found:', res.data.data.total);
    res.data.data.organizations.forEach(o => console.log(` - ${o.name}`));

    // 5. Test getDashboardStats
    console.log('\n--- Testing getDashboardStats ---');
    await superAdminController.getDashboardStats({}, res, (err) => console.error(err));
    console.log('Dashboard Stats (Organizations):', JSON.stringify(res.data.data.organizations, null, 2));

    console.log('\nTesting completed.');
    process.exit(0);
}

test();
