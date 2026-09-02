const PRODUCTS = [
  {
    name: 'SentryOne CO Detector',
    slug: 'sentryone-co-detector',
    tagline: 'Single-gas carbon monoxide detector for home use',
    description: 'Battery-powered plug-in detector that continuously monitors for carbon monoxide and sounds an 85dB alarm when levels become dangerous. Digital display shows real-time ppm readings.',
    price_cents: 2999,
    stock: 42,
    icon: 'co'
  },
  {
    name: 'QuadSense 4-Gas Monitor',
    slug: 'quadsense-4-gas-monitor',
    tagline: 'Portable multi-gas monitor: O2 / LEL / H2S / CO',
    description: 'Rugged handheld monitor for confined-space entry work. Tracks oxygen, combustible gas (LEL), hydrogen sulfide, and carbon monoxide simultaneously with visual, audible, and vibration alarms.',
    price_cents: 45900,
    stock: 15,
    icon: 'quad'
  },
  {
    name: 'LeakFinder Natural Gas Sniffer',
    slug: 'leakfinder-natural-gas-sniffer',
    tagline: 'Combustible gas leak detector with flexible probe',
    description: 'Handheld sniffer for locating natural gas and propane leaks around pipe fittings, appliances, and meters. Flexible gooseneck probe reaches tight spaces, with adjustable sensitivity and LED bar-graph readout.',
    price_cents: 8900,
    stock: 30,
    icon: 'leak'
  },
  {
    name: 'H2S Guard Personal Monitor',
    slug: 'h2s-guard-personal-monitor',
    tagline: 'Clip-on single-gas H2S monitor for field workers',
    description: 'Compact, clip-on personal monitor for hydrogen sulfide exposure. Simple one-button operation, loud alarm, and a long-life sensor rated for two years of continuous use.',
    price_cents: 12900,
    stock: 60,
    icon: 'h2s'
  },
  {
    name: 'FixedPoint Industrial Gas Sensor',
    slug: 'fixedpoint-industrial-gas-sensor',
    tagline: 'Wall-mounted fixed gas detection for facilities',
    description: 'Hardwired fixed-point detector for continuous area monitoring in industrial facilities. Relay outputs integrate with building alarm systems; interchangeable sensor cartridges support multiple gas types.',
    price_cents: 21500,
    stock: 20,
    icon: 'fixed'
  },
  {
    name: 'AeroCheck LEL Combustible Detector',
    slug: 'aerocheck-lel-combustible-detector',
    tagline: 'Compact combustible gas detector for tanks and vessels',
    description: 'Intrinsically safe detector for measuring lower explosive limit (LEL) concentrations before confined-space entry. Includes calibration cap and carrying case.',
    price_cents: 32900,
    stock: 18,
    icon: 'lel'
  }
];

function seedProducts(db) {
  const insert = db.prepare(`
    INSERT INTO products (name, slug, tagline, description, price_cents, stock, icon)
    VALUES (@name, @slug, @tagline, @description, @price_cents, @stock, @icon)
    ON CONFLICT(slug) DO UPDATE SET
      name=excluded.name, tagline=excluded.tagline, description=excluded.description,
      price_cents=excluded.price_cents, stock=excluded.stock, icon=excluded.icon
  `);

  const seedAll = db.transaction((items) => {
    for (const item of items) insert.run(item);
  });

  seedAll(PRODUCTS);
  return PRODUCTS.length;
}

module.exports = { PRODUCTS, seedProducts };
