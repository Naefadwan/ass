const { DataTypes } = require("sequelize");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { sequelize } = require("../config/db");

const User = sequelize.define(
  "User",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: false,
      field: "first_name",
      validate: {
        notEmpty: { msg: "First name is required" },
        len: { args: [2, 50], msg: "First name must be between 2 and 50 characters" },
      },
    },
    middleName: {
      type: DataTypes.STRING,
      allowNull: true,
      field: "middle_name",
      validate: {
        len: { args: [0, 50], msg: "Middle name must be less than 50 characters" },
      },
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: false,
      field: "last_name",
      validate: {
        notEmpty: { msg: "Last name is required" },
        len: { args: [2, 50], msg: "Last name must be between 2 and 50 characters" },
      },
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: { msg: "Username is required" },
        len: { args: [3, 30], msg: "Username must be between 3 and 30 characters" },
      },
    },
    nationalNumber: {
      type: DataTypes.STRING,
      allowNull: false,
      field: "national_number",
      validate: {
        notEmpty: { msg: "National number is required" },
      },
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: { msg: "Phone number is required" },
      },
    },
    gender: {
      type: DataTypes.ENUM("male", "female", "other", "prefer-not-to-say"),
      allowNull: false,
      validate: {
        notEmpty: { msg: "Gender is required" },
      },
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: { msg: "Please add a valid email" },
        notNull: { msg: "Email is required" },
      },
    },
    role: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "patient",
      validate: {
        isIn: {
          args: [['patient', 'doctor', 'pharmacist', 'admin']],
          msg: "Role must be one of: patient, doctor, pharmacist, admin"
        }
      }
    },
    twoFactorEnabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    twoFactorSecret: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: { args: [6, 100], msg: "Password must be at least 6 characters" },
        notNull: { msg: "Password is required" },
      },
    },
    securityQuestion: {
      type: DataTypes.STRING,
      allowNull: false,
      field: "security_question",
      validate: {
        notEmpty: { msg: "Security question is required" },
      },
    },
    securityAnswer: {
      type: DataTypes.STRING,
      allowNull: false,
      field: "security_answer",
      validate: {
        notEmpty: { msg: "Security answer is required" },
      },
    },
    status: {
      type: DataTypes.ENUM("active", "inactive", "suspended"),
      allowNull: false,
      defaultValue: "active",
    },
    lastLogin: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "last_login",
    },
    loginAttempts: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: "login_attempts",
    },
    lockUntil: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "lock_until",
    },
    resetPasswordToken: {
      type: DataTypes.STRING,
      allowNull: true,
      field: "reset_password_token",
    },
    resetPasswordExpire: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "reset_password_expire",
    },
    emailVerificationToken: {
      type: DataTypes.STRING,
      allowNull: true,
      field: "email_verification_token",
    },
    emailVerified: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: "email_verified",
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
    tableName: "users",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    hooks: {
      beforeCreate: async (user) => {
        if (user.password) {
          const salt = await bcrypt.genSalt(12);
          user.password = await bcrypt.hash(user.password, salt);
        }
      },
      beforeUpdate: async (user) => {
        if (user.changed("password")) {
          const salt = await bcrypt.genSalt(12);
          user.password = await bcrypt.hash(user.password, salt);
        }
      },
    },
    defaultScope: {
      attributes: {
        exclude: [
          "password",
          "resetPasswordToken",
          "resetPasswordExpire",
          "twoFactorSecret",
        ],
      },
    },
    scopes: {
      withPassword: {
        attributes: { include: ["password"] },
      },
    },
  }
);

// Instance methods
User.prototype.getSignedJwtToken = function () {
  return jwt.sign(
    { id: this.id, role: this.role, email: this.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE }
  );
};

User.prototype.matchPassword = function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

User.prototype.getResetPasswordToken = function () {
  const resetToken = crypto.randomBytes(32).toString("hex");
  this.resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
  return resetToken;
};

User.prototype.getEmailVerificationToken = function () {
  const verificationToken = crypto.randomBytes(32).toString("hex");
  this.emailVerificationToken = crypto
    .createHash("sha256")
    .update(verificationToken)
    .digest("hex");
  return verificationToken;
};

User.prototype.incrementLoginAttempts = async function () {
  this.loginAttempts += 1;
  if (this.loginAttempts >= 5) {
    this.lockUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
    this.status = "suspended";
  }
  await this.save();
};

User.prototype.resetLoginAttempts = async function () {
  this.loginAttempts = 0;
  this.lockUntil = null;
  await this.save();
};

User.prototype.isLocked = function () {
  return this.lockUntil && this.lockUntil > Date.now();
};

module.exports = User;