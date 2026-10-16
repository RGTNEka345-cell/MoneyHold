
const Seller = require('../models/Seller');
const { readToken, hash } = require('../utils/sellerSession');
module.exports = async function sellerAuth(req, res, next) {
  try {
    const token = readToken(req);
    const seller = token && await Seller.session(hash(token));
    if (!seller) return res.status(401).json({ message: 'Please sign in to your seller account.' });
    req.seller = seller;
    next();
  } catch (error) { next(error); }
};
