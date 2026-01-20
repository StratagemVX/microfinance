/**
 * Loan Products Seeder Script
 * Run: npm run seed:loans
 */
require('dotenv').config();
const { connectDB, disconnectDB } = require('../config/db');
const Admin = require('../models/Admin');
const Loan = require('../models/Loan');

const MICRO_LOANS = [
  {
    name: 'Micro Loan – Emergency Needs',
    description: 'Quick micro-loan for urgent expenses like repairs, bills, or short-term cash gaps.',
    category: 'personal',
    minAmount: 5000,
    maxAmount: 50000,
    minTenureMonths: 3,
    maxTenureMonths: 12,
    annualInterestRate: 14,
    minMonthlyIncome: 15000,
    minAge: 21,
    maxAge: 60,
    requiredCreditScore: 0,
    features: [
      'Approval within 24–48 hours',
      'No collateral required',
      'Flexible repayment options'
    ],
    requirements: [
      'Valid ID (Aadhar/PAN)',
      'Address proof',
      'Income proof (last 3 months)'
    ]
  },
  {
    name: 'Micro Loan – Medical Expenses',
    description: 'Micro financing for medical bills, treatments, or hospitalization support.',
    category: 'personal',
    minAmount: 10000,
    maxAmount: 80000,
    minTenureMonths: 3,
    maxTenureMonths: 12,
    annualInterestRate: 13.5,
    minMonthlyIncome: 15000,
    minAge: 21,
    maxAge: 60,
    requiredCreditScore: 0,
    features: [
      'Fast-track processing for medical emergencies',
      'No collateral required',
      'Affordable EMIs'
    ],
    requirements: [
      'Valid ID (Aadhar/PAN)',
      'Address proof',
      'Recent medical bills/estimates'
    ]
  },
  {
    name: 'Micro Loan – Education Fees',
    description: 'Support for tuition fees, coaching, books, and educational supplies.',
    category: 'education',
    minAmount: 10000,
    maxAmount: 100000,
    minTenureMonths: 6,
    maxTenureMonths: 18,
    annualInterestRate: 12.5,
    minMonthlyIncome: 15000,
    minAge: 21,
    maxAge: 60,
    requiredCreditScore: 0,
    features: [
      'Covers tuition and supplies',
      'Flexible tenure up to 18 months',
      'Parent/guardian can apply'
    ],
    requirements: [
      'Valid ID (Aadhar/PAN)',
      'Address proof',
      'Fee receipt/admission letter'
    ]
  },
  {
    name: 'Micro Loan – Home Repair',
    description: 'Small-ticket loan for home repairs, painting, and maintenance needs.',
    category: 'home',
    minAmount: 10000,
    maxAmount: 80000,
    minTenureMonths: 3,
    maxTenureMonths: 12,
    annualInterestRate: 13,
    minMonthlyIncome: 15000,
    minAge: 21,
    maxAge: 60,
    requiredCreditScore: 0,
    features: [
      'Quick disbursal for repair needs',
      'No collateral required',
      'Simple documentation'
    ],
    requirements: [
      'Valid ID (Aadhar/PAN)',
      'Address proof',
      'Estimate/quotation (optional)'
    ]
  },
  {
    name: 'Micro Loan – Working Capital',
    description: 'For small business working capital, inventory purchase, and daily operations.',
    category: 'business',
    minAmount: 20000,
    maxAmount: 100000,
    minTenureMonths: 6,
    maxTenureMonths: 18,
    annualInterestRate: 15,
    minMonthlyIncome: 20000,
    minAge: 21,
    maxAge: 60,
    requiredCreditScore: 0,
    features: [
      'Designed for micro and small businesses',
      'Flexible repayment tenure',
      'No collateral for eligible profiles'
    ],
    requirements: [
      'Valid ID (Aadhar/PAN)',
      'Business proof (GST/Shop Act/Invoices)',
      'Bank statements (last 6 months)'
    ]
  },
  {
    name: 'Micro Loan – Agricultural Inputs',
    description: 'For seeds, fertilizers, small equipment, and seasonal agri needs.',
    category: 'agricultural',
    minAmount: 15000,
    maxAmount: 100000,
    minTenureMonths: 6,
    maxTenureMonths: 12,
    annualInterestRate: 12.5,
    minMonthlyIncome: 15000,
    minAge: 21,
    maxAge: 60,
    requiredCreditScore: 0,
    features: [
      'Aligned to seasonal cycles',
      'No collateral for eligible farmers',
      'Quick disbursal'
    ],
    requirements: [
      'Valid ID (Aadhar/PAN)',
      'Address proof',
      'Basic landholding/lease proof (if available)'
    ]
  }
];

const seedLoans = async () => {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await connectDB();

    // Find a creator admin
    let admin = await Admin.findOne({ email: 'admin@microfinance.com' });
    if (!admin) {
      admin = await Admin.findOne();
    }
    if (!admin) {
      throw new Error('No admin found. Please run npm run seed:admin first.');
    }

    const existingCount = await Loan.countDocuments();
    console.log(`📊 Existing loan products: ${existingCount}`);

    for (const p of MICRO_LOANS) {
      const exists = await Loan.findOne({ name: p.name });
      if (exists) {
        console.log(`⏭️  Skipping: ${p.name} (already exists)`);
        continue;
      }
      const loan = await Loan.create({
        ...p,
        description_long: p.description,
        createdBy: admin._id,
        isActive: true
      });
      console.log(`✅ Created: ${loan.name} [${loan.category}]`);
    }

    const finalCount = await Loan.countDocuments();
    console.log(`\n✅ Seeding finished. Total products: ${finalCount}`);
  } catch (err) {
    console.error('❌ Seeder error:', err.message);
    process.exit(1);
  } finally {
    await disconnectDB();
  }
};

seedLoans();
