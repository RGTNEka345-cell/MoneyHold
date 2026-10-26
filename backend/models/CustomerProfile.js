const {pool}=require('../config/database');
const {publicCustomer}=require('../utils/customerSession');
const {digest,fail}=require('../utils/checkoutValidation');
const validate=require('../utils/profileValidation');
const fields='id,first_name,last_name,email,phone';
const response=row=>{const customer=publicCustomer(row);return {customer,version:digest(customer)};};
async function read(customerId){const [rows]=await pool.execute(`SELECT ${fields} FROM customers WHERE id=?`,[customerId]);if(!rows.length)fail('Account not found.',404);return response(rows[0]);}
async function update(customerId,input){
  const data=validate.profile(input),c=await pool.getConnection();
  try{
    await c.beginTransaction();const [rows]=await c.execute(`SELECT ${fields} FROM customers WHERE id=? FOR UPDATE`,[customerId]);if(!rows.length)fail('Account not found.',404);
    if(response(rows[0]).version!==data.version)fail('Your profile changed in another session. Reload before saving.',409);
    await c.execute('UPDATE customers SET first_name=?,last_name=?,phone=? WHERE id=?',[data.firstName,data.lastName,data.phone,customerId]);
    const result=response({...rows[0],first_name:data.firstName,last_name:data.lastName,phone:data.phone});await c.commit();return result;
  }catch(e){await c.rollback();if(e.code==='ER_DUP_ENTRY')fail('This phone number is already in use.',409);throw e;}finally{c.release();}
}
module.exports={read,update};
