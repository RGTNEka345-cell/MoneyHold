import React from 'react';
import {render,screen,fireEvent,waitFor} from '@testing-library/react';
import {MemoryRouter,Routes,Route} from 'react-router-dom';
import Checkout from './Checkout';
import {customerRequest,watchCart} from '../../../services/customerApi';
jest.mock('../../../components/HomePage/Navbar',()=>()=>null);
jest.mock('../../../components/HomePage/Footer',()=>()=>null);
jest.mock('../../../components/Customer/CustomerSessionProvider',()=>({useCustomer:()=>({customer:{id:1,firstName:'Test',lastName:'Person',phone:'0771234567'}})}));
const mockRefresh=jest.fn();
jest.mock('../../../components/Customer/CartProvider',()=>({useCart:()=>({refresh:mockRefresh})}));
jest.mock('../../../services/customerApi',()=>({customerRequest:jest.fn(),watchCart:jest.fn(()=>()=>{})}));
const quote={items:[{variant_id:1,name:'Signature Tee',size:'M',colour:'Black',quantity:2,lineTotalCents:500000}],subtotalCents:500000,deliveryCents:35000,totalCents:535000,quoteToken:'a'.repeat(64)};
function show(){return render(<MemoryRouter initialEntries={['/customer/checkout']} future={{v7_startTransition:true,v7_relativeSplatPath:true}}><Routes><Route path="/customer/checkout" element={<Checkout/>}/><Route path="/customer/orders/:id" element={<p>Order confirmation page</p>}/></Routes></MemoryRouter>);}
async function fill(){await screen.findByText('Signature Tee');fireEvent.change(screen.getByLabelText('Street address'),{target:{value:'10 Test Road'}});fireEvent.change(screen.getByLabelText('City'),{target:{value:'Colombo'}});}
beforeEach(()=>{
  jest.clearAllMocks();sessionStorage.clear();watchCart.mockImplementation(()=>()=>{});
  Object.defineProperty(window,'crypto',{configurable:true,value:{getRandomValues:array=>require('crypto').randomFillSync(array)}});
  customerRequest.mockImplementation(path=>path==='/orders/quote'?Promise.resolve(quote):Promise.reject(Object.assign(new Error('Not found'),{status:404})));
});
test('submits COD delivery with quote and idempotency key; redirects only after success',async()=>{
  customerRequest.mockImplementation((path,body)=>path==='/orders/quote'?Promise.resolve(quote):path==='/orders'&&body?Promise.resolve({id:42}):Promise.reject(new Error('Unexpected')));
  show();await fill();fireEvent.click(screen.getByRole('button',{name:'Place order · Pay on delivery'}));
  await screen.findByText('Order confirmation page');
  const body=customerRequest.mock.calls.find(([path])=>path==='/orders')[1];
  expect(body.quoteToken).toBe(quote.quoteToken);expect(body.paymentMethod).toBe('cod');expect(body.delivery.city).toBe('Colombo');expect(body.requestKey).toHaveLength(32);
  expect(body.totalCents).toBeUndefined();expect(mockRefresh).toHaveBeenCalled();expect(sessionStorage.getItem('moneyHoldCheckout:1')).toBeNull();
});
test('missing delivery configuration disables placing orders',async()=>{
  customerRequest.mockRejectedValue(Object.assign(new Error('Store must configure its delivery fee.'),{status:503}));show();
  expect((await screen.findByRole('alert')).textContent).toContain('delivery fee');expect(screen.getByRole('button',{name:'Place order · Pay on delivery'}).disabled).toBe(true);
});
test('live price change requires explicit review',async()=>{
  show();await fill();customerRequest.mockResolvedValue({...quote,totalCents:600000,quoteToken:'b'.repeat(64)});
  watchCart.mock.calls[0][0]();
  await screen.findByText('Your bag or price changed. Review the new total.');
  expect(screen.getByRole('button',{name:'Place order · Pay on delivery'}).disabled).toBe(true);
  fireEvent.click(screen.getByRole('button',{name:'I have reviewed the updated summary'}));
  expect(screen.getByRole('button',{name:'Place order · Pay on delivery'}).disabled).toBe(false);
});
test('lost response recovers the created order instead of placing another',async()=>{
  customerRequest.mockImplementation(path=>path==='/orders/quote'?Promise.resolve(quote):path==='/orders'?Promise.reject(new Error('Network failed')):Promise.resolve({id:42}));
  show();await fill();fireEvent.click(screen.getByRole('button',{name:'Place order · Pay on delivery'}));
  await screen.findByText('Order confirmation page');expect(customerRequest.mock.calls.filter(([path])=>path==='/orders')).toHaveLength(1);
});
test('reload recovers a previously committed request without needing a cart',async()=>{
  sessionStorage.setItem('moneyHoldCheckout:1','pending_request_001');customerRequest.mockResolvedValue({id:42});show();
  await screen.findByText('Order confirmation page');await waitFor(()=>expect(customerRequest).toHaveBeenCalledWith('/orders/request/pending_request_001'));
});
