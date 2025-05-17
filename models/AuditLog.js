const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const AuditLog = sequelize.define(
  "AuditLog",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: true, // Allow null for system actions
      field: "user_id",
    },
    action: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    resourceType: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: "resource_type",
    },
    resourceId: {
      type: DataTypes.STRING,
      allowNull: true,
      field: "resource_id",
    },
    details: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    ipAddress: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: "ip_address",
    },
    userAgent: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: "user_agent",
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: "created_at",
    },
  },
  {
    tableName: "audit_logs",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false, // No updatedAt field
  }
);

module.exports = AuditLog;
