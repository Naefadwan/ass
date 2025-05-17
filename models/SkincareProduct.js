const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const SkincareProduct = sequelize.define(
  "SkincareProduct",
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
    brand: {
      type: DataTypes.STRING(50),
      allowNull: true,  // Allow NULL temporarily
      defaultValue: 'Unknown Brand'  // Provide a default value
    },
    category: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        isIn: [
          [
            "Cleanser",
            "Toner",
            "Moisturizer",
            "Serum",
            "Mask",
            "Sunscreen",
            "Eye Cream",
            "Exfoliator",
            "Treatment",
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
    ingredients: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    skinType: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: "skin_type",
      validate: {
        isIn: [["All", "Normal", "Dry", "Oily", "Combination", "Sensitive"]],
      },
    },
    volume: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    usageInstructions: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "usage_instructions",
    },
    benefits: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    image: {
      type: DataTypes.STRING(255),
      allowNull: true,
      defaultValue: "default-skincare.jpg",
    },
    stock: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 0,
      },
    },
    featured: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
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
    tableName: "skincare_products",
    timestamps: true,
  }
);

module.exports = SkincareProduct;
