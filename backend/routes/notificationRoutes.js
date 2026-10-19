
const router=require('express').Router();
const controller=require('../controllers/NotificationController');
router.get('/',controller.list);
router.get('/events',controller.stream);
router.patch('/:id/read',controller.read);
module.exports=router;
