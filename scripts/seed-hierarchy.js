'use strict';

const { User } = require('../models');
const { ROLES } = require('../constants/roles');
const { ORGANIZATION_CATEGORIES, FAITHS } = require('../constants/organization');

async function seed() {
    console.log('Seeding real-world hierarchical organization data...');

    const sampleAdmins = [
        // --- HINDUISM ---
        {
            name: 'Somnath Temple',
            email: 'somnath@temple.com',
            password: 'Password123!',
            organizationCategory: ORGANIZATION_CATEGORIES.FAITH,
            faith: FAITHS.HINDUISM,
            organizationSubtype: 'temple',
            phone: '9876543210',
            address: 'Somnath, Gujarat',
        },
        {
            name: 'Vaishno Devi Temple',
            email: 'vaishnodevi@temple.com',
            password: 'Password123!',
            organizationCategory: ORGANIZATION_CATEGORIES.FAITH,
            faith: FAITHS.HINDUISM,
            organizationSubtype: 'temple',
            phone: '9876543211',
            address: 'Katra, Jammu & Kashmir',
        },
        {
            name: 'Tirumala Venkateswara Temple',
            email: 'tirupati@temple.com',
            password: 'Password123!',
            organizationCategory: ORGANIZATION_CATEGORIES.FAITH,
            faith: FAITHS.HINDUISM,
            organizationSubtype: 'temple',
            phone: '9876543212',
            address: 'Tirupati, Andhra Pradesh',
        },
        {
            name: 'Sabarmati Ashram',
            email: 'sabarmati@ashram.com',
            password: 'Password123!',
            organizationCategory: ORGANIZATION_CATEGORIES.FAITH,
            faith: FAITHS.HINDUISM,
            organizationSubtype: 'ashram',
            phone: '9876543213',
            address: 'Ahmedabad, Gujarat',
        },
        {
            name: 'Art of Living International Center',
            email: 'artofliving@ashram.com',
            password: 'Password123!',
            organizationCategory: ORGANIZATION_CATEGORIES.FAITH,
            faith: FAITHS.HINDUISM,
            organizationSubtype: 'ashram',
            phone: '9876543214',
            address: 'Bengaluru, Karnataka',
        },
        {
            name: 'Gurukul Kangri Vishwavidyalaya',
            email: 'gurukul@education.com',
            password: 'Password123!',
            organizationCategory: ORGANIZATION_CATEGORIES.FAITH,
            faith: FAITHS.HINDUISM,
            organizationSubtype: 'gurukul',
            phone: '9876543215',
            address: 'Haridwar, Uttarakhand',
        },
        {
            name: 'Geeta Bhawan',
            email: 'geetabhawan@dharmsala.com',
            password: 'Password123!',
            organizationCategory: ORGANIZATION_CATEGORIES.FAITH,
            faith: FAITHS.HINDUISM,
            organizationSubtype: 'dharmsala',
            phone: '9876543216',
            address: 'Rishikesh, Uttarakhand',
        },
        {
            name: 'Pathmeda Goshala',
            email: 'pathmeda@gausala.com',
            password: 'Password123!',
            organizationCategory: ORGANIZATION_CATEGORIES.FAITH,
            faith: FAITHS.HINDUISM,
            organizationSubtype: 'gausala',
            phone: '9876543217',
            address: 'Jalore, Rajasthan',
        },

        // --- ISLAM ---
        {
            name: 'Ajmer Sharif Dargah',
            email: 'ajmer@dargah.com',
            password: 'Password123!',
            organizationCategory: ORGANIZATION_CATEGORIES.FAITH,
            faith: FAITHS.ISLAM,
            organizationSubtype: 'dargah',
            phone: '9876543218',
            address: 'Ajmer, Rajasthan',
        },
        {
            name: 'Nizamuddin Auliya Dargah',
            email: 'nizamuddin@dargah.com',
            password: 'Password123!',
            organizationCategory: ORGANIZATION_CATEGORIES.FAITH,
            faith: FAITHS.ISLAM,
            organizationSubtype: 'dargah',
            phone: '9876543219',
            address: 'Delhi',
        },
        {
            name: 'Jama Masjid Delhi',
            email: 'jamamasjid@masjid.com',
            password: 'Password123!',
            organizationCategory: ORGANIZATION_CATEGORIES.FAITH,
            faith: FAITHS.ISLAM,
            organizationSubtype: 'masjid',
            phone: '9876543220',
            address: 'Delhi',
        },
        {
            name: 'Mecca Masjid',
            email: 'meccamasjid@masjid.com',
            password: 'Password123!',
            organizationCategory: ORGANIZATION_CATEGORIES.FAITH,
            faith: FAITHS.ISLAM,
            organizationSubtype: 'masjid',
            phone: '9876543221',
            address: 'Hyderabad, Telangana',
        },
        {
            name: 'Darul Uloom Deoband',
            email: 'deoband@madrasa.com',
            password: 'Password123!',
            organizationCategory: ORGANIZATION_CATEGORIES.FAITH,
            faith: FAITHS.ISLAM,
            organizationSubtype: 'madrasa',
            phone: '9876543222',
            address: 'Saharanpur, Uttar Pradesh',
        },

        // --- CHRISTIANITY ---
        {
            name: 'Basilica of Bom Jesus',
            email: 'bomjesus@church.com',
            password: 'Password123!',
            organizationCategory: ORGANIZATION_CATEGORIES.FAITH,
            faith: FAITHS.CHRISTIANITY,
            organizationSubtype: 'church',
            phone: '9876543223',
            address: 'Old Goa, Goa',
        },
        {
            name: 'San Thome Basilica',
            email: 'santhome@church.com',
            password: 'Password123!',
            organizationCategory: ORGANIZATION_CATEGORIES.FAITH,
            faith: FAITHS.CHRISTIANITY,
            organizationSubtype: 'church',
            phone: '9876543224',
            address: 'Chennai, Tamil Nadu',
        },
        {
            name: 'Loreto Convent',
            email: 'loreto@convent.com',
            password: 'Password123!',
            organizationCategory: ORGANIZATION_CATEGORIES.FAITH,
            faith: FAITHS.CHRISTIANITY,
            organizationSubtype: 'convent',
            phone: '9876543225',
            address: 'Darjeeling, West Bengal',
        },
        {
            name: 'St. Joseph Seminary',
            email: 'stjoseph@seminary.com',
            password: 'Password123!',
            organizationCategory: ORGANIZATION_CATEGORIES.FAITH,
            faith: FAITHS.CHRISTIANITY,
            organizationSubtype: 'seminary',
            phone: '9876543226',
            address: 'Mangalore, Karnataka',
        },

        // --- SIKHISM ---
        {
            name: 'Golden Temple Amritsar',
            email: 'goldentemple@gurudwara.com',
            password: 'Password123!',
            organizationCategory: ORGANIZATION_CATEGORIES.FAITH,
            faith: FAITHS.SIKHISM,
            organizationSubtype: 'gurudwara',
            phone: '9876543227',
            address: 'Amritsar, Punjab',
        },
        {
            name: 'Bangla Sahib Gurudwara',
            email: 'banglasahib@gurudwara.com',
            password: 'Password123!',
            organizationCategory: ORGANIZATION_CATEGORIES.FAITH,
            faith: FAITHS.SIKHISM,
            organizationSubtype: 'gurudwara',
            phone: '9876543228',
            address: 'Delhi',
        },
        {
            name: 'Hemkund Sahib',
            email: 'hemkund@gurudwara.com',
            password: 'Password123!',
            organizationCategory: ORGANIZATION_CATEGORIES.FAITH,
            faith: FAITHS.SIKHISM,
            organizationSubtype: 'gurudwara',
            phone: '9876543229',
            address: 'Chamoli, Uttarakhand',
        },

        // --- BUDDHISM ---
        {
            name: 'Mahabodhi Temple',
            email: 'mahabodhi@temple.com',
            password: 'Password123!',
            organizationCategory: ORGANIZATION_CATEGORIES.FAITH,
            faith: FAITHS.BUDDHISM,
            organizationSubtype: 'temple',
            phone: '9876543230',
            address: 'Bodh Gaya, Bihar',
        },
        {
            name: 'Tawang Monastery',
            email: 'tawang@monastery.com',
            password: 'Password123!',
            organizationCategory: ORGANIZATION_CATEGORIES.FAITH,
            faith: FAITHS.BUDDHISM,
            organizationSubtype: 'monastery',
            phone: '9876543231',
            address: 'Tawang, Arunachal Pradesh',
        },
        {
            name: 'Sanchi Stupa',
            email: 'sanchi@stupa.com',
            password: 'Password123!',
            organizationCategory: ORGANIZATION_CATEGORIES.FAITH,
            faith: FAITHS.BUDDHISM,
            organizationSubtype: 'stupa',
            phone: '9876543232',
            address: 'Sanchi, Madhya Pradesh',
        },

        // --- NGO ---
        {
            name: 'HelpAge India',
            email: 'helpage@ngo.com',
            password: 'Password123!',
            organizationCategory: ORGANIZATION_CATEGORIES.NGO,
            faith: null,
            organizationSubtype: 'elderly care',
            phone: '9876543233',
            address: 'Delhi',
        },
        {
            name: 'PETA India',
            email: 'peta@ngo.com',
            password: 'Password123!',
            organizationCategory: ORGANIZATION_CATEGORIES.NGO,
            faith: null,
            organizationSubtype: 'animals',
            phone: '9876543234',
            address: 'Mumbai, Maharashtra',
        },
        {
            name: 'Smile Foundation',
            email: 'smile@ngo.com',
            password: 'Password123!',
            organizationCategory: ORGANIZATION_CATEGORIES.NGO,
            faith: null,
            organizationSubtype: 'child welfare',
            phone: '9876543235',
            address: 'Delhi',
        },
        {
            name: 'Goonj',
            email: 'goonj@ngo.com',
            password: 'Password123!',
            organizationCategory: ORGANIZATION_CATEGORIES.NGO,
            faith: null,
            organizationSubtype: 'welfare',
            phone: '9876543236',
            address: 'Delhi',
        },
    ];

    for (const adminData of sampleAdmins) {
        try {
            const existing = await User.findOne({ where: { email: adminData.email } });
            if (!existing) {
                const user = User.build({
                    ...adminData,
                    role: ROLES.ADMIN,
                    organizationType: 'temple', // Legacy fallback
                });
                await user.setPassword(adminData.password);
                await user.save();
                console.log(`Created admin: ${adminData.name}`);
            } else {
                await existing.update({
                    organizationCategory: adminData.organizationCategory,
                    faith: adminData.faith,
                    organizationSubtype: adminData.organizationSubtype,
                });
                console.log(`Updated existing admin: ${adminData.name}`);
            }
        } catch (err) {
            console.error(`Error seeding ${adminData.name}:`, err.message);
        }
    }

    console.log('--- Bulk Updating Existing Admins ---');
    try {
        const existingAdmins = await User.findAll({
            where: {
                role: ROLES.ADMIN,
                organizationCategory: null
            }
        });

        console.log(`Found ${existingAdmins.length} admins with null hierarchy data.`);

        for (const user of existingAdmins) {
            const name = user.name.toLowerCase();
            let cat = ORGANIZATION_CATEGORIES.FAITH;
            let faith = FAITHS.HINDUISM;
            let subtype = 'temple';

            if (name.includes('masjid') || name.includes('dargah')) {
                faith = FAITHS.ISLAM;
                subtype = name.includes('dargah') ? 'dargah' : 'masjid';
            } else if (name.includes('church') || name.includes('basilica') || name.includes('cathedral')) {
                faith = FAITHS.CHRISTIANITY;
                subtype = 'church';
            } else if (name.includes('gurudwara') || name.includes('hazur sahib')) {
                faith = FAITHS.SIKHISM;
                subtype = 'gurudwara';
            } else if (name.includes('ashram')) {
                subtype = 'ashram';
            } else if (name.includes('gausala') || name.includes('goshala')) {
                subtype = 'gausala';
            }

            try {
                await user.update({
                    organizationCategory: cat,
                    faith: faith,
                    organizationSubtype: subtype
                });
                console.log(`Updated hierarchy for: ${user.name} -> ${faith}/${subtype}`);
            } catch (err) {
                console.error(`Error updating bulk user ${user.name}:`, err.message);
            }
        }
    } catch (err) {
        console.error('Bulk update failed:', err.message);
    }

    console.log('Seeding and bulk updates completed.');
    process.exit(0);
}

seed();
