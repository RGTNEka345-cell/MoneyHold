
const router = require('express').Router();
const shop = require('../controllers/ShopController');
router.get('/events',shop.events);
router.get('/categories',shop.categories);
router.get('/products',shop.list);
router.get('/products/:id',shop.detail);
router.get('/products/:id/reviews',require('../controllers/EngagementController').reviews);
router.get('/images/:id',shop.image);
module.exports=router;
