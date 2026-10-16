
import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import HomePage from "../pages/HomePage";
import CustomerLogin from "../pages/auth/CustomerLogin";
import CustomerRegister from "../pages/auth/CustomerRegister";
import SellerLogin from "../pages/auth/SellerLogin";
import VerifyEmail from "../pages/auth/VerifyEmail";
import SellerGuard from '../components/Auth/SellerGuard';
import SellerDashboard from '../pages/seller/SellerDashboard';
import ThemeProvider from '../components/Theme/ThemeProvider';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<CustomerLogin />} />
      <Route path="/register" element={<CustomerRegister />} />
      <Route path="/verify-email" element={<VerifyEmail />} />
      <Route path="/seller/login" element={<SellerLogin />} />
      <Route element={<ThemeProvider><SellerGuard /></ThemeProvider>}>
        <Route path="/seller/dashboard" element={<SellerDashboard />} />
        <Route path="/seller" element={<Navigate to="/seller/dashboard" replace />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
