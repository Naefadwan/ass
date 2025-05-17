const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const Medicine = sequelize.define(
  "Medicine",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    category: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        isIn: [
          [
            "Pain Relief",
            "Antibiotics",
            "Allergy Relief",
            "Anti-inflammatory",
            "Digestive Health",
            "Vitamins & Supplements",
            "Skincare",
            "First Aid",
            "Cold & Flu",
            "Other",
          ],
        ],
      },
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0,
      },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    dosage: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    sideEffects: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "side_effects",
    },
    requiresPrescription: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: "requires_prescription",
    },
    stock: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 0,
      },
    },
    image: {
      type: DataTypes.STRING(255),
      allowNull: true,
      defaultValue: "default-medicine.jpg",
    },
    manufacturer: {
      type: DataTypes.STRING(100),
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
    tableName: "medicines",
    timestamps: true,
  }
);

module.exports = Medicine;
