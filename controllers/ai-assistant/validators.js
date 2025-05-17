const { body } = require('express-validator');

const getAIResponseValidator = [
  body('message')
    .exists().withMessage('Message is required')
    .isString().withMessage('Message must be a string')
    .isLength({ min: 1, max: 2000 }).withMessage('Message must be 1-2000 characters'),
];

const getMedicationInfoValidator = [
  body('medication')
    .exists().withMessage('Medication is required')
    .isString().withMessage('Medication must be a string')
    .isLength({ min: 1, max: 255 }).withMessage('Medication must be 1-255 characters'),
];

const getHealthConditionInfoValidator = [
  body('condition')
    .exists().withMessage('Condition is required')
    .isString().withMessage('Condition must be a string')
    .isLength({ min: 1, max: 255 }).withMessage('Condition must be 1-255 characters'),
];

const getInteractionsValidator = [
  body('medications').isArray({ min: 2 }).withMessage('Provide at least two medications as an array'),
];

const getDosageRecommendationValidator = [
  body('medicineId').exists().withMessage('medicineId is required'),
  body('patientAge').isInt({ min: 0 }).withMessage('Valid patientAge is required'),
  body('patientWeight').isFloat({ min: 0 }).withMessage('Valid patientWeight is required'),
  body('condition').isString().notEmpty().withMessage('Condition is required'),
];

const analyzeSymptomsValidator = [
  body('symptoms').isArray({ min: 1 }).withMessage('Symptoms must be a non-empty array'),
  body('duration').isString().notEmpty().withMessage('Duration is required'),
];

module.exports = {
  getAIResponseValidator,
  getMedicationInfoValidator,
  getHealthConditionInfoValidator,
  getInteractionsValidator,
  getDosageRecommendationValidator,
  analyzeSymptomsValidator,
};
