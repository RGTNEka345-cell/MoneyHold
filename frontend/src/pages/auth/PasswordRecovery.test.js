import React from 'react';
import {render,screen,fireEvent} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';
import PasswordRecovery from './PasswordRecovery';
import {customerRequest} from '../../services/customerApi';
jest.mock('../../services/customerApi');
jest.mock('../../components/Auth/AuthLayout',()=>({children})=><div>{children}</div>);
jest.mock('../../components/Customer/CustomerSessionProvider',()=>({useCustomer:()=>({refresh:jest.fn()})}));
const show=(reset=false,hash='')=>render(<MemoryRouter initialEntries={['/reset-password'+hash]} future={{v7_startTransition:true,v7_relativeSplatPath:true}}><PasswordRecovery reset={reset}/></MemoryRouter>);
test('requests a reset link and displays generic confirmation',async()=>{
 customerRequest.mockResolvedValue({message:'If an account matches, check your email.'});show();fireEvent.change(screen.getByLabelText('Email address'),{target:{value:'test@example.test'}});fireEvent.click(screen.getByText('Send reset link'));
 await screen.findByText('If an account matches, check your email.');expect(customerRequest).toHaveBeenCalledWith('/forgot-password',{email:'test@example.test'});
});
test('rejects missing token without exposing a password form',()=>{show(true);expect(screen.getByRole('alert').textContent).toContain('invalid');expect(screen.queryByLabelText('New password')).toBeNull();});
test('submits token with matching passwords and shows success',async()=>{
 const token='a'.repeat(64);customerRequest.mockResolvedValue({message:'Password updated.'});show(true,'#token='+token);
 fireEvent.change(screen.getByLabelText('New password'),{target:{value:'SecureNewPass123'}});fireEvent.change(screen.getByLabelText('Confirm new password'),{target:{value:'SecureNewPass123'}});fireEvent.click(screen.getByText('Update password'));
 await screen.findByText('Password updated.');expect(customerRequest).toHaveBeenCalledWith('/reset-password',{token,password:'SecureNewPass123',confirmPassword:'SecureNewPass123'});
});
