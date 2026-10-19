
const router = require('express').Router();
const { rateLimit } = require('express-rate-limit');
const controller = require('../controllers/SellerController');
const sellerAuth = require('../middlewares/sellerAuth');
router.use((req, res, next) => {
  res.set('Cache-Control', 'no-store');
  if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    const origins = (process.env.CLIENT_URL || 'http://localhost:3000').split(',').map(x => x.trim());
    if (!origins.includes(req.get('Origin'))) return res.status(403).json({ message: 'Request origin is not allowed.' });
  }
  next();
});
router.post('/login', rateLimit({ windowMs: 15 * 60000, limit: 10, standardHeaders: true, legacyHeaders: false, message: { message: 'Too many login attempts. Try again in 15 minutes.' } }), controller.login);
router.get('/me', sellerAuth, controller.me);
router.get('/dashboard', sellerAuth, (req, res) => res.json({ seller: req.seller, modules: [
  { name: 'Products', description: 'Add and edit products in Catalog & stock.' },
  { name: 'Orders', description: 'Review COD orders and manage fulfilment in Orders.' },
  { name: 'Inventory', description: 'Manage stock for each size and colour in Catalog & stock.' }
] }));
router.post('/logout', controller.logout);
const catalog = require('../controllers/CatalogController');
const uploadProductImages = require('../middlewares/uploadProductImages');
router.use(sellerAuth);
router.use('/notifications',require('./notificationRoutes'));
const orders=require('../controllers/OrderController');
router.get('/orders/events',orders.stream);
router.get('/orders',orders.sellerList);
router.get('/orders/:id',orders.sellerDetail);
router.patch('/orders/:id/status',orders.status);
router.patch('/orders/:id/tracking',orders.tracking);
router.get('/catalog/events', catalog.events);
router.get('/categories', catalog.categories);
router.post('/categories', catalog.saveCategory);
router.put('/categories/:id', catalog.saveCategory);
router.get('/products', catalog.products);
router.post('/products', uploadProductImages, catalog.saveProduct);
router.put('/products/:id', uploadProductImages, catalog.saveProduct);
router.patch('/products/:id/variants/:variantId/stock', catalog.stock);
router.get('/images/:id', catalog.image);
module.exports = router;
