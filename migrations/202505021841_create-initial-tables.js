'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // USERS TABLE
    await queryInterface.createTable('users', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      role: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'user',
      },
      twoFactorEnabled: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        field: 'two_factor_enabled',
      },
      twoFactorSecret: {
        type: Sequelize.STRING,
        allowNull: true,
        field: 'two_factor_secret',
      },
      password: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM('active', 'inactive', 'suspended'),
        allowNull: false,
        defaultValue: 'active',
      },
      lastLogin: {
        type: Sequelize.DATE,
        allowNull: true,
        field: 'last_login',
      },
      loginAttempts: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        field: 'login_attempts',
      },
      lockUntil: {
        type: Sequelize.DATE,
        allowNull: true,
        field: 'lock_until',
      },
      resetPasswordToken: {
        type: Sequelize.STRING,
        allowNull: true,
        field: 'reset_password_token',
      },
      resetPasswordExpire: {
        type: Sequelize.DATE,
        allowNull: true,
        field: 'reset_password_expire',
      },
      emailVerificationToken: {
        type: Sequelize.STRING,
        allowNull: true,
        field: 'email_verification_token',
      },
      emailVerified: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        field: 'email_verified',
      },
      createdAt: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
        field: 'created_at',
      },
      updatedAt: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
        field: 'updated_at',
      },
    });

    await queryInterface.createTable('auditlogs', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      userId: {
        type: Sequelize.UUID,
        references: { model: 'users', key: 'id' },
        allowNull: true,
        onDelete: 'SET NULL',
        field: 'user_id',
      },
      action: { type: Sequelize.STRING, allowNull: false },
      resourceType: { type: Sequelize.STRING, allowNull: false, field: 'resource_type' },
      resourceId: { type: Sequelize.UUID, allowNull: true, field: 'resource_id' },
      details: { type: Sequelize.TEXT, allowNull: true },
      ipAddress: { type: Sequelize.STRING, allowNull: true, field: 'ip_address' },
      userAgent: { type: Sequelize.STRING, allowNull: true, field: 'user_agent' },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW, field: 'created_at' },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW, field: 'updated_at' },
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('auditlogs');
    await queryInterface.dropTable('users');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_users_role";');
  }
};
