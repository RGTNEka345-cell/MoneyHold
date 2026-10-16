
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^\+?[0-9][0-9\s-]{7,18}$/;

const cleanText = (value) => (typeof value === "string" ? value.trim() : "");

function validateCustomerRegistration(req, res, next) {
  const firstName = cleanText(req.body.firstName);
  const lastName = cleanText(req.body.lastName);
  const email = cleanText(req.body.email).toLowerCase();
  const rawPhone = cleanText(req.body.phone);
  const phone = rawPhone.replace(/[\s-]/g, "");
  const password = typeof req.body.password === "string" ? req.body.password : "";
  const confirmPassword = typeof req.body.confirmPassword === "string" ? req.body.confirmPassword : "";
  const errors = {};

  if (firstName.length < 2 || firstName.length > 60) errors.firstName = "First name must be between 2 and 60 characters.";
  if (lastName.length < 2 || lastName.length > 60) errors.lastName = "Last name must be between 2 and 60 characters.";
  if (!EMAIL_PATTERN.test(email) || email.length > 191) errors.email = "Please enter a valid email address.";
  if (!PHONE_PATTERN.test(rawPhone)) errors.phone = "Please enter a valid phone number.";
  if (password.length < 8 || password.length > 72) errors.password = "Password must be between 8 and 72 characters.";
  if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) errors.password = "Password must include at least one letter and one number.";
  if (password !== confirmPassword) errors.confirmPassword = "Passwords do not match.";

  if (Object.keys(errors).length) {
    return res.status(422).json({ success: false, message: "Please correct the submitted details.", errors });
  }

  req.validatedBody = { firstName, lastName, email, phone, password };
  next();
}

function validateEmailRequest(req, res, next) {
  const email = cleanText(req.body.email).toLowerCase();
  if (!EMAIL_PATTERN.test(email) || email.length > 191) {
    return res.status(422).json({ success: false, message: "Please enter a valid email address." });
  }
  req.validatedBody = { email };
  next();
}

function validateOTPVerification(req, res, next) {
  const email = cleanText(req.body.email).toLowerCase();
  const otp = cleanText(req.body.otp);
  if (!EMAIL_PATTERN.test(email) || !/^\d{6}$/.test(otp)) {
    return res.status(422).json({ success: false, message: "Enter a valid email and 6-digit verification code." });
  }
  req.validatedBody = { email, otp };
  next();
}

module.exports = { validateCustomerRegistration, validateEmailRequest, validateOTPVerification };
