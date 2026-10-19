const {test}=require('node:test'),assert=require('node:assert/strict');
const validate=require('../utils/trackingValidation');
const valid={courierName:'Courier',trackingNumber:'ABC-123',trackingUrl:'https://courier.example.com/track/ABC-123',version:0};
test('tracking URL may be omitted but courier, reference and version remain required',()=>{
  for(const trackingUrl of [undefined,null,'','   '])assert.equal(validate({...valid,trackingUrl}).trackingUrl,'');
  assert.throws(()=>validate({...valid,trackingUrl:'',version:undefined}));
  assert.throws(()=>validate({...valid,trackingUrl:'',trackingNumber:''}));
});
test('tracking requires complete fields, safe HTTPS URL and version',()=>{
  assert.equal(validate(valid).trackingNumber,'ABC-123');
  for(const trackingUrl of ['javascript:alert(1)','http://courier.example.com','https://user:pass@courier.example.com','https://127.0.0.1','https://localhost','https://machine.local','https://courier.example.com:444','not-a-url'])assert.throws(()=>validate({...valid,trackingUrl}));
  for(const input of [{...valid,courierName:''},{...valid,trackingNumber:'x'.repeat(121)},{...valid,version:-1},{...valid,version:undefined}])assert.throws(()=>validate(input));
});
