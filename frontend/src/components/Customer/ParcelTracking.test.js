import React from 'react';
import {render,screen} from '@testing-library/react';
import ParcelTracking from './ParcelTracking';
const tracking={courier_name:'Courier',tracking_number:'ABC-123',tracking_url:'https://courier.example.com/track/ABC-123'};
test('missing URL keeps courier and reference visible without a tracking button',()=>{
  render(<ParcelTracking order={{status:'shipped',tracking:{...tracking,tracking_url:''}}}/>);
  expect(screen.getByText('ABC-123')).toBeTruthy();expect(screen.getByRole('heading',{name:'Courier'})).toBeTruthy();expect(screen.queryByRole('link')).toBeNull();
});
test('shows the tracking reference and safe new-tab link',()=>{
  render(<ParcelTracking order={{status:'shipped',tracking}}/>);
  expect(screen.getByText('ABC-123')).toBeTruthy();const link=screen.getByRole('link',{name:/Track parcel/});
  expect(link.getAttribute('href')).toBe(tracking.tracking_url);expect(link.getAttribute('target')).toBe('_blank');expect(link.getAttribute('rel')).toContain('noopener');
});
test('cancelled order preserves the reference but does not offer tracking',()=>{
  render(<ParcelTracking order={{status:'cancelled',tracking}}/>);expect(screen.queryByRole('link')).toBeNull();expect(screen.getByText('ABC-123')).toBeTruthy();
});
test('unsafe URLs are never made clickable',()=>{
  render(<ParcelTracking order={{status:'shipped',tracking:{...tracking,tracking_url:'javascript:alert(1)'}}}/>);expect(screen.queryByRole('link')).toBeNull();
});
