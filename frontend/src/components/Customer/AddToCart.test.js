import React from 'react';
import {render,screen,fireEvent,waitFor} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';
import AddToCart from './AddToCart';
import {useCustomer} from './CustomerSessionProvider';
import {useCart} from './CartProvider';
jest.mock('./CustomerSessionProvider',()=>({useCustomer:jest.fn()}));
jest.mock('./CartProvider',()=>({useCart:jest.fn()}));
const variant={id:7,stock:4};
const show=v=>render(<MemoryRouter future={{v7_startTransition:true,v7_relativeSplatPath:true}}><AddToCart variant={v}/></MemoryRouter>);
beforeEach(()=>{useCustomer.mockReturnValue({customer:{id:1},loading:false});useCart.mockReturnValue({add:jest.fn().mockResolvedValue()});});
test('guests must sign in',()=>{useCustomer.mockReturnValue({customer:null});show(variant);expect(screen.getByRole('link').getAttribute('href')).toBe('/login');});
test('requires a variant and sends only its ID and quantity',async()=>{
  const {unmount}=show(undefined);expect(screen.getByRole('button').disabled).toBe(true);unmount();
  show(variant);fireEvent.change(screen.getByLabelText('Quantity'),{target:{value:'3'}});fireEvent.click(screen.getByRole('button',{name:'Add to bag'}));
  await waitFor(()=>expect(useCart().add).toHaveBeenCalledWith(7,3));
  expect((await screen.findByRole('status')).textContent).toContain('Added to your bag');
  const viewBag=screen.getByRole('link',{name:'View bag'});
  expect(viewBag.getAttribute('href')).toBe('/customer/cart');
  expect(viewBag.className).toBe('cart-view-bag');
});
test('stock failure is shown without a success message',async()=>{
  useCart.mockReturnValue({add:jest.fn().mockRejectedValue(new Error('Only 1 available.'))});show(variant);
  fireEvent.click(screen.getByRole('button',{name:'Add to bag'}));
  expect((await screen.findByRole('alert')).textContent).toContain('Only 1 available.');
  expect(screen.queryByText(/Added to your bag/)).toBeNull();
});
