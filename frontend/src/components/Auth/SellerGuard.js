import React, { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { sellerRequest } from '../../services/sellerApi';
export default function SellerGuard() {
  const [state, setState] = useState({ loading: true });
  const [retry, setRetry] = useState(0);
  const location = useLocation();
  useEffect(() => {
    let active = true;
    setState({ loading: true });
    sellerRequest('/me').then(data => { if (active) setState({ seller: data.seller }); })
      .catch(error => { if (active) setState({ denied: error.status === 401 || error.status === 403, error: error.message }); });
    return () => { active = false; };
  }, [retry, location.pathname]);
  if (state.loading) return <main className="seller-status" role="status">Checking seller access…</main>;
  if (state.denied) return <Navigate to="/seller/login" replace />;
  if (state.error) return <main className="seller-status"><p role="alert">{state.error}</p><button onClick={() => setRetry(x => x + 1)}>Try again</button></main>;
  return <Outlet context={{ seller: state.seller }} />;
}
