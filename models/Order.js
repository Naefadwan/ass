const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const Order = sequelize.define(
  "Order",
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
    subtotal: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: { min: 0 },
    },
    taxPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
      field: "tax_price",
      validate: { min: 0 },
    },
    shippingPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
      field: "shipping_price",
      validate: { min: 0 },
    },
    totalPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      field: "total_price",
      validate: { min: 0 },
    },
    paymentMethod: {
      type: DataTypes.STRING(20),
      allowNull: false,
      field: "payment_method",
      validate: {
        isIn: [["credit_card", "debit_card", "paypal", "cash_on_delivery"]],
      },
    },
    paymentResultId: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: "payment_result_id",
    },
    paymentResultStatus: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: "payment_result_status",
    },
    paymentResultUpdateTime: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: "payment_result_update_time",
    },
    paymentResultEmail: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: "payment_result_email",
    },
    isPaid: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: "is_paid",
    },
    paidAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "paid_at",
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: "pending",
      validate: {
        isIn: [["pending", "processing", "shipped", "delivered", "cancelled"]],
      },
    },
    deliveredAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "delivered_at",
    },
    notes: {
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
    tableName: "orders",
    timestamps: true,
  }
);

module.exports = Order;
