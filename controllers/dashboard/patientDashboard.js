const { Order, Prescription } = require('../../models');
const returnResponse = require("../../utils/response");

// @desc    Get patient dashboard data
// @route   GET /api/dashboard/patient
// @access  Private (patient)
module.exports = async (req, res) => {
  const orders = await Order.count({ where: { userId: req.user.id } });
  const prescriptions = await Prescription.count({ where: { userId: req.user.id } });
  returnResponse(res, 200, true, { orders, prescriptions });
};
