import React from 'react';
import { fireEvent, render, screen, cleanup } from '@testing-library/react';
import ProductPhotos from './ProductPhotos';
import VariantBuilder from './VariantBuilder';

afterEach(cleanup);
test('variant builder adds combinations without duplicating an existing size/colour',()=>{
  const onChange=jest.fn();
  render(<VariantBuilder variants={[{size:'M',colour:'Black',stock:8}]} onChange={onChange} onError={jest.fn()}/>);
  fireEvent.click(screen.getByRole('button',{name:'M',exact:true}));
  fireEvent.click(screen.getByRole('button',{name:'L',exact:true}));
  fireEvent.click(screen.getByRole('button',{name:'Generate variants'}));
  const variants=onChange.mock.calls[0][0];
  expect(variants).toHaveLength(4);
  expect(variants[0].stock).toBe(8);
  expect(variants.filter(v=>v.size==='M'&&v.colour==='Black')).toHaveLength(1);
});
test('photos append to selection, validate limits and clean up preview URLs',()=>{
  URL.createObjectURL=jest.fn(()=> 'blob:preview');
  URL.revokeObjectURL=jest.fn();
  const first=new File(['photo'],'front.png',{type:'image/png'});
  const next=new File(['photo'],'back.png',{type:'image/png'});
  const onFiles=jest.fn(),onError=jest.fn();
  const {container,unmount}=render(<ProductPhotos imageIds={[]} files={[first]} onFiles={onFiles} onImages={jest.fn()} onError={onError}/>);
  fireEvent.change(container.querySelector('input[type=file]'),{target:{files:[next]}});
  expect(onFiles).toHaveBeenCalledWith([first,next]);
  fireEvent.change(container.querySelector('input[type=file]'),{target:{files:[next,next,next,next]}});
  expect(onError).toHaveBeenLastCalledWith('You can add up to four photos. Remove one before adding another.');
  expect(screen.getByAltText('New product view 1').getAttribute('src')).toBe('blob:preview');
  unmount();expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:preview');
});
