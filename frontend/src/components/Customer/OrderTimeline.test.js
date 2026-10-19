import React from 'react';
import {render,screen} from '@testing-library/react';
import OrderTimeline from './OrderTimeline';
const created='2026-10-19T10:00:00Z';
test('shows current progress and upcoming steps without inventing delivery dates',()=>{
  const {container}=render(<OrderTimeline order={{status:'processing',created_at:created,history:[{status:'placed',created_at:created},{status:'processing',created_at:created}]}}/>);
  expect(screen.getByText('Step 2 of 4')).toBeTruthy();expect(container.querySelector('[aria-current="step"]').textContent).toContain('Preparing');
  expect(screen.getAllByText('Awaiting update')).toHaveLength(2);expect(container.querySelectorAll('time')).toHaveLength(2);
});
test('cancelled order stops at cancellation without a future delivery promise',()=>{
  render(<OrderTimeline order={{status:'cancelled',created_at:created,history:[{status:'placed',created_at:created},{status:'cancelled',created_at:created}]}}/>);
  expect(screen.getByRole('heading',{name:'Order cancelled'})).toBeTruthy();expect(screen.queryByRole('heading',{name:'Delivered'})).toBeNull();expect(screen.queryByText('Upcoming')).toBeNull();
});
test('live status changes update the tracker and delivered state',()=>{
  const {rerender}=render(<OrderTimeline order={{status:'shipped',created_at:created,history:[]}}/>);
  expect(screen.getByText('Step 3 of 4')).toBeTruthy();
  rerender(<OrderTimeline order={{status:'delivered',created_at:created,history:[{status:'delivered',created_at:created}]}}/>);
  expect(screen.getByText('Journey complete')).toBeTruthy();expect(screen.queryByText('Upcoming')).toBeNull();
});
