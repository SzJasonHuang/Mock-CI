const path = require('path');
const express = require('express');
const session = require('express-session');

const { attachUser } = require('./middleware/auth');
const authRoutes = require('./routes/auth');
const shopRoutes = require('./routes/shop');

require('./db'); // ensures schema exists on boot

const app = express();
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.locals.formatPrice = (cents) => `$${(cents / 100).toFixed(2)}`;

app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'gasguard-demo-secret-change-me',
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true, maxAge: 1000 * 60 * 60 * 4 }
  })
);
app.use(attachUser);

app.use('/', authRoutes);
app.use('/', shopRoutes);

app.use((_req, res) => res.status(404).render('404', { title: 'Not found' }));

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`GasGuard demo shop running at http://localhost:${PORT}`);
  });
}

module.exports = app;
