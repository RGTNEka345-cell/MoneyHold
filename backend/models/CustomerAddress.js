const {pool}=require('../config/database');
const {fail,digest}=require('../utils/checkoutValidation');
const validate=require('../utils/profileValidation');
const publicAddress=row=>({id:row.id,label:row.label,name:row.recipient_name,phone:row.phone,addressLine1:row.address_line1,addressLine2:row.address_line2,city:row.city,postalCode:row.postal_code,country:row.country,isDefault:!!row.is_default,version:row.version});
async function list(customerId,c=pool){const [rows]=await c.execute('SELECT * FROM customer_addresses WHERE customer_id=? ORDER BY is_default DESC,id',[customerId]);return rows.map(publicAddress);}
async function change(customerId,action,addressId,input={}){
  let data;
  if(action==='create'||action==='update')data=validate.address(input);
  if(action==='create'&&(typeof input.requestKey!=='string'||!/^[a-zA-Z0-9_-]{16,64}$/.test(input.requestKey)))fail('Invalid address request key.');
  if(action!=='create'){validate.id(addressId);validate.version(input?.version);}
  const c=await pool.getConnection();
  try{
    await c.beginTransaction();
    // Serialize all address operations, including first-address/default selection.
    const [customers]=await c.execute('SELECT id FROM customers WHERE id=? FOR UPDATE',[customerId]);if(!customers.length)fail('Account not found.',404);
    const [rows]=await c.execute('SELECT * FROM customer_addresses WHERE customer_id=? ORDER BY id',[customerId]);
    let target=rows.find(row=>row.id===Number(addressId));
    if(action!=='create'){
      if(!target)fail('Address not found.',404);
      if(target.version!==input.version)fail('This address changed in another session. Reload before making changes.',409);
    }
    if(action==='create'){
      const hash=digest(data),existing=rows.find(row=>row.creation_key===input.requestKey);
      if(existing){if(existing.creation_hash!==hash)fail('This request already saved an address. Reload before submitting again.',409);await c.commit();return {id:existing.id};}
      if(rows.length>=10)fail('You can save up to 10 addresses. Remove one before adding another.',409);
      const isDefault=!rows.length||data.isDefault;
      if(isDefault)await c.execute('UPDATE customer_addresses SET is_default=FALSE,version=version+1 WHERE customer_id=? AND is_default=TRUE',[customerId]);
      const [result]=await c.execute('INSERT INTO customer_addresses (customer_id,label,recipient_name,phone,address_line1,address_line2,city,postal_code,country,is_default,creation_key,creation_hash) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)',[customerId,data.label,data.name,data.phone,data.addressLine1,data.addressLine2,data.city,data.postalCode,data.country,isDefault,input.requestKey,hash]);
      addressId=result.insertId;
    }else if(action==='update'){
      const isDefault=!!target.is_default||data.isDefault;
      if(isDefault)await c.execute('UPDATE customer_addresses SET is_default=FALSE,version=version+1 WHERE customer_id=? AND is_default=TRUE AND id<>?',[customerId,addressId]);
      await c.execute('UPDATE customer_addresses SET label=?,recipient_name=?,phone=?,address_line1=?,address_line2=?,city=?,postal_code=?,country=?,is_default=?,version=version+1 WHERE id=? AND customer_id=?',[data.label,data.name,data.phone,data.addressLine1,data.addressLine2,data.city,data.postalCode,data.country,isDefault,addressId,customerId]);
    }else if(action==='default'){
      if(!target.is_default){
        await c.execute('UPDATE customer_addresses SET is_default=FALSE,version=version+1 WHERE customer_id=? AND is_default=TRUE',[customerId]);
        await c.execute('UPDATE customer_addresses SET is_default=TRUE,version=version+1 WHERE id=? AND customer_id=?',[addressId,customerId]);
      }
    }else if(action==='delete'){
      await c.execute('DELETE FROM customer_addresses WHERE id=? AND customer_id=?',[addressId,customerId]);
      const next=rows.find(row=>row.id!==target.id);
      if(target.is_default&&next)await c.execute('UPDATE customer_addresses SET is_default=TRUE,version=version+1 WHERE id=? AND customer_id=?',[next.id,customerId]);
    }else fail('Invalid address action.');
    await c.commit();return {id:Number(addressId)};
  }catch(e){await c.rollback();throw e;}finally{c.release();}
}
module.exports={list,change};
