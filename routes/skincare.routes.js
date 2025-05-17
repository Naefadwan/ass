const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/authMiddleware");
const { validationResult } = require("express-validator");
const returnResponse = require("../utils/response");

const {
  skincareIdParamValidator,
  skincareProductBodyValidator,
  skincareQueryValidator
} = require("../controllers/skincare/validators");

const getSkincareProducts = require("../controllers/skincare/getSkincareProducts");
const getSkincareProduct = require("../controllers/skincare/getSkincareProduct");
const createSkincareProduct = require("../controllers/skincare/createSkincareProduct");
const updateSkincareProduct = require("../controllers/skincare/updateSkincareProduct");
const deleteSkincareProduct = require("../controllers/skincare/deleteSkincareProduct");
const getSkincareCategories = require("../controllers/skincare/getSkincareCategories");
const getSkincareBrands = require("../controllers/skincare/getSkincareBrands");
const getSkincareSkinTypes = require("../controllers/skincare/getSkincareSkinTypes");

function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return returnResponse(res, 400, false, null, "Validation error", errors.array());
  }
  next();
}

// Public routes
router.get("/", skincareQueryValidator, handleValidationErrors, getSkincareProducts);
router.get("/categories", getSkincareCategories);
router.get("/brands", getSkincareBrands);
router.get("/skin-types", getSkincareSkinTypes);
router.get(
  "/:id",
  skincareIdParamValidator,
  handleValidationErrors,
  getSkincareProduct
);

// Admin-protected routes
router.post(
  "/",
  protect,
  authorize("admin"),
  skincareProductBodyValidator,
  handleValidationErrors,
  createSkincareProduct
);
router.put(
  "/:id",
  protect,
  authorize("admin"),
  skincareIdParamValidator,
  skincareProductBodyValidator,
  handleValidationErrors,
  updateSkincareProduct
);
router.delete(
  "/:id",
  protect,
  authorize("admin"),
  skincareIdParamValidator,
  handleValidationErrors,
  deleteSkincareProduct
);

module.exports = router;
