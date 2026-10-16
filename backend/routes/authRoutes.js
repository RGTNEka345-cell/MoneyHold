
const express = require("express");
const { rateLimit } = require("express-rate-limit");
const { registerCustomer, verifyCustomerEmail, resendCustomerOTP } = require("../controllers/AuthController");
const { validateCustomerRegistration, validateEmailRequest, validateOTPVerification } = require("../middlewares/validator");

const router = express.Router();

const registrationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { success: false, message: "Too many registration attempts. Please try again later." },
});

const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { success: false, message: "Too many verification requests. Please try again later." },
});

router.post("/customer/register", registrationLimiter, validateCustomerRegistration, registerCustomer);
router.post("/customer/verify-email", otpLimiter, validateOTPVerification, verifyCustomerEmail);
router.post("/customer/resend-otp", otpLimiter, validateEmailRequest, resendCustomerOTP);

module.exports = router;
