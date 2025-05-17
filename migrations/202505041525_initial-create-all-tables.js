"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Ensure uuid-ossp extension for UUID generation
    await queryInterface.sequelize.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');

    // USERS table
    await queryInterface.createTable("users", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal("uuid_generate_v4()"),
        primaryKey: true,
        allowNull: false,
      },
      name: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      role: {
        type: Sequelize.ENUM("user", "admin", "pharmacist"),
        allowNull: false,
        defaultValue: "user",
      },
      password: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM("active", "inactive", "suspended"),
        allowNull: false,
        defaultValue: "active",
      },
      last_login: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      login_attempts: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      lock_until: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      reset_password_token: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      reset_password_expire: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      email_verification_token: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      email_verified: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      two_factor_enabled: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      two_factor_secret: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });

    // HEALTH INFO table
    await queryInterface.createTable("health_infos", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal("uuid_generate_v4()"),
        primaryKey: true,
        allowNull: false,
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "users", key: "id" },
        onDelete: "CASCADE",
      },
      height: { type: Sequelize.FLOAT, allowNull: true },
      weight: { type: Sequelize.FLOAT, allowNull: true },
      blood_type: { type: Sequelize.STRING(3), allowNull: true },
      allergies: { type: Sequelize.TEXT, allowNull: true },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });

    // HEALTH CONDITION table
    await queryInterface.createTable("health_conditions", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal("uuid_generate_v4()"),
        primaryKey: true,
        allowNull: false,
      },
      health_info_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "health_infos", key: "id" },
        onDelete: "CASCADE",
      },
      name: { type: Sequelize.STRING(100), allowNull: false },
      description: { type: Sequelize.TEXT, allowNull: true },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });

    // MEDICINE table
    await queryInterface.createTable("medicines", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal("uuid_generate_v4()"),
        primaryKey: true,
        allowNull: false,
      },
      name: { type: Sequelize.STRING(100), allowNull: false },
      category: { type: Sequelize.STRING(50), allowNull: false },
      price: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
      description: { type: Sequelize.TEXT, allowNull: false },
      dosage: { type: Sequelize.STRING(100), allowNull: false },
      side_effects: { type: Sequelize.TEXT, allowNull: true },
      requires_prescription: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      stock: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      image: { type: Sequelize.STRING(255), allowNull: true, defaultValue: "default-medicine.jpg" },
      manufacturer: { type: Sequelize.STRING(100), allowNull: true },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });

    // PRESCRIPTION table
    await queryInterface.createTable("prescriptions", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal("uuid_generate_v4()"),
        primaryKey: true,
        allowNull: false,
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "users", key: "id" },
        onDelete: "CASCADE",
      },
      doctor_name: { type: Sequelize.STRING(100), allowNull: false },
      doctor_license: { type: Sequelize.STRING(50), allowNull: false },
      doctor_hospital: { type: Sequelize.STRING(100), allowNull: true },
      doctor_contact: { type: Sequelize.STRING(50), allowNull: true },
      diagnosis: { type: Sequelize.TEXT, allowNull: true },
      issue_date: { type: Sequelize.DATEONLY, allowNull: false },
      expiry_date: { type: Sequelize.DATEONLY, allowNull: false },
      status: { type: Sequelize.STRING(20), allowNull: false, defaultValue: "active" },
      notes: { type: Sequelize.TEXT, allowNull: true },
      image: { type: Sequelize.STRING(255), allowNull: true },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });

    // ORDERS table
    await queryInterface.createTable("orders", {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.literal("uuid_generate_v4()"), primaryKey: true, allowNull: false },
      user_id: { type: Sequelize.UUID, allowNull: false, references: { model: "users", key: "id" }, onDelete: "CASCADE" },
      subtotal: { type: Sequelize.DECIMAL(10,2), allowNull: false },
      tax_price: { type: Sequelize.DECIMAL(10,2), allowNull: false, defaultValue: 0 },
      shipping_price: { type: Sequelize.DECIMAL(10,2), allowNull: false, defaultValue: 0 },
      total_price: { type: Sequelize.DECIMAL(10,2), allowNull: false },
      payment_method: { type: Sequelize.STRING(20), allowNull: false },
      payment_result_id: { type: Sequelize.STRING(100), allowNull: true },
      payment_result_status: { type: Sequelize.STRING(50), allowNull: true },
      payment_result_update_time: { type: Sequelize.STRING(50), allowNull: true },
      payment_result_email: { type: Sequelize.STRING(100), allowNull: true },
      is_paid: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      paid_at: { type: Sequelize.DATE, allowNull: true },
      status: { type: Sequelize.STRING(20), allowNull: false, defaultValue: "pending" },
      delivered_at: { type: Sequelize.DATE, allowNull: true },
      notes: { type: Sequelize.TEXT, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
    });

    // ORDER ITEMS table
    await queryInterface.createTable("order_items", {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.literal("uuid_generate_v4()"), primaryKey: true, allowNull: false },
      order_id: { type: Sequelize.UUID, allowNull: false, references: { model: "orders", key: "id" }, onDelete: "CASCADE" },
      medicine_id: { type: Sequelize.UUID, allowNull: false, references: { model: "medicines", key: "id" }, onDelete: "CASCADE" },
      name: { type: Sequelize.STRING(100), allowNull: false },
      quantity: { type: Sequelize.INTEGER, allowNull: false },
      price: { type: Sequelize.DECIMAL(10,2), allowNull: false },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
    });

    // SHIPPING ADDRESS table
    await queryInterface.createTable("shipping_addresses", {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.literal("uuid_generate_v4()"), primaryKey: true, allowNull: false },
      order_id: { type: Sequelize.UUID, allowNull: false, references: { model: "orders", key: "id" }, onDelete: "CASCADE" },
      street: { type: Sequelize.STRING(100), allowNull: false },
      city: { type: Sequelize.STRING(50), allowNull: false },
      state: { type: Sequelize.STRING(50), allowNull: false },
      postal_code: { type: Sequelize.STRING(20), allowNull: false },
      country: { type: Sequelize.STRING(50), allowNull: false },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
    });

    // PRESCRIPTION MEDICINE table
    await queryInterface.createTable("prescription_medicines", {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.literal("uuid_generate_v4()"), primaryKey: true, allowNull: false },
      prescription_id: { type: Sequelize.UUID, allowNull: false, references: { model: "prescriptions", key: "id" }, onDelete: "CASCADE" },
      medicine_id: { type: Sequelize.UUID, allowNull: true, references: { model: "medicines", key: "id" }, onDelete: "SET NULL" },
      medicine_name: { type: Sequelize.STRING(100), allowNull: false },
      dosage: { type: Sequelize.STRING(100), allowNull: false },
      frequency: { type: Sequelize.STRING(100), allowNull: false },
      duration: { type: Sequelize.STRING(100), allowNull: false },
      instructions: { type: Sequelize.TEXT, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
    });

    // PRESCRIPTION VERIFICATION table
    await queryInterface.createTable("prescription_verifications", {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.literal("uuid_generate_v4()"), primaryKey: true, allowNull: false },
      user_id: { type: Sequelize.UUID, allowNull: false, references: { model: "users", key: "id" }, onDelete: "CASCADE" },
      prescription_id: { type: Sequelize.UUID, allowNull: true, references: { model: "prescriptions", key: "id" }, onDelete: "SET NULL" },
      file_name: { type: Sequelize.STRING(255), allowNull: false },
      original_name: { type: Sequelize.STRING(255), allowNull: false },
      mime_type: { type: Sequelize.STRING(100), allowNull: false },
      size: { type: Sequelize.INTEGER, allowNull: false },
      upload_date: { type: Sequelize.DATE, allowNull: false },
      verification_status: { type: Sequelize.STRING(20), allowNull: false, defaultValue: "pending" },
      verification_details: { type: Sequelize.JSONB, allowNull: false, defaultValue: {} },
      controlled_substances: { type: Sequelize.JSONB, allowNull: false, defaultValue: [] },
      tampered_status: { type: Sequelize.STRING(20), allowNull: false, defaultValue: "unknown" },
      ai_generated_status: { type: Sequelize.STRING(20), allowNull: false, defaultValue: "unknown" },
      compliance_status: { type: Sequelize.STRING(20), allowNull: false, defaultValue: "pending" },
      verification_method: { type: Sequelize.STRING(20), allowNull: false, defaultValue: "automated" },
      needs_manual_review: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      review_notes: { type: Sequelize.TEXT, allowNull: true },
      reviewed_by: { type: Sequelize.UUID, allowNull: true, references: { model: "users", key: "id" }, onDelete: "SET NULL" },
      reviewed_at: { type: Sequelize.DATE, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
    });

    // SKINCARE PRODUCTS table
    await queryInterface.createTable("skincare_products", {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.literal("uuid_generate_v4()"), primaryKey: true, allowNull: false },
      name: { type: Sequelize.STRING(100), allowNull: false },
      brand: { type: Sequelize.STRING(50), allowNull: true, defaultValue: 'Unknown Brand' },
      category: { type: Sequelize.STRING(50), allowNull: false },
      price: { type: Sequelize.DECIMAL(10,2), allowNull: false },
      description: { type: Sequelize.TEXT, allowNull: false },
      ingredients: { type: Sequelize.TEXT, allowNull: false },
      skin_type: { type: Sequelize.STRING(50), allowNull: false },
      volume: { type: Sequelize.STRING(50), allowNull: true },
      usage_instructions: { type: Sequelize.TEXT, allowNull: true },
      benefits: { type: Sequelize.TEXT, allowNull: true },
      image: { type: Sequelize.STRING(255), allowNull: true, defaultValue: "default-skincare.jpg" },
      stock: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      featured: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
    });

    // REVIEWS table
    await queryInterface.createTable("reviews", {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.literal("uuid_generate_v4()"), primaryKey: true, allowNull: false },
      user_id: { type: Sequelize.UUID, allowNull: false, references: { model: "users", key: "id" }, onDelete: "CASCADE" },
      product_id: { type: Sequelize.UUID, allowNull: false },
      rating: { type: Sequelize.INTEGER, allowNull: false },
      title: { type: Sequelize.STRING(100), allowNull: true },
      comment: { type: Sequelize.TEXT, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
    });

    // AUDIT LOGS table
    await queryInterface.createTable("audit_logs", {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.literal("uuid_generate_v4()"), primaryKey: true, allowNull: false },
      user_id: { type: Sequelize.UUID, allowNull: true, references: { model: "users", key: "id" }, onDelete: "SET NULL" },
      action: { type: Sequelize.STRING(100), allowNull: false },
      resource_type: { type: Sequelize.STRING(50), allowNull: false },
      resource_id: { type: Sequelize.STRING, allowNull: true },
      details: { type: Sequelize.TEXT, allowNull: true },
      ip_address: { type: Sequelize.STRING(50), allowNull: true },
      user_agent: { type: Sequelize.STRING(255), allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
    });

    // Add indexes for performance on commonly queried fields
    await queryInterface.addIndex('users', ['email'], { unique: true });
    await queryInterface.addIndex('orders', ['user_id']);
    await queryInterface.addIndex('order_items', ['order_id']);
    await queryInterface.addIndex('order_items', ['medicine_id']);
    await queryInterface.addIndex('reviews', ['user_id']);
    await queryInterface.addIndex('reviews', ['product_id']);
    await queryInterface.addIndex('audit_logs', ['user_id']);
  },

  down: async (queryInterface, Sequelize) => {
    // Drop tables in reverse order of creation
    await queryInterface.dropTable("audit_logs");
    await queryInterface.dropTable("reviews");
    await queryInterface.dropTable("skincare_products");
    await queryInterface.dropTable("prescription_verifications");
    await queryInterface.dropTable("prescription_medicines");
    await queryInterface.dropTable("shipping_addresses");
    await queryInterface.dropTable("order_items");
    await queryInterface.dropTable("orders");
    await queryInterface.dropTable("prescriptions");
    await queryInterface.dropTable("medicines");
    await queryInterface.dropTable("health_conditions");
    await queryInterface.dropTable("health_infos");
    await queryInterface.dropTable("users");
  }
};
