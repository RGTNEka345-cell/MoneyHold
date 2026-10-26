
import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import HomePage from "../pages/HomePage";
import CustomerLogin from "../pages/auth/CustomerLogin";
import WishlistPage from '../pages/customer/Wishlist';
import PasswordRecovery from '../pages/auth/PasswordRecovery';
import CustomerRegister from "../pages/auth/CustomerRegister";
import SellerLogin from "../pages/auth/SellerLogin";
import VerifyEmail from "../pages/auth/VerifyEmail";
import SellerGuard from '../components/Auth/SellerGuard';
import SellerDashboard from '../pages/seller/SellerDashboard';
import ThemeProvider from '../components/Theme/ThemeProvider';
import SellerCatalog from '../pages/seller/Products/SellerCatalog';
import Shop from '../pages/customer/Shop/Shop';
import ProductDetails from '../pages/customer/Product_Details/ProductDetails';
import CustomerGuard from '../components/Auth/CustomerGuard';
import CustomerDashboard from '../pages/customer/CustomerDashboard';
import Cart from '../pages/customer/Cart/Cart';
import Checkout from '../pages/customer/Checkout/Checkout';
import Orders from '../pages/customer/Orders/Orders';
import SellerOrders from '../pages/seller/Orders/SellerOrders';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/shop" element={<Shop />} />
      <Route path="/shop/:id" element={<ProductDetails />} />
      <Route element={<CustomerGuard/>}>
        <Route path="/customer/wishlist" element={<WishlistPage/>}/>
        <Route path="/customer/cart" element={<Cart/>}/>
        <Route path="/customer/checkout" element={<Checkout/>}/>
        <Route path="/customer/orders" element={<Orders/>}/>
        <Route path="/customer/orders/:id" element={<Orders/>}/>
        <Route path="/customer/account" element={<CustomerDashboard/>}/>
        <Route path="/customer/dashboard" element={<Navigate to="/customer/account" replace/>}/>
      </Route>
      <Route path="/login" element={<CustomerLogin />} />
      <Route path="/forgot-password" element={<PasswordRecovery key="forgot"/>}/>
      <Route path="/reset-password" element={<PasswordRecovery key="reset" reset/>}/>
      <Route path="/register" element={<CustomerRegister />} />
      <Route path="/verify-email" element={<VerifyEmail />} />
      <Route path="/seller/login" element={<SellerLogin />} />
      <Route element={<ThemeProvider><SellerGuard /></ThemeProvider>}>
        <Route path="/seller/dashboard" element={<SellerDashboard />} />
        <Route path="/seller/catalog" element={<SellerCatalog />} />
        <Route path="/seller/orders" element={<SellerOrders/>}/>
        <Route path="/seller/orders/:id" element={<SellerOrders/>}/>
        <Route path="/seller" element={<Navigate to="/seller/dashboard" replace />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
