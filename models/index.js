const fs = require('fs');
const path = require('path');
const { sequelize } = require('../config/db');
const Sequelize = require('sequelize');

const db = {};

// Dynamically load all models
fs.readdirSync(__dirname)
  .filter(file => file !== 'index.js' && file.endsWith('.js'))
  .forEach(file => {
    const model = require(path.join(__dirname, file));
    db[model.name] = model;
  });

// Define all associations here
const {
  User,
  HealthInfo,
  HealthCondition,
  Medicine,
  Prescription,
  PrescriptionMedicine,
  PrescriptionVerification,
  Order,
  OrderItem,
  ShippingAddress,
  SkincareProduct,
} = db;

// Associations

// User and HealthInfo
User.hasOne(HealthInfo, { foreignKey: 'userId', as: 'healthInfo' });
HealthInfo.belongsTo(User, { foreignKey: 'userId' });

// HealthInfo and HealthCondition
HealthInfo.hasMany(HealthCondition, { foreignKey: 'healthInfoId', as: 'conditions' });
HealthCondition.belongsTo(HealthInfo, { foreignKey: 'healthInfoId' });

// User and Prescription
User.hasMany(Prescription, { foreignKey: 'userId', as: 'prescriptions' });
Prescription.belongsTo(User, { foreignKey: 'userId' });

// Prescription and PrescriptionMedicine
Prescription.hasMany(PrescriptionMedicine, { foreignKey: 'prescriptionId', as: 'medicines' });
PrescriptionMedicine.belongsTo(Prescription, { foreignKey: 'prescriptionId' });

// Medicine and PrescriptionMedicine
Medicine.hasMany(PrescriptionMedicine, { foreignKey: 'medicineId' });
PrescriptionMedicine.belongsTo(Medicine, { foreignKey: 'medicineId' });

// User and Order
User.hasMany(Order, { foreignKey: 'userId', as: 'orders' });
Order.belongsTo(User, { foreignKey: 'userId' });

// Order and OrderItem
Order.hasMany(OrderItem, { foreignKey: 'orderId', as: 'items' });
OrderItem.belongsTo(Order, { foreignKey: 'orderId' });

// Medicine and OrderItem
Medicine.hasMany(OrderItem, { foreignKey: 'medicineId' });
OrderItem.belongsTo(Medicine, { foreignKey: 'medicineId' });

// Order and ShippingAddress
Order.hasOne(ShippingAddress, { foreignKey: 'orderId', as: 'shippingAddress' });
ShippingAddress.belongsTo(Order, { foreignKey: 'orderId' });

// Prescription and PrescriptionVerification
Prescription.hasOne(PrescriptionVerification, { foreignKey: 'prescriptionId', as: 'verification' });
PrescriptionVerification.belongsTo(Prescription, { foreignKey: 'prescriptionId' });

// Export all models + sequelize instance
db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
