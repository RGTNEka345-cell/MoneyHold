
const {pool}=require('../config/database');
const fail=(message,status=422)=>{throw Object.assign(new Error(message),{status});};
const id=value=>{if(!Number.isSafeInteger(Number(value))||Number(value)<1)fail('Invalid item.');return Number(value);};
function quantity(value){if(!Number.isInteger(value)||value<1||value>99)fail('Quantity must be a whole number between 1 and 99.');return value;}
async function read(customerId,connection=pool){
  const [rows]=await connection.execute(`SELECT i.id,i.variant_id,i.quantity,v.size,v.colour,v.stock,p.id product_id,p.name,p.price,p.is_active,
    (SELECT MIN(id) FROM product_images WHERE product_id=p.id) image_id
    FROM carts c JOIN cart_items i ON i.cart_id=c.id JOIN product_variants v ON v.id=i.variant_id JOIN products p ON p.id=v.product_id
    WHERE c.customer_id=? ORDER BY i.id DESC`,[customerId]);
  const items=rows.map(row=>{
    const priceCents=Math.round(Number(row.price)*100);
    const issue=!row.is_active?'This product is no longer available.':row.stock===0?'Out of stock.':row.quantity>row.stock?`Only ${row.stock} available. Reduce the quantity.`:null;
    return {...row,priceCents,lineTotalCents:priceCents*row.quantity,issue,image_id:row.is_active?row.image_id:null};
  });
  return {items,count:items.reduce((n,i)=>n+i.quantity,0),subtotalCents:items.reduce((n,i)=>n+i.lineTotalCents,0),hasUnavailableItems:items.some(i=>!!i.issue)};
}
async function change(customerId,action,itemId,value){
  if(action!=='remove')quantity(value);
  id(itemId);
  const c=await pool.getConnection();
  try{
    await c.beginTransaction();
    // Serialize all cart mutations for this customer, including first-time creation.
    await c.execute('SELECT id FROM customers WHERE id=? FOR UPDATE',[customerId]);
    await c.execute('INSERT IGNORE INTO carts (customer_id) VALUES (?)',[customerId]);
    const [carts]=await c.execute('SELECT id FROM carts WHERE customer_id=?',[customerId]);
    const cartId=carts[0].id;
    if(action==='remove'){
      const [result]=await c.execute('DELETE FROM cart_items WHERE id=? AND cart_id=?',[itemId,cartId]);
      if(!result.affectedRows)fail('Cart item not found.',404);
    }else{
      let variantId=itemId,existing;
      if(action==='update'){
        const [items]=await c.execute('SELECT * FROM cart_items WHERE id=? AND cart_id=?',[itemId,cartId]);
        existing=items[0];if(!existing)fail('Cart item not found.',404);variantId=existing.variant_id;
      }else{
        const [items]=await c.execute('SELECT * FROM cart_items WHERE cart_id=? AND variant_id=?',[cartId,variantId]);existing=items[0];
      }
      const [variants]=await c.execute('SELECT v.stock,p.is_active FROM product_variants v JOIN products p ON p.id=v.product_id WHERE v.id=? FOR UPDATE',[variantId]);
      const variant=variants[0];
      if(!variant||!variant.is_active)fail('This product is no longer available.',409);
      const desired=action==='add'?value+(existing?.quantity||0):value;
      if(desired>99)fail('Maximum 99 units per size/colour.',409);
      if(desired>variant.stock)fail(`Only ${variant.stock} units available for this size and colour.`,409);
      if(existing)await c.execute('UPDATE cart_items SET quantity=? WHERE id=?',[desired,existing.id]);
      else{
        const [counts]=await c.execute('SELECT COUNT(*) total FROM cart_items WHERE cart_id=?',[cartId]);
        if(counts[0].total>=100)fail('Your cart can contain at most 100 different variants.',409);
        await c.execute('INSERT INTO cart_items (cart_id,variant_id,quantity) VALUES (?,?,?)',[cartId,variantId,desired]);
      }
    }
    await c.commit();
  }catch(e){await c.rollback();throw e;}finally{c.release();}
}
module.exports={read,change};
