const {fail}=require('./checkoutValidation');
function field(value,label,max){if(typeof value!=='string'||!value.trim()||value.trim().length>max||/[\x00-\x1f\x7f]/.test(value))fail(`Enter a valid ${label}.`);return value.trim();}
module.exports=input=>{
  const courierName=field(input?.courierName,'courier name',100),trackingNumber=field(input?.trackingNumber,'tracking number',120);
  if(!Number.isSafeInteger(input.version)||input.version<0)fail('Reload the order before saving tracking details.');
  // Empty strings are compatible with the existing NOT NULL database column.
  if(input.trackingUrl==null||(typeof input.trackingUrl==='string'&&!input.trackingUrl.trim()))return {courierName,trackingNumber,trackingUrl:'',version:input.version};
  const trackingUrl=field(input.trackingUrl,'tracking URL',1000);
  let url;try{url=new URL(trackingUrl);}catch{fail('Enter the courier’s full HTTPS tracking URL.');}
  if(url.protocol!=='https:'||url.username||url.password||url.port||require('net').isIP(url.hostname)||!/^([a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}$/i.test(url.hostname)||/\.(local|localhost|internal|test|invalid)$/i.test(url.hostname))fail('Use a public HTTPS courier URL without a username, password or custom port.');
  if(url.href.length>1000)fail('Tracking URL is too long.');
  if(!Number.isSafeInteger(input.version)||input.version<0)fail('Reload the order before saving tracking details.');
  return {courierName,trackingNumber,trackingUrl:url.href,version:input.version};
};
