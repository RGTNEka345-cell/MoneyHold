const {fail,delivery}=require('./checkoutValidation');
function text(value,label,max,min=1){if(typeof value!=='string'||value.trim().length<min||value.trim().length>max||/[\x00-\x1f\x7f]/.test(value))fail(`Enter a valid ${label} (${min}–${max} characters).`);return value.trim();}
function profile(input={}){
  if(!input||typeof input!=='object')fail('Invalid profile.');
  for(const key of Object.keys(input))if(!['firstName','lastName','phone','version'].includes(key))fail('Only name and phone can be edited here.');
  const firstName=text(input.firstName,'first name',60,2),lastName=text(input.lastName,'last name',60,2),phone=text(input.phone,'phone number',20).replace(/[\s-]/g,'');
  if(!/^\+?\d{8,19}$/.test(phone))fail('Enter a valid phone number.');
  if(typeof input.version!=='string'||!/^[a-f0-9]{64}$/.test(input.version))fail('Reload your profile before saving.');
  return {firstName,lastName,phone,version:input.version};
}
function address(input={}){
  if(!input||typeof input!=='object')fail('Invalid address.');
  const label=text(input.label,'address label',40);
  if(typeof input.isDefault!=='boolean')fail('Choose whether this is your default address.');
  return {...delivery(input),label,isDefault:input.isDefault};
}
function version(value){if(!Number.isSafeInteger(value)||value<1)fail('Reload the address before making changes.');return value;}
function id(value){if(!/^\d+$/.test(String(value))||!Number.isSafeInteger(Number(value))||Number(value)<1)fail('Address not found.',404);return Number(value);}
module.exports={profile,address,version,id};
