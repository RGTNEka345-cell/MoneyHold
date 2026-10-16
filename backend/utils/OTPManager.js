
const crypto = require("crypto");
const bcrypt = require("bcryptjs");

const OTP_EXPIRY_MINUTES = Number(process.env.OTP_EXPIRY_MINUTES) || 5;
const OTP_MAX_ATTEMPTS = Number(process.env.OTP_MAX_ATTEMPTS) || 5;
const OTP_RESEND_SECONDS = Number(process.env.OTP_RESEND_SECONDS) || 60;

function generateOTP() {
  return String(crypto.randomInt(100000, 1000000));
}

function getExpiryDate() {
  return new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
}

async function hashOTP(otp) {
  return bcrypt.hash(otp, 10);
}

async function matchesOTP(otp, hash) {
  return bcrypt.compare(otp, hash);
}

module.exports = { OTP_EXPIRY_MINUTES, OTP_MAX_ATTEMPTS, OTP_RESEND_SECONDS, generateOTP, getExpiryDate, hashOTP, matchesOTP };
