
const router=require('express').Router();
const {rateLimit}=require('express-rate-limit');
const controller=require('../controllers/CustomerController');
router.use(require('../middlewares/customerOrigin'));
router.post('/login',rateLimit({windowMs:15*60000,limit:10,standardHeaders:true,legacyHeaders:false,message:{message:'Too many login attempts. Please try again in 15 minutes.'}}),controller.login);
router.get('/me',require('../middlewares/customerAuth'),controller.me);
router.post('/logout',controller.logout);
router.use('/cart',require('./cartRoutes'));
router.use('/orders',require('./orderRoutes'));
router.use('/notifications',require('../middlewares/customerAuth'),require('./notificationRoutes'));
module.exports=router;
