import React from 'react';
import {render,screen,fireEvent,waitFor} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';
import Cart from './Cart';
import {useCart} from '../../../components/Customer/CartProvider';
jest.mock('../../../components/Customer/CartProvider',()=>({useCart:jest.fn()}));
jest.mock('../../../components/HomePage/Navbar',()=>()=>null);
jest.mock('../../../components/HomePage/Footer',()=>()=>null);
const show=()=>render(<MemoryRouter future={{v7_startTransition:true,v7_relativeSplatPath:true}}><Cart/></MemoryRouter>);
test('continue shopping uses the styled navigation control',()=>{
  useCart.mockReturnValue({cart:{items:[],count:0}});show();
  const control=screen.getByRole('link',{name:'Continue shopping'});
  expect(control.getAttribute('href')).toBe('/shop');
  expect(control.className).toBe('cart-continue-shopping');
});
test('empty bag links to shop',()=>{useCart.mockReturnValue({cart:{items:[],count:0}});show();expect(screen.getByRole('link',{name:/Explore/}).getAttribute('href')).toBe('/shop');});
test('quantity edits and removals use the cart item ID, checkout links to delivery details',async()=>{
  const update=jest.fn().mockResolvedValue(),remove=jest.fn().mockResolvedValue();
  useCart.mockReturnValue({cart:{items:[{id:9,product_id:1,name:'Signature',size:'M',colour:'Black',quantity:2,stock:5,is_active:1,priceCents:10000,lineTotalCents:20000}],count:2,subtotalCents:20000},update,remove});show();
  fireEvent.change(screen.getByRole('spinbutton'),{target:{value:'3'}});fireEvent.click(screen.getByRole('button',{name:'Update'}));
  await waitFor(()=>expect(update).toHaveBeenCalledWith(9,3));
  await waitFor(()=>expect(screen.getByRole('button',{name:'Remove'}).disabled).toBe(false));
  fireEvent.click(screen.getByRole('button',{name:'Remove'}));await waitFor(()=>expect(remove).toHaveBeenCalledWith(9));
  expect(screen.getByRole('link',{name:/Proceed to checkout/}).getAttribute('href')).toBe('/customer/checkout');
});
