const base = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
export async function sellerRequest(path, body, method) {
  const multipart = body instanceof FormData;
  const response = await fetch(`${base}/seller${path}`, {
    method: method || (body === undefined ? 'GET' : 'POST'), credentials: 'include',
    headers: multipart ? {} : { 'Content-Type': 'application/json' },
    ...(body === undefined ? {} : { body: multipart ? body : JSON.stringify(body) })
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) { const error = new Error(data.message || 'Unable to complete the request. Please try again.'); error.status = response.status; throw error; }
  return data;
}
export const sellerImageUrl = id => `${base}/seller/images/${id}`;
export function watchCatalog(onChange) {
  const source = new EventSource(`${base}/seller/catalog/events`, { withCredentials: true });
  source.onmessage = onChange;
  return () => source.close();
}
