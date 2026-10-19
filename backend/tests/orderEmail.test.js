const {test}=require('node:test'),assert=require('node:assert/strict');
const {render}=require('../utils/orderEmail');
test('order email escapes all untrusted HTML and includes COD totals and delivery details',()=>{
  const mail=render({order_number:'MH-TEST',recipient_name:'<script>bad</script>',address_line1:'<b>Road</b>',city:'Colombo',subtotal_cents:10000,delivery_cents:35000,total_cents:45000,items:[{product_name:'<img src=x onerror=bad>',size:'M',colour:'Black',quantity:1,line_total_cents:10000}]},'placed');
  assert.ok(!mail.html.includes('<script>'));assert.ok(!mail.html.includes('<img src=x'));assert.ok(mail.html.includes('&lt;script&gt;'));assert.match(mail.text,/Cash on Delivery/);assert.match(mail.text,/450\.00/);
});
