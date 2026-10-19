import React from 'react';
import {render,screen,fireEvent,waitFor,act} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';
import NotificationBell from './NotificationBell';
import {customerRequest} from '../../services/customerApi';
jest.mock('../../services/customerApi',()=>({customerRequest:jest.fn()}));
const data={items:[{id:7,order_id:42,message:'Order MH-TEST: shipped.',read_at:null,created_at:'2026-10-19T12:00:00Z'}],unread:1,pages:1};
let stream;
beforeEach(()=>{
  customerRequest.mockResolvedValue(data);
  global.EventSource=jest.fn().mockImplementation(()=>{stream={close:jest.fn()};return stream;});
});
const show=()=>render(<MemoryRouter future={{v7_startTransition:true,v7_relativeSplatPath:true}}><NotificationBell/></MemoryRouter>);
test('shows unread badge, order link and persists marking read',async()=>{
  show();fireEvent.click(await screen.findByRole('button',{name:'Notifications, 1 unread'}));
  expect(screen.getByRole('link',{name:/Order MH-TEST/}).getAttribute('href')).toBe('/customer/orders/42');
  customerRequest.mockResolvedValue({...data,items:[{...data.items[0],read_at:'now'}],unread:0});
  fireEvent.click(screen.getByRole('button',{name:'Mark as read'}));
  await waitFor(()=>expect(customerRequest).toHaveBeenCalledWith('/notifications/7/read',{},'PATCH'));
  await screen.findByRole('button',{name:'Notifications, 0 unread'});
});
test('SSE updates badge and closes stream on unmount',async()=>{
  const {unmount}=show();await screen.findByRole('button',{name:'Notifications, 1 unread'});
  customerRequest.mockResolvedValue({...data,unread:2});await act(async()=>stream.onmessage());
  await screen.findByRole('button',{name:'Notifications, 2 unread'});unmount();expect(stream.close).toHaveBeenCalled();
});
test('Escape closes the panel and restores trigger focus',async()=>{
  show();const button=await screen.findByRole('button',{name:'Notifications, 1 unread'});fireEvent.click(button);fireEvent.keyDown(document,{key:'Escape'});
  expect(screen.queryByRole('region',{name:'Notifications'})).toBeNull();expect(document.activeElement).toBe(button);
});
