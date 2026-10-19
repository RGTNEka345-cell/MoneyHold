import React from 'react';
import {render,screen,fireEvent,waitFor} from '@testing-library/react';
import TrackingForm from './TrackingForm';
import {sellerRequest} from '../../../services/sellerApi';
jest.mock('../../../services/sellerApi',()=>({sellerRequest:jest.fn()}));
test('courier and tracking number can be submitted without a URL',async()=>{
  sellerRequest.mockResolvedValue({order:{tracking:{version:1}}});const onSaved=jest.fn();
  render(<TrackingForm order={{id:7,status:'processing'}} onSaved={onSaved}/>);
  fireEvent.change(screen.getByLabelText('Courier name'),{target:{value:'Courier'}});
  fireEvent.change(screen.getByLabelText('Tracking number'),{target:{value:'ABC123'}});
  expect(screen.getByLabelText('Tracking URL (HTTPS, optional)').required).toBe(false);
  fireEvent.click(screen.getByRole('button',{name:'Save tracking details'}));
  await waitFor(()=>expect(onSaved).toHaveBeenCalled());
  expect(sellerRequest).toHaveBeenCalledWith('/orders/7/tracking',{courierName:'Courier',trackingNumber:'ABC123',trackingUrl:'',version:0},'PATCH');
});
test('seller saves courier fields and the expected version',async()=>{
  sellerRequest.mockResolvedValue({order:{tracking:{version:1}}});const onSaved=jest.fn();
  render(<TrackingForm order={{id:7,status:'processing',tracking:null}} onSaved={onSaved}/>);
  fireEvent.change(screen.getByLabelText('Courier name'),{target:{value:'Courier'}});fireEvent.change(screen.getByLabelText('Tracking number'),{target:{value:'ABC123'}});fireEvent.change(screen.getByLabelText('Tracking URL (HTTPS, optional)'),{target:{value:'https://courier.example.com/track'}});
  fireEvent.click(screen.getByRole('button',{name:'Save tracking details'}));
  await waitFor(()=>expect(onSaved).toHaveBeenCalled());expect(sellerRequest).toHaveBeenCalledWith('/orders/7/tracking',{courierName:'Courier',trackingNumber:'ABC123',trackingUrl:'https://courier.example.com/track',version:0},'PATCH');
});
test('live changes protect the unsaved form until seller reloads',()=>{
  const {rerender}=render(<TrackingForm order={{id:7,status:'processing'}} onSaved={()=>{}}/>);
  fireEvent.change(screen.getByLabelText('Courier name'),{target:{value:'My unsaved courier'}});
  rerender(<TrackingForm order={{id:7,status:'processing',tracking:{courier_name:'New saved courier',tracking_number:'NEW',tracking_url:'https://courier.example.com',version:1}}} onSaved={()=>{}}/>);
  expect(screen.getByLabelText('Courier name').value).toBe('My unsaved courier');expect(screen.getByRole('button',{name:'Save tracking details'}).disabled).toBe(true);
  fireEvent.click(screen.getByRole('button',{name:'Load latest details'}));expect(screen.getByLabelText('Courier name').value).toBe('New saved courier');
});
