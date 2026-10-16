const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Customer = require("../models/Customer");
const OTP = require("../models/OTP");
const { sendVerificationOTP } = require("../utils/EmailService");
const {
  OTP_MAX_ATTEMPTS,
  OTP_RESEND_SECONDS,
  generateOTP,
  getExpiryDate,
  hashOTP,
  matchesOTP,
} = require("../utils/OTPManager");

function createCustomerToken(customer) {
  const secret = process.env.JWT_SECRET || (process.env.NODE_ENV !== "production" ? "money-hold-development-secret-change-me" : "");
  if (!secret) throw new Error("JWT_SECRET is not configured.");
  return jwt.sign(
    { sub: String(customer.id), role: "customer", email: customer.email },
    secret,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d", issuer: "money-hold-api" }
  );
}

async function issueVerificationOTP(customer) {
  const otp = generateOTP();
  const otpHash = await hashOTP(otp);
  await OTP.upsert({ customerId: customer.id, otpHash, expiresAt: getExpiryDate() });
  try {
    await sendVerificationOTP({ email: customer.email, firstName: customer.first_name, otp });
  } catch (cause) {
    console.error("Verification email delivery failed:", cause.code || "MAIL_ERROR");
    const error = new Error("Your account is awaiting verification, but we could not send the email. Please request another code.");
    error.status = 503;
    error.verificationRequired = true;
    error.email = customer.email;
    throw error;
  }
}

async function registerCustomer(req, res, next) {
  try {
    const { firstName, lastName, email, phone, password } = req.validatedBody;
    const [existingEmail, existingPhone] = await Promise.all([
      Customer.findByEmail(email),
      Customer.findByPhone(phone),
    ]);

    if (existingEmail) {
      return res.status(409).json({
        success: false,
        verificationRequired: !existingEmail.email_verified,
        message: existingEmail.email_verified
          ? "An account already exists with this email."
          : "This email is registered but not verified. Request a new code to continue.",
      });
    }
    if (existingPhone) {
      return res.status(409).json({ success: false, message: "An account already exists with this phone number." });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const customer = await Customer.create({ firstName, lastName, email, phone, passwordHash });
    await issueVerificationOTP(customer);

    return res.status(201).json({
      success: true,
      verificationRequired: true,
      email: customer.email,
      message: "Account created. Check your email for the verification code.",
    });
  } catch (error) {
    if (error.verificationRequired) return res.status(503).json({ success: false, verificationRequired: true, email: error.email, message: error.message });
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ success: false, message: "An account with these details already exists." });
    }
    next(error);
  }
}

async function verifyCustomerEmail(req, res, next) {
  try {
    const { email, otp } = req.validatedBody;
    const customer = await Customer.findByEmail(email);
    if (!customer) return res.status(400).json({ success: false, message: "Invalid verification request." });
    if (customer.email_verified) return res.status(409).json({ success: false, message: "This email is already verified. Please sign in." });

    const record = await OTP.findForCustomer(customer.id);
    if (!record || new Date(record.expires_at).getTime() <= Date.now()) {
      return res.status(410).json({ success: false, code: "OTP_EXPIRED", message: "This code has expired. Request a new one." });
    }
    if (record.attempt_count >= OTP_MAX_ATTEMPTS) {
      return res.status(429).json({ success: false, code: "OTP_ATTEMPTS_EXCEEDED", message: "Too many incorrect attempts. Request a new code." });
    }
    if (!(await matchesOTP(otp, record.otp_hash))) {
      await OTP.incrementAttempts(record.id);
      const remaining = Math.max(OTP_MAX_ATTEMPTS - record.attempt_count - 1, 0);
      return res.status(400).json({ success: false, message: `Incorrect code. ${remaining} attempt${remaining === 1 ? "" : "s"} remaining.` });
    }

    const verifiedCustomer = await Customer.verifyEmail(customer.id);
    await OTP.removeForCustomer(customer.id);
    const token = createCustomerToken(verifiedCustomer);

    return res.json({
      success: true,
      message: "Email verified. Welcome to Money Hold.",
      token,
      customer: {
        id: verifiedCustomer.id,
        firstName: verifiedCustomer.first_name,
        lastName: verifiedCustomer.last_name,
        email: verifiedCustomer.email,
        phone: verifiedCustomer.phone,
        role: verifiedCustomer.role,
      },
    });
  } catch (error) {
    next(error);
  }
}

async function resendCustomerOTP(req, res, next) {
  try {
    const { email } = req.validatedBody;
    const customer = await Customer.findByEmail(email);
    if (!customer) return res.status(400).json({ success: false, message: "Invalid verification request." });
    if (customer.email_verified) return res.status(409).json({ success: false, message: "This email is already verified. Please sign in." });

    const record = await OTP.findForCustomer(customer.id);
    if (record) {
      const elapsedSeconds = Math.floor((Date.now() - new Date(record.last_sent_at).getTime()) / 1000);
      if (elapsedSeconds < OTP_RESEND_SECONDS) {
        return res.status(429).json({
          success: false,
          retryAfter: OTP_RESEND_SECONDS - elapsedSeconds,
          message: `Please wait ${OTP_RESEND_SECONDS - elapsedSeconds} seconds before requesting another code.`,
        });
      }
    }

    await issueVerificationOTP(customer);
    return res.json({ success: true, message: "A new verification code has been sent." });
  } catch (error) {
    next(error);
  }
}

module.exports = { registerCustomer, verifyCustomerEmail, resendCustomerOTP };
