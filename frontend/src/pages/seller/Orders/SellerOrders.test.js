import React from 'react';
import {render,screen,fireEvent,waitFor} from '@testing-library/react';
import {MemoryRouter,Routes,Route} from 'react-router-dom';
import SellerOrders from './SellerOrders';
import useOrders from '../../../hooks/useOrders';
import {sellerRequest} from '../../../services/sellerApi';
jest.mock('../../../hooks/useOrders',()=>({__esModule:true,default:jest.fn()}));
jest.mock('../../../services/sellerApi',()=>({sellerRequest:jest.fn()}));
jest.mock('../../../components/Theme/ThemeToggle',()=>()=>null);
jest.mock('../../../components/Shared/NotificationBell',()=>()=>null);
jest.mock('../../../components/Customer/OrderDetails',()=>()=>null);
const show=()=>render(<MemoryRouter initialEntries={['/seller/orders/7']} future={{v7_startTransition:true,v7_relativeSplatPath:true}}><Routes><Route path="/seller/orders/:id" element={<SellerOrders/>}/></Routes></MemoryRouter>);
beforeEach(()=>{sellerRequest.mockResolvedValue({});useOrders.mockReturnValue({data:{order:{id:7,order_number:'MH-TEST',status:'placed'}},loading:false,error:'',retry:jest.fn()});});
test('seller status updates include expected previous state',async()=>{
  show();fireEvent.click(screen.getByRole('button',{name:'Mark processing'}));
  await waitFor(()=>expect(sellerRequest).toHaveBeenCalledWith('/orders/7/status',{status:'processing',expectedStatus:'placed'},'PATCH'));
});
test('cancellation requires an explicit confirmation',async()=>{
  show();fireEvent.click(screen.getByRole('button',{name:'Cancel order'}));expect(sellerRequest).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button',{name:'Confirm cancellation'}));
  await waitFor(()=>expect(sellerRequest).toHaveBeenCalledWith('/orders/7/status',{status:'cancelled',expectedStatus:'placed'},'PATCH'));
});
test('completed orders cannot be cancelled from the UI',()=>{
  useOrders.mockReturnValue({data:{order:{id:7,order_number:'MH-TEST',status:'delivered'}},loading:false,error:'',retry:jest.fn()});show();
  expect(screen.queryByRole('button',{name:'Cancel order'})).toBeNull();
});
