
const router=require('express').Router();
const controller=require('../controllers/CartController');
router.use(require('../middlewares/customerAuth'));
router.get('/',controller.get);
router.get('/events',controller.events);
router.post('/items',controller.change('add'));
router.patch('/items/:id',controller.change('update'));
router.delete('/items/:id',controller.change('remove'));
module.exports=router;
