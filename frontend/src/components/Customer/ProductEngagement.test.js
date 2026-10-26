import React from 'react';
import {render,screen,fireEvent,waitFor} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';
import {WishlistButton,Wishlist,ProductReviews} from './ProductEngagement';
import useAccountData from '../../hooks/useAccountData';
import useShop from '../../hooks/useShop';
import {useCustomer} from './CustomerSessionProvider';
import {customerRequest} from '../../services/customerApi';
jest.mock('../../hooks/useAccountData');jest.mock('./CustomerSessionProvider');jest.mock('../../services/customerApi');
jest.mock('../../hooks/useShop',()=>({__esModule:true,default:jest.fn(),shopImage:id=>'/image/'+id,formatPrice:n=>'LKR '+n}));
const show=node=>render(<MemoryRouter future={{v7_startTransition:true,v7_relativeSplatPath:true}}>{node}</MemoryRouter>);
beforeEach(()=>{useCustomer.mockReturnValue({customer:{id:1}});customerRequest.mockResolvedValue({});useAccountData.mockReturnValue({data:{items:[]},loading:false,error:'',refresh:jest.fn()});});
test('guest is directed to sign in, authenticated save uses product id',async()=>{
 show(<WishlistButton productId={3}/>);fireEvent.click(screen.getByText('♡ Save to wishlist'));await waitFor(()=>expect(customerRequest).toHaveBeenCalledWith('/wishlist/3',{},'PUT'));
});
test('saved item is removable, including unavailable products',async()=>{
 useAccountData.mockReturnValue({data:{items:[{id:3,name:'Black Tee',price:2000,is_active:0}]},loading:false,error:'',refresh:jest.fn()});show(<Wishlist/>);expect(screen.getByText('Currently unavailable')).toBeTruthy();fireEvent.click(screen.getByLabelText('Remove Black Tee'));await waitFor(()=>expect(customerRequest).toHaveBeenCalledWith('/wishlist/3',{},'DELETE'));
});
test('review text is rendered as text and eligible customer can submit rating',async()=>{
 useShop.mockReturnValue({data:{reviews:[{id:1,author:'Buyer',rating:4,body:'<script>unsafe</script>'}],average:4,total:1,pages:1},loading:false,error:''});
 useAccountData.mockReturnValue({data:{review:null,eligible:true},loading:false,error:'',refresh:jest.fn()});show(<ProductReviews productId={3}/>);
 expect(screen.getByText('<script>unsafe</script>').querySelector('script')).toBeNull();fireEvent.change(screen.getByLabelText('Your experience'),{target:{value:'Great quality and fit'}});fireEvent.click(screen.getByText('Save review'));await waitFor(()=>expect(customerRequest).toHaveBeenCalledWith('/reviews/3',{rating:5,body:'Great quality and fit',version:0},'PUT'));
});
