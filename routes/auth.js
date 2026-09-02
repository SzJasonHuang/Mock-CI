const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db');

const router = express.Router();

router.get('/register', (req, res) => {
  res.render('register', { title: 'Sign up', error: null, name: '', email: '' });
});

router.post('/register', (req, res) => {
  const name = (req.body.name || '').trim();
  const email = (req.body.email || '').trim().toLowerCase();
  const password = req.body.password || '';

  if (!name || !email || password.length < 8) {
    return res.render('register', {
      title: 'Sign up',
      error: 'Please enter a name, a valid email, and a password of at least 8 characters.',
      name,
      email
    });
  }

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) {
    return res.render('register', {
      title: 'Sign up',
      error: 'An account with that email already exists.',
      name,
      email
    });
  }

  const passwordHash = bcrypt.hashSync(password, 10);
  const result = db
    .prepare('INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)')
    .run(name, email, passwordHash);

  req.session.user = { id: result.lastInsertRowid, name, email };
  res.redirect('/');
});

router.get('/login', (req, res) => {
  res.render('login', { title: 'Log in', error: null, email: '' });
});

router.post('/login', (req, res) => {
  const email = (req.body.email || '').trim().toLowerCase();
  const password = req.body.password || '';

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.render('login', { title: 'Log in', error: 'Invalid email or password.', email });
  }

  req.session.user = { id: user.id, name: user.name, email: user.email };
  const returnTo = req.session.returnTo || '/';
  delete req.session.returnTo;
  res.redirect(returnTo);
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/'));
});

module.exports = router;
