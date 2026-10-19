const escape=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const money=cents=>new Intl.NumberFormat('en-LK',{style:'currency',currency:'LKR'}).format(Number(cents)/100);
function render(order,status){
  const title=status==='placed'?'Order confirmation':`Order update: ${status}`;
  const lines=order.items.map(item=>`${item.product_name} — ${item.size} / ${item.colour} × ${item.quantity}: ${money(item.line_total_cents)}`);
  const address=[order.recipient_name,order.address_line1,order.address_line2,order.city,order.postal_code,'Sri Lanka'].filter(Boolean).join(', ');
  const text=[title,order.order_number,`Recorded update: ${status}`,`Current status when this email was prepared: ${order.status||status}`,...lines,`Subtotal: ${money(order.subtotal_cents)}`,`Delivery: ${money(order.delivery_cents)}`,`Total: ${money(order.total_cents)}`,`Delivery to: ${address}`,order.status==='cancelled'||status==='cancelled'?'This order has been cancelled.':'Payment method: Cash on Delivery. No online payment was collected.','Check My Orders on Money Hold for the latest status.'].join('\n');
  return {subject:`Money Hold | ${order.order_number} | ${status}`,text,html:`<div style="background:#f7f5ef;padding:32px;font-family:Arial,sans-serif;color:#24221c"><div style="max-width:600px;margin:auto;background:#fffdf8;padding:28px;border:1px solid #d7c8a9"><p style="color:#8a6a2f;letter-spacing:3px">MONEY HOLD</p><h1 style="font-size:24px">${escape(title)}</h1><p>${escape(order.order_number)}</p><pre style="white-space:pre-wrap;font:14px/1.8 Arial,sans-serif">${escape(text)}</pre></div></div>`};
}
module.exports={render};
