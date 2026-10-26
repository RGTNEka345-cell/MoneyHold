import React from 'react';
import Navbar from '../../components/HomePage/Navbar';
import Footer from '../../components/HomePage/Footer';
import {Wishlist} from '../../components/Customer/ProductEngagement';
import './Shop/Shop.css';
export default function WishlistPage(){return <div className="shop-page"><Navbar/><main className="shop-detail"><Wishlist/></main><Footer/></div>;}
