
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
  { name: 'Products', description: 'Product management is coming next.' },
  { name: 'Orders', description: 'Order management is not available yet.' },
  { name: 'Inventory', description: 'Size, colour and stock management is coming soon.' }
] }));
router.post('/logout', controller.logout);
module.exports = router;
