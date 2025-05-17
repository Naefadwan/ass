const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const PrescriptionVerification = sequelize.define(
  "PrescriptionVerification",
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
    prescriptionId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: "prescription_id",
    },
    fileName: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: "file_name",
    },
    originalName: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: "original_name",
    },
    mimeType: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: "mime_type",
    },
    size: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    uploadDate: {
      type: DataTypes.DATE,
      allowNull: false,
      field: "upload_date",
    },
    verificationStatus: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: "pending",
      field: "verification_status",
      validate: {
        isIn: [["pending", "verified", "failed", "pending_review", "rejected"]],
      },
    },
    verificationDetails: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {},
      field: "verification_details",
    },
    controlledSubstances: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: [],
      field: "controlled_substances",
    },
    tamperedStatus: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: "unknown",
      field: "tampered_status",
      validate: {
        isIn: [["unknown", "detected", "not_detected"]],
      },
    },
    aiGeneratedStatus: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: "unknown",
      field: "ai_generated_status",
      validate: {
        isIn: [["unknown", "detected", "not_detected"]],
      },
    },
    complianceStatus: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: "pending",
      field: "compliance_status",
      validate: {
        isIn: [["pending", "compliant", "non_compliant"]],
      },
    },
    verificationMethod: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: "automated",
      field: "verification_method",
      validate: {
        isIn: [["automated", "manual", "hybrid"]],
      },
    },
    needsManualReview: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: "needs_manual_review",
    },
    reviewNotes: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "review_notes",
    },
    reviewedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      field: "reviewed_by",
    },
    reviewedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "reviewed_at",
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
    tableName: "prescription_verifications",
    timestamps: true,
  }
);

module.exports = PrescriptionVerification;
