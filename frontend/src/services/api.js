
const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...options.headers },
  });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.message || "Request failed. Please try again.");
    error.status = response.status;
    error.errors = data.errors || {};
    error.code = data.code;
    error.retryAfter = data.retryAfter;
    error.verificationRequired = data.verificationRequired;
    throw error;
  }
  return data;
}

export function registerCustomer(payload) {
  return request("/auth/customer/register", { method: "POST", body: JSON.stringify(payload) });
}

export function verifyCustomerEmail(payload) {
  return request("/auth/customer/verify-email", { method: "POST", body: JSON.stringify(payload) });
}

export function resendCustomerOTP(email) {
  return request("/auth/customer/resend-otp", { method: "POST", body: JSON.stringify({ email }) });
}
