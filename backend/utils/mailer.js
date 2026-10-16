
const nodemailer = require("nodemailer");

let transporter;

function getTransporter() {
  if (transporter) return transporter;
  const user = process.env.SMTP_USER || process.env.EMAIL_USER;
  const pass = process.env.SMTP_PASS || process.env.EMAIL_PASS;
  const fallbackEnabled = String(process.env.MAIL_FALLBACK).toLowerCase() === "true";

  if (fallbackEnabled) {
    transporter = nodemailer.createTransport({ jsonTransport: true });
    return transporter;
  }

  if (!user || !pass) {
    throw new Error("Email credentials are missing. Configure SMTP_USER/SMTP_PASS or EMAIL_USER/EMAIL_PASS.");
  }

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT) || 587,
    secure: String(process.env.SMTP_SECURE).toLowerCase() === "true",
    auth: { user, pass },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 20000,
  });
  return transporter;
}

async function sendMail(options) {
  const info = await getTransporter().sendMail({
    from: process.env.MAIL_FROM || `Money Hold <${process.env.SMTP_USER || process.env.EMAIL_USER}>`,
    ...options,
  });
  if (String(process.env.MAIL_FALLBACK).toLowerCase() === "true") {
    console.log("Development email:", info.message);
  } else if (!info.accepted?.length || info.rejected?.length) {
    throw new Error("The mail server did not accept the recipient.");
  }
  return info;
}

module.exports = { sendMail };
