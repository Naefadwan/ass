const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const HealthCondition = sequelize.define(
  "HealthCondition",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    healthInfoId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "health_info_id",
    },
    conditionType: {
      type: DataTypes.STRING(10),
      allowNull: false,
      field: "condition_type",
      validate: {
        isIn: [["disease", "allergy"]],
      },
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
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
    tableName: "health_conditions",
    timestamps: true,
  }
);

module.exports = HealthCondition;
