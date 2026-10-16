const base = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
export async function sellerRequest(path, body) {
  const response = await fetch(`${base}/seller${path}`, {
    method: body === undefined ? 'GET' : 'POST', credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    ...(body === undefined ? {} : { body: JSON.stringify(body) })
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) { const error = new Error(data.message || 'Unable to complete the request. Please try again.'); error.status = response.status; throw error; }
  return data;
}
