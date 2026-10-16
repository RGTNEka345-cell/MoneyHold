
const { sendMail } = require("./mailer");
const { OTP_EXPIRY_MINUTES } = require("./OTPManager");

async function sendVerificationOTP({ email, firstName, otp }) {
  return sendMail({
    to: email,
    subject: `${otp} is your Money Hold verification code`,
    text: `Hi ${firstName}, your Money Hold verification code is ${otp}. It expires in ${OTP_EXPIRY_MINUTES} minutes.`,
    html: `
      <div style="background:#080808;padding:40px;font-family:Arial,sans-serif;color:#f4f1e9">
        <div style="max-width:520px;margin:auto;border:1px solid #332e23;padding:36px">
          <p style="color:#c7a45a;letter-spacing:3px;font-size:11px">MONEY HOLD</p>
          <h1 style="font-size:28px;margin:24px 0 12px">Verify your email</h1>
          <p style="color:#aaa69f;line-height:1.7">Hi ${firstName}, use this code to complete your Money Hold account registration.</p>
          <div style="margin:30px 0;padding:20px;background:#111;text-align:center;color:#c7a45a;font-size:34px;font-weight:bold;letter-spacing:10px">${otp}</div>
          <p style="color:#77736c;font-size:12px">This code expires in ${OTP_EXPIRY_MINUTES} minutes. Never share it with anyone.</p>
        </div>
      </div>`,
  });
}

module.exports = { sendVerificationOTP };
