const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const { adminMiddleware } = require("../middleware/adminMiddleware");
const { validationResult } = require("express-validator");
const returnResponse = require("../utils/response");

const {
  createUserValidator,
  updateUserValidator,
  idParamValidator
} = require("../controllers/user/validators");

const getUsers = require("../controllers/user/getUsers");
const getUser = require("../controllers/user/getUser");
const createUser = require("../controllers/user/createUser");
const updateUser = require("../controllers/user/updateUser");
const deleteUser = require("../controllers/user/deleteUser");

const router = express.Router();

function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return returnResponse(res, 400, false, null, "Validation error", errors.array());
  }
  next();
}

router.get("/", protect, adminMiddleware, getUsers);
router.post("/", protect, adminMiddleware, createUserValidator, handleValidationErrors, createUser);
router.get("/:id", protect, adminMiddleware, idParamValidator, handleValidationErrors, getUser);
router.put("/:id", protect, adminMiddleware, updateUserValidator, handleValidationErrors, updateUser);
router.delete("/:id", protect, adminMiddleware, idParamValidator, handleValidationErrors, deleteUser);

module.exports = router;
