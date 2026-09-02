const db = require('./index');
const { seedProducts } = require('./products');

const count = seedProducts(db);
console.log(`Seeded ${count} products.`);
