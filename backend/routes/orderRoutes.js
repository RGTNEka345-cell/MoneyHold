
const router=require('express').Router();
const controller=require('../controllers/OrderController');
const {rateLimit}=require('express-rate-limit');
router.use(require('../middlewares/customerAuth'));
router.get('/quote',controller.quote);
router.get('/events',controller.stream);
router.get('/request/:key',controller.findRequest);
router.get('/',controller.list);
router.post('/',rateLimit({windowMs:60000,limit:15,standardHeaders:true,legacyHeaders:false,message:{message:'Too many checkout attempts. Wait a minute and retry.'}}),controller.place);
router.get('/:id',controller.detail);
router.post('/:id/returns',rateLimit({windowMs:60000,limit:10,standardHeaders:true,legacyHeaders:false,message:{message:'Too many requests. Please wait a minute.'}}),require('../controllers/ReturnController').create);
module.exports=router;
