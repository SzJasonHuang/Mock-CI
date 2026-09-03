const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

function getCart(req) {
  if (!req.session.cart) req.session.cart = {};
  return req.session.cart;
}

function cartDetails(cart) {
  const ids = Object.keys(cart).map(Number);
  if (ids.length === 0) return { items: [], totalCents: 0 };

  const placeholders = ids.map(() => '?').join(',');
  const products = db
    .prepare(`SELECT * FROM products WHERE id IN (${placeholders})`)
    .all(...ids);

  const items = products.map((p) => ({
    product: p,
    quantity: cart[p.id],
    subtotalCents: p.price_cents * cart[p.id]
  }));

  const totalCents = items.reduce((sum, i) => sum + i.subtotalCents, 0);
  return { items, totalCents };
}

router.get('/', (req, res) => {
  const products = db.prepare('SELECT * FROM products ORDER BY name').all();
  res.render('home', { title: 'Shop', products });
});

router.get('/products/:slug', (req, res) => {
  const product = db.prepare('SELECT * FROM products WHERE slug = ?').get(req.params.slug);
  if (!product) return res.status(404).render('404', { title: 'Not found' });
  res.render('product', { title: product.name, product, added: req.query.added === '1' });
});

router.post('/cart/add/:id', (req, res) => {
  const productId = Number(req.params.id);
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(productId);
  if (!product) return res.status(404).render('404', { title: 'Not found' });

  const cart = getCart(req);
  const qty = Math.max(1, parseInt(req.body.quantity, 10) || 1);
  cart[productId] = Math.min(product.stock, (cart[productId] || 0) + qty);

  res.redirect(`/products/${product.slug}?added=1`);
});

router.post('/cart/remove/:id', (req, res) => {
  const cart = getCart(req);
  delete cart[req.params.id];
  res.redirect('/cart');
});

router.get('/cart', (req, res) => {
  const { items, totalCents } = cartDetails(getCart(req));
  res.render('cart', { title: 'Cart', items, totalCents });
});

router.get('/checkout', requireAuth, (req, res) => {
  const { items, totalCents } = cartDetails(getCart(req));
  if (items.length === 0) return res.redirect('/cart');
  res.render('checkout', { title: 'Checkout', items, totalCents, error: null });
});

router.post('/checkout', requireAuth, (req, res) => {
  const cart = getCart(req);
  const { items, totalCents } = cartDetails(cart);
  if (items.length === 0) return res.redirect('/cart');

  const cardNumber = (req.body.cardNumber || '').replace(/\s+/g, '');
  const expiry = req.body.expiry || '';
  const cvc = req.body.cvc || '';

  if (!/^\d{12,19}$/.test(cardNumber) || !/^\d{2}\/\d{2}$/.test(expiry) || !/^\d{3,4}$/.test(cvc)) {
    return res.render('checkout', {
      title: 'Checkout',
      items,
      totalCents,
      error: 'Enter a card number, expiry (MM/YY), and CVC. This is a demo store — no real card is charged.'
    });
  }

  const createOrder = db.transaction(() => {
    const orderResult = db
      .prepare('INSERT INTO orders (user_id, total_cents, status) VALUES (?, ?, ?)')
      .run(req.session.user.id, totalCents, 'paid (demo)');

    const insertItem = db.prepare(
      'INSERT INTO order_items (order_id, product_id, quantity, unit_price_cents) VALUES (?, ?, ?, ?)'
    );
    for (const item of items) {
      insertItem.run(orderResult.lastInsertRowid, item.product.id, item.quantity, item.product.price_cents);
    }
    return orderResult.lastInsertRowid;
  });

  const orderId = createOrder();
  req.session.cart = {};
  res.redirect(`/orders/${orderId}`);
});

router.get('/orders/:id', requireAuth, (req, res) => {
  const order = db
    .prepare('SELECT * FROM orders WHERE id = ? AND user_id = ?')
    .get(req.params.id, req.session.user.id);
  if (!order) return res.status(404).render('404', { title: 'Not found' });

  const items = db
    .prepare(
      `SELECT oi.*, p.name, p.slug FROM order_items oi
       JOIN products p ON p.id = oi.product_id
       WHERE oi.order_id = ?`
    )
    .all(order.id);

  res.render('order-confirmation', { title: 'Order confirmed', order, items });
});

router.get('/account', requireAuth, (req, res) => {
  const orders = db
    .prepare('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC')
    .all(req.session.user.id);
  res.render('account', { title: 'My Account', orders });
});

module.exports = router;
