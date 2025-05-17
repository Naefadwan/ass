const { Prescription } = require('../../models');
const returnResponse = require("../../utils/response");

// @desc    Get doctor dashboard data
// @route   GET /api/dashboard/doctor
// @access  Private (doctor)
module.exports = async (req, res) => {
  const prescriptions = await Prescription.count({ where: { doctorId: req.user.id } });
  returnResponse(res, 200, true, { prescriptions });
};
