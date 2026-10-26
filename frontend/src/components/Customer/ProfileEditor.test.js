import React from 'react';
import {render,screen,fireEvent,waitFor} from '@testing-library/react';
import ProfileEditor from './ProfileEditor';
import useAccountData from '../../hooks/useAccountData';
import {customerRequest} from '../../services/customerApi';
import {useCustomer} from './CustomerSessionProvider';
jest.mock('../../hooks/useAccountData');
jest.mock('../../services/customerApi');
jest.mock('./CustomerSessionProvider');
const data={customer:{firstName:'Test',lastName:'Person',phone:'0771234567',email:'test@example.test'},version:'v1'};
beforeEach(()=>{useCustomer.mockReturnValue({accept:jest.fn()});useAccountData.mockReturnValue({data,loading:false,error:'',refresh:jest.fn()});});
test('saves editable fields with conflict token, excluding verified email',async()=>{
  customerRequest.mockResolvedValue(data);render(<ProfileEditor/>);fireEvent.change(screen.getByLabelText('First name'),{target:{value:'Updated'}});fireEvent.click(screen.getByText('Save profile'));
  await waitFor(()=>expect(customerRequest).toHaveBeenCalledWith('/profile',{firstName:'Updated',lastName:'Person',phone:'0771234567',version:'v1'},'PATCH'));
  await screen.findByText('Profile saved.');expect(screen.getByDisplayValue('test@example.test').readOnly).toBe(true);
});
test('keeps unsaved draft after live update until explicit reload',()=>{
  const view=render(<ProfileEditor/>);fireEvent.change(screen.getByLabelText('First name'),{target:{value:'Draft'}});
  useAccountData.mockReturnValue({data:{customer:{...data.customer,firstName:'Remote'},version:'v2'},loading:false,error:'',refresh:jest.fn()});view.rerender(<ProfileEditor/>);
  expect(screen.getByLabelText('First name').value).toBe('Draft');expect(screen.getByRole('alert').textContent).toContain('unsaved input');fireEvent.click(screen.getByText('Load latest profile'));expect(screen.getByLabelText('First name').value).toBe('Remote');
});
