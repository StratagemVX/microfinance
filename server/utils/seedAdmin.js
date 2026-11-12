/**
 * Admin Seeder Script
 * Run: npm run seed:admin
 */
require('dotenv').config();
const { connectDB, disconnectDB } = require('../config/db');
const Admin = require('../models/Admin');

const DEFAULT_ADMINS = [
  { firstName: 'Super', lastName: 'Admin', email: 'admin@microfinance.com', phone: '9876543210', password: process.env.SEED_SUPER_ADMIN_PASSWORD, role: 'super_admin', department: 'management', accountStatus: 'active' },
  { firstName: 'Loan', lastName: 'Officer', email: 'loanofficer@microfinance.com', phone: '9876543211', password: process.env.SEED_LOAN_OFFICER_PASSWORD, role: 'loan_officer', department: 'loan_management', accountStatus: 'active' },
  { firstName: 'KYC', lastName: 'Verification', email: 'kyc@microfinance.com', phone: '9876543212', password: process.env.SEED_COMPLIANCE_OFFICER_PASSWORD, role: 'compliance_officer', department: 'kyc_verification', accountStatus: 'active' },
  { firstName: 'Customer', lastName: 'Service', email: 'support@microfinance.com', phone: '9876543213', password: process.env.SEED_CUSTOMER_SERVICE_PASSWORD, role: 'customer_service', department: 'customer_support', accountStatus: 'active' }
];

const seedAdmins = async () => {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await connectDB();

    const adminCount = await Admin.countDocuments();
    console.log(`📊 Current admin count: ${adminCount}`);

    if (adminCount === 0) {
      const missingCredentials = DEFAULT_ADMINS.filter((admin) => !admin.password || admin.password.length < 16);
      if (missingCredentials.length > 0) {
        throw new Error('Set all four SEED_*_PASSWORD environment variables (minimum 16 characters) before creating initial admin accounts.');
      }
      console.log('📝 No admins found. Creating defaults...\n');
      for (const adminData of DEFAULT_ADMINS) {
        const exists = await Admin.findOne({ email: adminData.email });
        if (exists) {
          console.log(`⏭️  Skipping ${adminData.email} (exists)`);
          continue;
        }
        const admin = await Admin.create(adminData);
        console.log(`✅ Created: ${admin.email} (${admin.role})`);
      }
    } else {
      console.log('\n✅ Admins already exist. Listing:');
      const admins = await Admin.find().select('firstName lastName email role department accountStatus');
      admins.forEach((a, i) => {
        console.log(`${i + 1}. ${a.firstName} ${a.lastName} | ${a.email} | ${a.role} | ${a.department} | ${a.accountStatus}`);
      });
    }

    console.log('\n✅ Seeding finished.');
  } catch (err) {
    console.error('❌ Seeder error:', err.message);
    process.exit(1);
  } finally {
    await disconnectDB();
  }
};

seedAdmins();