/**
 * Test helpers for creating test data and managing test state
 */

const { testSequelize } = require('../config/test-db');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

// Store test data references for cleanup
const testData = {
  users: [],
  medicines: [],
  prescriptions: []
};

/**
 * Create a test user with the specified role
 * @param {Object} userData - User data
 * @param {string} role - User role (patient, doctor, pharmacist, admin)
 * @returns {Promise<Object>} Created user
 */
const createTestUser = async (userData, role = 'patient') => {
  const { User } = require('../models');
  
  // Hash password if provided
  let password = userData.password || 'TestPassword123!';
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);
  
  // Base user data with defaults
  const baseUserData = {
    firstName: userData.firstName || `Test${role.charAt(0).toUpperCase() + role.slice(1)}`,
    lastName: userData.lastName || 'User',
    nationalNumber: userData.nationalNumber || `TN${Date.now().toString().slice(-8)}`,
    email: userData.email || `test.${role}.${Date.now()}@example.com`,
    phone: userData.phone || '+1234567890',
    gender: userData.gender || 'other',
    username: userData.username || `test${role}${Date.now()}`,
    password: hashedPassword,
    securityQuestion: userData.securityQuestion || 'What is your favorite color?',
    securityAnswer: userData.securityAnswer || 'blue',
    role: role,
    isVerified: userData.isVerified !== undefined ? userData.isVerified : true,
    verificationToken: userData.verificationToken || null,
    verificationTokenExpire: userData.verificationTokenExpire || null,
    resetPasswordToken: userData.resetPasswordToken || null,
    resetPasswordExpire: userData.resetPasswordExpire || null,
    requiresApproval: userData.requiresApproval !== undefined ? userData.requiresApproval : (role !== 'patient' && role !== 'admin')
  };
  
  // Add role-specific fields
  let roleSpecificData = {};
  
  if (role === 'doctor') {
    roleSpecificData = {
      specialization: userData.specialization || 'General Practice',
      licenseNumber: userData.licenseNumber || `DOC${Date.now().toString().slice(-6)}`,
      yearsOfExperience: userData.yearsOfExperience || 5
    };
  } else if (role === 'pharmacist') {
    roleSpecificData = {
      pharmacyName: userData.pharmacyName || 'Test Pharmacy',
      pharmacyAddress: userData.pharmacyAddress || '123 Test St, Test City, 12345',
      licenseNumber: userData.licenseNumber || `PHARM${Date.now().toString().slice(-6)}`
    };
  } else if (role === 'admin') {
    roleSpecificData = {
      department: userData.department || 'IT'
    };
  }
  
  // Create user with combined data
  const user = await User.create({
    ...baseUserData,
    ...roleSpecificData
  });
  
  // Store for cleanup
  testData.users.push(user);
  
  return user;
};

/**
 * Create a test medicine with valid data
 * @param {Object} medicineData - Medicine data
 * @returns {Promise<Object>} Created medicine
 */
const createTestMedicine = async (medicineData = {}) => {
  const { Medicine } = require('../models');
  
  // Create medicine with defaults for required fields
  const medicine = await Medicine.create({
    name: medicineData.name || `Test Medicine ${Date.now()}`,
    description: medicineData.description || 'A medicine for testing purposes',
    dosageForm: medicineData.dosageForm || 'tablet',
    dosage: medicineData.dosage || '500mg', // Required field
    strength: medicineData.strength || '500mg',
    manufacturer: medicineData.manufacturer || 'Test Pharma Inc.',
    price: medicineData.price || 9.99,
    requiresPrescription: medicineData.requiresPrescription !== undefined ? medicineData.requiresPrescription : true,
    stock: medicineData.stock || 100,
    category: medicineData.category || 'pain_relief', // Must match allowed categories
    activeIngredients: medicineData.activeIngredients || 'test ingredient', // String, not array
    sideEffects: medicineData.sideEffects || 'drowsiness, headache', // String, not array
    contraindications: medicineData.contraindications || 'pregnancy, liver disease', // String, not array
    storageConditions: medicineData.storageConditions || 'Store at room temperature'
  });
  
  // Store for cleanup
  testData.medicines.push(medicine);
  
  return medicine;
};

/**
 * Create a test prescription
 * @param {Object} prescriptionData - Prescription data
 * @returns {Promise<Object>} Created prescription
 */
const createTestPrescription = async (prescriptionData = {}) => {
  const { Prescription } = require('../models');
  
  // Ensure we have required IDs
  if (!prescriptionData.patientId || !prescriptionData.doctorId || !prescriptionData.medicineId) {
    throw new Error('Missing required IDs for prescription creation');
  }
  
  // Create prescription with defaults
  const prescription = await Prescription.create({
    patientId: prescriptionData.patientId,
    doctorId: prescriptionData.doctorId,
    medicineId: prescriptionData.medicineId,
    dosage: prescriptionData.dosage || '1 tablet',
    frequency: prescriptionData.frequency || 'twice daily',
    duration: prescriptionData.duration || '7 days',
    instructions: prescriptionData.instructions || 'Take with food',
    quantity: prescriptionData.quantity || 14,
    status: prescriptionData.status || 'pending',
    prescriptionCode: prescriptionData.prescriptionCode || crypto.randomBytes(8).toString('hex'),
    notes: prescriptionData.notes || '',
    issuedAt: prescriptionData.issuedAt || new Date(),
    expiresAt: prescriptionData.expiresAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
  });
  
  // Store for cleanup
  testData.prescriptions.push(prescription);
  
  return prescription;
};

/**
 * Clean up all test data
 */
const cleanupTestData = async () => {
  try {
    const { User, Medicine, Prescription } = require('../models');
    
    // Clean up in reverse order to avoid foreign key constraints
    for (const prescription of testData.prescriptions) {
      await Prescription.destroy({ where: { id: prescription.id }, force: true });
    }
    
    for (const medicine of testData.medicines) {
      await Medicine.destroy({ where: { id: medicine.id }, force: true });
    }
    
    for (const user of testData.users) {
      await User.destroy({ where: { id: user.id }, force: true });
    }
    
    // Reset test data arrays
    testData.users = [];
    testData.medicines = [];
    testData.prescriptions = [];
    
    console.log('Test data cleaned up successfully');
  } catch (error) {
    console.error('Error cleaning up test data:', error.message);
  }
};

/**
 * Get authentication token for a user
 * @param {Object} user - User object
 * @returns {string} JWT token
 */
const getAuthToken = (user) => {
  const jwt = require('jsonwebtoken');
  return jwt.sign(
    { id: user.id },
    process.env.JWT_SECRET || 'test_secret',
    { expiresIn: process.env.JWT_EXPIRE || '1h' }
  );
};

module.exports = {
  createTestUser,
  createTestMedicine,
  createTestPrescription,
  cleanupTestData,
  getAuthToken,
  testData
};