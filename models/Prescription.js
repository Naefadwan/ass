const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const Prescription = sequelize.define(
  "Prescription",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "user_id",
    },
    doctorName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: "doctor_name",
    },
    doctorLicense: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: "doctor_license",
    },
    doctorHospital: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: "doctor_hospital",
    },
    doctorContact: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: "doctor_contact",
    },
    diagnosis: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    issueDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      field: "issue_date",
    },
    expiryDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      field: "expiry_date",
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: "active",
      validate: {
        isIn: [["active", "filled", "expired", "cancelled"]],
      },
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    image: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: "created_at",
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: "updated_at",
    },
  },
  {
    tableName: "prescriptions",
    timestamps: true,
  }
);

module.exports = Prescription;
