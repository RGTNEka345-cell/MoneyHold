import React from 'react';
import {render,screen,fireEvent} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';
import SavedAddressPicker from './SavedAddressPicker';
import useAccountData from '../../hooks/useAccountData';
jest.mock('../../hooks/useAccountData');
const address={id:1,label:'Home',city:'Colombo',version:1,isDefault:true};
const wrap=props=><MemoryRouter future={{v7_startTransition:true,v7_relativeSplatPath:true}}><SavedAddressPicker {...props}/></MemoryRouter>;
beforeEach(()=>useAccountData.mockReturnValue({data:{addresses:[address]},loading:false,error:'',refresh:jest.fn()}));
test('autofills default once and does not overwrite fields after live changes',()=>{
  const props={onSelect:jest.fn(),canAutofill:()=>true};const view=render(wrap(props));expect(props.onSelect).toHaveBeenCalledWith(address);
  const changed={...address,city:'Kandy',version:2};useAccountData.mockReturnValue({data:{addresses:[changed]},loading:false,error:''});view.rerender(wrap(props));
  expect(props.onSelect).toHaveBeenCalledTimes(1);fireEvent.click(screen.getByText('Use updated address'));expect(props.onSelect).toHaveBeenLastCalledWith(changed);
  fireEvent.change(screen.getByRole('combobox'),{target:{value:''}});expect(props.onSelect).toHaveBeenLastCalledWith(null);
});
test('does not autofill after customer started typing; explicit selection works',()=>{
  const props={onSelect:jest.fn(),canAutofill:()=>false};render(wrap(props));expect(props.onSelect).not.toHaveBeenCalled();
  fireEvent.change(screen.getByRole('combobox'),{target:{value:'1'}});expect(props.onSelect).toHaveBeenCalledWith(address);
});
test('loading failure permits manual delivery and retry',()=>{
  const refresh=jest.fn();useAccountData.mockReturnValue({data:null,loading:false,error:'Offline',refresh});render(wrap({onSelect:jest.fn(),canAutofill:()=>true}));
  expect(screen.getByRole('alert').textContent).toContain('manually');fireEvent.click(screen.getByText('Retry'));expect(refresh).toHaveBeenCalled();
});
