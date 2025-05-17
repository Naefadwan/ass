const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const PrescriptionMedicine = sequelize.define(
  "PrescriptionMedicine",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    prescriptionId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "prescription_id",
    },
    medicineId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: "medicine_id",
    },
    medicineName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: "medicine_name",
    },
    dosage: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    frequency: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    duration: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    instructions: {
      type: DataTypes.TEXT,
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
    tableName: "prescription_medicines",
    timestamps: true,
  }
);

module.exports = PrescriptionMedicine;
