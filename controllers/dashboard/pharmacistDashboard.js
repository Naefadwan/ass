const { Prescription } = require('../../models');
const returnResponse = require("../../utils/response");

// @desc    Get pharmacist dashboard data
// @route   GET /api/dashboard/pharmacist
// @access  Private (pharmacist)
module.exports = async (req, res) => {
  const prescriptionsToFill = await Prescription.count({ where: { status: 'pending' } });
  returnResponse(res, 200, true, { prescriptionsToFill });
};
