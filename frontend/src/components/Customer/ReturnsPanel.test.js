import React from 'react';
import {render,screen,fireEvent,waitFor} from '@testing-library/react';
import ReturnsPanel from './ReturnsPanel';
import {customerRequest} from '../../services/customerApi';
import {sellerRequest} from '../../services/sellerApi';
jest.mock('../../services/customerApi',()=>({customerRequest:jest.fn()}));
jest.mock('../../services/sellerApi',()=>({sellerRequest:jest.fn()}));
const order={id:7,status:'delivered',items:[{id:11,product_name:'Tee',quantity:2,size:'M',colour:'Black'}],returns:{requests:[],options:[{order_item_id:11,id:22,size:'L',stock:3}]}};
beforeEach(()=>{customerRequest.mockResolvedValue({id:1});sellerRequest.mockResolvedValue({success:true});Object.defineProperty(window,'crypto',{configurable:true,value:{getRandomValues:array=>require('crypto').randomFillSync(array)}});});
test('customer selects an item and another size, and submits an idempotent request',async()=>{
  const refresh=jest.fn();render(<ReturnsPanel order={order} onChange={refresh}/>);
  fireEvent.change(screen.getByLabelText('Delivered item'),{target:{value:'11'}});
  fireEvent.change(screen.getByLabelText('Request type'),{target:{value:'exchange'}});
  fireEvent.change(screen.getByLabelText(/Replacement size/),{target:{value:'22'}});
  fireEvent.change(screen.getByLabelText('Reason'),{target:{value:'Size too small'}});
  fireEvent.click(screen.getByRole('button',{name:'Submit request'}));
  await waitFor(()=>expect(refresh).toHaveBeenCalled());
  expect(customerRequest).toHaveBeenCalledWith('/orders/7/returns',expect.objectContaining({itemId:11,kind:'exchange',quantity:1,replacementVariantId:22,reason:'Size too small',requestKey:expect.any(String)}));
});
test('undelivered orders cannot submit and consumed quantities are excluded',()=>{
  const {rerender}=render(<ReturnsPanel order={{...order,status:'shipped'}}/>);expect(screen.queryByRole('button',{name:'Submit request'})).toBeNull();
  rerender(<ReturnsPanel order={{...order,returns:{options:[],requests:[{id:1,order_item_id:11,kind:'return',quantity:2,status:'completed',reason:'Test',history:[]}]}}}/>);
  expect(screen.queryByRole('button',{name:'Submit request'})).toBeNull();expect(screen.getByText(/All delivered units/)).toBeTruthy();
});
test('seller inspection defaults to zero restock and requires physical inspection confirmation',async()=>{
  const refresh=jest.fn();render(<ReturnsPanel seller order={{...order,returns:{options:[],requests:[{id:1,version:2,order_item_id:11,kind:'return',quantity:2,status:'approved',reason:'Test',history:[]}]}}} onChange={refresh}/>);
  const qty=screen.getByLabelText('Resellable units to add back to stock');expect(qty.value).toBe('0');
  const checkbox=screen.getByRole('checkbox');expect(checkbox.required).toBe(true);
  fireEvent.change(screen.getByLabelText('Customer-visible note'),{target:{value:'Parcel inspected; one unit is damaged.'}});fireEvent.change(qty,{target:{value:'1'}});fireEvent.click(checkbox);fireEvent.click(screen.getByRole('button',{name:'Confirm update'}));
  await waitFor(()=>expect(refresh).toHaveBeenCalled());expect(sellerRequest).toHaveBeenCalledWith('/orders/7/returns/1',expect.objectContaining({status:'received',version:2,restockQuantity:1,inspected:true}),'PATCH');
});
test('API error is shown without claiming the request succeeded',async()=>{
  customerRequest.mockRejectedValue(new Error('Already requested.'));const refresh=jest.fn();render(<ReturnsPanel order={order} onChange={refresh}/>);
  fireEvent.change(screen.getByLabelText('Delivered item'),{target:{value:'11'}});fireEvent.change(screen.getByLabelText('Reason'),{target:{value:'Return item'}});fireEvent.click(screen.getByRole('button',{name:'Submit request'}));
  expect((await screen.findByRole('alert')).textContent).toContain('Already requested');expect(refresh).not.toHaveBeenCalled();
});
