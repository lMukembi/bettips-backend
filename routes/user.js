const express = require("express");

const { login, register, getUser } = require("../controllers/user");

const router = express.Router();
const { protect } = require("../middleware/auth");

router.route("/login").post(login);
router.route("/register").post(register);
router.route("/:id").post(protect, getUser);

module.exports = router;
