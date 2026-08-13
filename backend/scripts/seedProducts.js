const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');

// Load backend/.env
dotenv.config({
  path: path.join(__dirname, '../.env')
});

// ===================================================
// BLUEPEAK MART - 500 PRODUCT SEEDER
// ===================================================

const categoryCounts = [
  { prefix: 'GRC', category: 'Grocery & Food', count: 150 },
  { prefix: 'BEV', category: 'Beverages', count: 50 },
  { prefix: 'PC', category: 'Personal Care', count: 60 },
  { prefix: 'HMC', category: 'Home & Cleaning', count: 60 },
  { prefix: 'STA', category: 'Stationery', count: 70 },
  { prefix: 'SNK', category: 'Snacks & Chocolates', count: 40 },
  { prefix: 'BAB', category: 'Baby Care', count: 25 },
  { prefix: 'ELE', category: 'Electronics & Accessories', count: 20 },
  { prefix: 'KTC', category: 'Kitchen & Household', count: 25 }
];

// ===================================================
// PRODUCT TEMPLATES
// ===================================================

const templates = {
  'Grocery & Food': [
    { name: 'Aashirvaad Whole Wheat Atta', pack: ['1kg', '5kg', '10kg'], price: [65, 290, 560], gst: 5 },
    { name: 'Fortune Sunlite Sunflower Oil', pack: ['1L', '5L Jar'], price: [145, 720], gst: 5 },
    { name: 'Tata Salt Vacuum Evaporated', pack: ['1kg Pouch'], price: [28], gst: 0 },
    { name: 'India Gate Basmati Rice Feast', pack: ['1kg', '5kg Bag'], price: [120, 580], gst: 5 },
    { name: 'Sona Masoori Rice Raw', pack: ['5kg', '25kg Bag'], price: [310, 1450], gst: 5 },
    { name: 'Tata Sampann Toor Dal', pack: ['500g', '1kg'], price: [85, 165], gst: 0 },
    { name: 'Organic Moong Dal Yellow Split', pack: ['500g', '1kg'], price: [75, 140], gst: 0 },
    { name: 'Unpolished Chana Dal Premium', pack: ['500g', '1kg'], price: [55, 105], gst: 0 },
    { name: 'Loose Premium Sugar Crystal', pack: ['1kg', '5kg Bag'], price: [46, 225], gst: 5 },
    { name: 'Everest Turmeric Powder', pack: ['100g', '200g'], price: [35, 68], gst: 5 },
    { name: 'Achi Chilli Powder Spices', pack: ['100g', '250g'], price: [42, 98], gst: 5 },
    { name: 'MTR Coriander Powder', pack: ['100g', '200g'], price: [38, 72], gst: 5 },
    { name: 'Everest Garam Masala Powder', pack: ['50g', '100g'], price: [48, 92], gst: 5 },
    { name: 'Brooke Bond Red Label Tea', pack: ['250g', '500g Box'], price: [145, 280], gst: 5 },
    { name: 'Tata Tea Gold Leaf', pack: ['250g', '500g Pack'], price: [160, 315], gst: 5 },
    { name: 'Nescafe Classic Instant Coffee', pack: ['50g Glass Jar', '100g Jar'], price: [175, 340], gst: 12 },
    { name: 'Bru Instant Coffee Blend', pack: ['50g Pouch', '100g Pouch'], price: [115, 220], gst: 12 },
    { name: 'Amul Pasteurised Butter', pack: ['100g Block', '500g Block'], price: [58, 275], gst: 12 },
    { name: 'Aavin Toned Milk Blue', pack: ['500ml Pouch', '1L Pouch'], price: [24, 46], gst: 0 },
    { name: 'Milky Mist Premium Curd', pack: ['200g Cup', '500g Pouch'], price: [25, 45], gst: 0 },
    { name: 'Britannia White Sandwich Bread', pack: ['400g Pack'], price: [45], gst: 0 },
    { name: 'Modern Brown Wheat Bread', pack: ['400g Pack'], price: [50], gst: 0 },
    { name: 'Maggi 2-Minute Masala Noodles', pack: ['4-Pack 280g', '12-Pack Family'], price: [56, 168], gst: 12 },
    { name: 'Top Ramen Curry Noodles', pack: ['Single 70g', '4-Pack'], price: [15, 58], gst: 12 },
    { name: 'Kissan Fresh Tomato Ketchup', pack: ['500g Bottle', '1kg Squeezy'], price: [85, 150], gst: 12 }
  ],

  'Beverages': [
    { name: 'Coca-Cola Soft Drink', pack: ['250ml Can', '750ml Bottle', '2L Bottle'], price: [40, 45, 95], gst: 18 },
    { name: 'Pepsi Carbonated Soft Drink', pack: ['250ml Can', '750ml Bottle', '2L Bottle'], price: [40, 45, 90], gst: 18 },
    { name: 'Sprite Lemon-Lime Drink', pack: ['250ml Can', '750ml Bottle', '1.5L Bottle'], price: [40, 45, 80], gst: 18 },
    { name: 'Thums Up Charged Beverage', pack: ['250ml Can', '750ml Bottle'], price: [40, 45], gst: 18 },
    { name: 'Real Fruit Power Mango Juice', pack: ['200ml Tetra', '1L Carton'], price: [25, 110], gst: 12 },
    { name: 'Tropicana 100% Orange Juice', pack: ['200ml Tetra', '1L Carton'], price: [30, 135], gst: 12 },
    { name: 'Frooti Mango Drink Pet', pack: ['125ml Pack', '600ml Bottle', '1.2L Bottle'], price: [10, 40, 75], gst: 12 },
    { name: 'Maaza Mango Fruit Drink', pack: ['250ml Pet', '600ml Bottle', '1.2L Bottle'], price: [20, 40, 75], gst: 12 },
    { name: 'Bisleri Mineral Water Bottle', pack: ['500ml', '1L Bottle', '2L Bottle', '5L Jar'], price: [10, 20, 30, 70], gst: 18 },
    { name: 'Kinley Packaged Drinking Water', pack: ['1L Bottle', '2L Bottle'], price: [20, 30], gst: 18 },
    { name: 'Red Bull Energy Drink', pack: ['250ml Can'], price: [125], gst: 18 },
    { name: 'Paper Boat Aamras Juice', pack: ['200ml Pouch'], price: [35], gst: 12 }
  ],

  'Personal Care': [
    { name: 'Dettol Original Bathing Soap', pack: ['75g', '125g', '3x125g Multipack'], price: [38, 62, 175], gst: 18 },
    { name: 'Dove Cream Beauty Bar Soap', pack: ['75g', '100g', '3x100g Pack'], price: [52, 78, 220], gst: 18 },
    { name: 'Pears Soft & Fresh Soap', pack: ['75g', '125g'], price: [48, 82], gst: 18 },
    { name: 'Lifebuoy Total 10 Soap', pack: ['100g', '125g'], price: [32, 45], gst: 18 },
    { name: 'Santoor Sandal & Turmeric Soap', pack: ['100g', '4x100g Pack'], price: [38, 140], gst: 18 },
    { name: 'Clinic Plus Strong Hair Shampoo', pack: ['80ml', '175ml', '340ml Bottle'], price: [55, 115, 210], gst: 18 },
    { name: 'Head & Shoulders Anti-Dandruff', pack: ['180ml', '360ml Bottle'], price: [165, 320], gst: 18 },
    { name: 'Pantene Hairfall Control Shampoo', pack: ['180ml', '340ml Bottle'], price: [150, 290], gst: 18 },
    { name: 'Colgate Strong Teeth Toothpaste', pack: ['100g Tube', '200g Saver Pack'], price: [62, 115], gst: 18 },
    { name: 'Sensodyne Fresh Mint Toothpaste', pack: ['75g Tube', '150g Tube'], price: [130, 240], gst: 18 },
    { name: 'Oral-B Cavity Defense Toothbrush', pack: ['Single Soft', 'Buy 2 Get 1 Free'], price: [30, 75], gst: 18 },
    { name: 'Himalaya Purifying Neem Face Wash', pack: ['50ml', '100ml', '150ml Tube'], price: [75, 140, 195], gst: 18 },
    { name: 'Nivea Soft Refreshing Moisturizer', pack: ['100ml Cream Tub', '200ml Tub'], price: [180, 310], gst: 18 },
    { name: 'Gillette Mach3 Turbo Razor', pack: ['1 Razor + 1 Cartridge'], price: [350], gst: 18 }
  ],

  'Home & Cleaning': [
    { name: 'Surf Excel Easy Wash Detergent', pack: ['500g', '1kg Powder', '3kg Box'], price: [72, 140, 390], gst: 18 },
    { name: 'Ariel Matic Front Load Detergent', pack: ['1kg Powder', '2kg Box'], price: [265, 510], gst: 18 },
    { name: 'Rin Detergent Bar Soap', pack: ['110g Bar', '4x110g Pack'], price: [15, 58], gst: 18 },
    { name: 'Vim Dishwash Gel Liquid', pack: ['155ml Bottle', '250ml Bottle', '750ml Refill'], price: [35, 60, 155], gst: 18 },
    { name: 'Vim Dishwash Bar Soap', pack: ['100g Bar', '200g Bar + Tub'], price: [10, 22], gst: 18 },
    { name: 'Lizol Disinfectant Floor Cleaner', pack: ['200ml Citrus', '500ml Floral', '1L Lavender'], price: [45, 105, 195], gst: 18 },
    { name: 'Harpic Power Plus Toilet Cleaner', pack: ['200ml Original', '500ml', '1L Bottle'], price: [42, 95, 185], gst: 18 },
    { name: 'Colin Glass Cleaner Spray', pack: ['250ml Spray', '500ml Spray'], price: [65, 110], gst: 18 },
    { name: 'Comfort After Wash Fabric Conditioner', pack: ['220ml Bottle', '860ml Bottle'], price: [60, 225], gst: 18 },
    { name: 'Goodknight Gold Flash Mosquito Liquid', pack: ['Single Refill', 'Machine + Refill'], price: [82, 135], gst: 18 },
    { name: 'Odonil Bathroom Air Freshener', pack: ['50g Citrus', '75g Jasmine'], price: [38, 55], gst: 18 },
    { name: 'Scotch-Brite Scrub Pad Sponge', pack: ['Single Pad', 'Buy 3 Get 1 Pack'], price: [15, 45], gst: 18 }
  ],

  'Stationery': [
    { name: 'Classmate Notebook Long Book A4', pack: ['140 Pages Ruled', '172 Pages Ruled', '240 Pages'], price: [55, 65, 90], gst: 12 },
    { name: 'Classmate Spiral Bound Note Pad', pack: ['200 Pages A4', '300 Pages A4'], price: [120, 175], gst: 12 },
    { name: 'Reynolds 045 Fine Carbide Ball Pen', pack: ['Single Blue', 'Single Black', 'Box of 10'], price: [10, 10, 95], gst: 12 },
    { name: 'Cello Geltech Gel Pen', pack: ['Blue Ink', 'Black Ink', 'Set of 5'], price: [15, 15, 70], gst: 12 },
    { name: 'Apsara Platinum Extra Dark Pencil', pack: ['Single Pencil', 'Box of 10 Pencils'], price: [7, 65], gst: 12 },
    { name: 'Camel Kokuyo Oil Pastels', pack: ['12 Shades', '25 Shades', '50 Shades'], price: [45, 95, 210], gst: 12 },
    { name: 'JK Copier A4 Paper 75 GSM', pack: ['100 Sheets Pack', '500 Sheets Ream'], price: [95, 340], gst: 12 },
    { name: 'Fevicol MR Squeezy Glue', pack: ['22.5g Bottle', '50g Bottle', '100g Bottle'], price: [10, 25, 45], gst: 12 },
    { name: 'Fevistick Glue Stick Glue', pack: ['8g Stick', '15g Stick'], price: [15, 30], gst: 12 },
    { name: 'Camel Student Acrylic Colors', pack: ['6 Shades Set', '12 Shades Set'], price: [110, 215], gst: 12 },
    { name: 'Faber-Castell Triangular Colour Pencils', pack: ['12 Shades Pack', '24 Shades Pack'], price: [75, 145], gst: 12 },
    { name: 'Kangaroo Heavy Duty Stapler HD-10', pack: ['Single Stapler', 'Stapler + Pin Box'], price: [65, 85], gst: 12 },
    { name: 'Natraj Eraser Dust Free Clean', pack: ['Pack of 5 Erasers', 'Pack of 20'], price: [25, 90], gst: 12 },
    { name: 'Camlin Geometry Box Exam Set', pack: ['Scholar Box', 'Exam Metal Box'], price: [95, 160], gst: 12 }
  ],

  'Snacks & Chocolates': [
    { name: 'Cadbury Dairy Milk Silk Chocolate', pack: ['60g Bar', '150g Bar'], price: [80, 175], gst: 18 },
    { name: 'Cadbury Dairy Milk Fruit & Nut', pack: ['36g Bar', '80g Bar'], price: [45, 95], gst: 18 },
    { name: 'KitKat 4-Finger Crisp Wafer', pack: ['38g Bar', '57g Share Bag'], price: [30, 60], gst: 18 },
    { name: '5 Star Crunchy Chocolate Bar', pack: ['22g Bar', '40g Bar'], price: [15, 30], gst: 18 },
    { name: 'Lays Magic Masala Potato Chips', pack: ['30g Bag', '50g Bag', '90g Party Pack'], price: [10, 20, 40], gst: 12 },
    { name: 'Kurkure Masala Munch Crunchy Snack', pack: ['35g Bag', '85g Bag'], price: [10, 20], gst: 12 },
    { name: 'Bingo Mad Angles Cream & Onion', pack: ['40g Bag', '80g Bag'], price: [10, 20], gst: 12 },
    { name: 'Britannia Good Day Butter Biscuits', pack: ['100g Pack', '200g Pack'], price: [25, 45], gst: 18 },
    { name: 'Parle-G Gold Glucose Biscuits', pack: ['250g Family Pack', '800g Super Saver'], price: [30, 95], gst: 18 },
    { name: 'Sunfeast Dark Fantasy Choco Fills', pack: ['75g Pack', '300g Box'], price: [40, 150], gst: 18 },
    { name: 'Haldirams Nagpur Bhujia Sev', pack: ['150g Pouch', '350g Pack'], price: [45, 110], gst: 12 },
    { name: 'Haldirams Khatta Meetha Mixture', pack: ['150g Pouch', '350g Pack'], price: [45, 110], gst: 12 }
  ],

  'Baby Care': [
    { name: 'Pampers All Round Protection Diapers', pack: ['Small 10s', 'Medium 20s', 'Large 42s'], price: [140, 290, 650], gst: 12 },
    { name: 'Huggies Wonder Pants Diaper', pack: ['Small 12s', 'Medium 24s', 'Large 38s'], price: [155, 310, 590], gst: 12 },
    { name: 'Himalaya Gentle Baby Wipes', pack: ['72 Wipes Pack', '2x72 Wipes Saver'], price: [175, 320], gst: 12 },
    { name: 'Johnson Baby Powder Gentle', pack: ['100g Bottle', '200g Bottle'], price: [115, 210], gst: 18 },
    { name: 'Johnson Baby Soap Extra Mild', pack: ['75g Soap', '3x75g Pack'], price: [55, 155], gst: 18 },
    { name: 'Himalaya Baby Massage Oil', pack: ['100ml Bottle', '200ml Bottle'], price: [120, 225], gst: 12 },
    { name: 'Nestle Cerelac Wheat Apple Cereal', pack: ['300g Box Stage 1', '300g Stage 2'], price: [230, 255], gst: 18 }
  ],

  'Electronics & Accessories': [
    { name: 'Philips 9W LED Base B22 Bulb White', pack: ['Single Pack', 'Pack of 2 Bulbs'], price: [99, 185], gst: 18 },
    { name: 'Philips 12W LED Cool Day Bulb', pack: ['Single Pack'], price: [135], gst: 18 },
    { name: 'Duracell Ultra AA Alkaline Battery', pack: ['Pack of 2', 'Pack of 6'], price: [95, 260], gst: 18 },
    { name: 'Duracell AAA Alkaline Pencil Cell', pack: ['Pack of 2', 'Pack of 4'], price: [95, 180], gst: 18 },
    { name: 'boAt BassHeads 100 Wired Earphones', pack: ['Black Color', 'Blue Color'], price: [399, 399], gst: 18 },
    { name: 'Mi 10000mAh Power Bank 3i Fast Charge', pack: ['Black Metal Body'], price: [1199], gst: 18 },
    { name: 'Portronics Braided USB-C Fast Cable', pack: ['1 Meter Cable', '2 Meter Cable'], price: [199, 299], gst: 18 },
    { name: 'Syska 3-Socket Surge Protector Extension', pack: ['1.5m Cord Strip'], price: [449], gst: 18 },
    { name: 'SanDisk Cruzer Blade 32GB USB Flash', pack: ['32GB Pen Drive', '64GB Pen Drive'], price: [369, 549], gst: 18 }
  ],

  'Kitchen & Household': [
    { name: 'Milton Thermosteel Water Bottle', pack: ['500ml Flask', '750ml Flask', '1L Flask'], price: [650, 820, 990], gst: 18 },
    { name: 'Cello Checkers PET Plastic Container', pack: ['Set of 3 (1000ml)', 'Set of 6 Container'], price: [280, 520], gst: 18 },
    { name: 'Wonderchef Royal Velvet Non-Stick Pan', pack: ['24cm Fry Pan', '28cm Fry Pan'], price: [799, 1150], gst: 18 },
    { name: 'Hawkins Contura Pressure Cooker 3L', pack: ['3 Litre Aluminum', '5 Litre Stainless'], price: [1250, 2100], gst: 12 },
    { name: 'Borosil Glass Food Storage Tiffin Box', pack: ['2 Container Set', '3 Container Set'], price: [690, 950], gst: 18 },
    { name: 'Butterfly Stainless Steel Gas Lighter', pack: ['Single Lighter'], price: [120], gst: 18 }
  ]
};

// ===================================================
// GENERATE EXACTLY 500 PRODUCTS
// ===================================================

function generate500Products() {
  const products = [];
  let barcodeCounter = 8901234000001;

  categoryCounts.forEach(({ prefix, category, count }) => {
    const list = templates[category];

    for (let i = 1; i <= count; i++) {
      const skuNumber = String(i).padStart(4, '0');

      const sku = `BPM-${prefix}-${skuNumber}`;
      const barcode = String(barcodeCounter++);

      const tmpl = list[(i - 1) % list.length];

      const packName = tmpl.pack[(i - 1) % tmpl.pack.length];

      const price =
        tmpl.price[(i - 1) % tmpl.price.length] ||
        tmpl.price[0];

      const gst = tmpl.gst;

      const fullname = `${tmpl.name} ${packName}`;

      let stock;

      if (i % 15 === 0) {
        stock = 0;
      } else if (i % 7 === 0) {
        stock = Math.floor(Math.random() * 12) + 2;
      } else if (i % 3 === 0) {
        stock = Math.floor(Math.random() * 30) + 20;
      } else {
        stock = Math.floor(Math.random() * 150) + 50;
      }

      products.push({
        name: fullname,
        category,
        sku,
        barcode,
        price: Number(price).toFixed(2),
        gst_percent: Number(gst).toFixed(2),
        stock
      });
    }
  });

  return products;
}

// ===================================================
// DATABASE SEED FUNCTION
// ===================================================

async function seedDatabase() {

  console.log('===================================================');
  console.log(' Starting BluePeak Mart 500 Product Database Seed');
  console.log('===================================================');

  const host = process.env.DB_HOST || 'localhost';
  const port = parseInt(process.env.DB_PORT || '3306', 10);
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || '';
  const database = process.env.DB_NAME || 'billing_db';

  let connection;

  try {

    console.log(`Connecting to MySQL database: ${database}`);
    console.log(`Host: ${host}`);
    console.log(`Port: ${port}`);
    console.log(`User: ${user}`);

    // =================================================
    // AIVEN SSL CONNECTION
    // =================================================

    const connectionConfig = {
      host,
      port,
      user,
      password,
      database,

      ssl: {
        rejectUnauthorized: false
      }
    };

    connection = await mysql.createConnection(connectionConfig);

    console.log('✔ MySQL connection successful');

    // =================================================
    // CREATE PRODUCTS TABLE AUTOMATICALLY
    // =================================================

    await connection.query(`
      CREATE TABLE IF NOT EXISTS products (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(150) NOT NULL,
        category VARCHAR(50) NOT NULL DEFAULT 'General',
        sku VARCHAR(100) UNIQUE,
        barcode VARCHAR(100) UNIQUE,
        price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        gst_percent DECIMAL(5,2) NOT NULL DEFAULT 18.00,
        stock INT NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    console.log('✔ Products table ready');

    // =================================================
    // GENERATE 500 PRODUCTS
    // =================================================

    const products = generate500Products();

    console.log(
      `Generated EXACTLY ${products.length} retail products for seeding.`
    );

    if (products.length !== 500) {
      throw new Error(
        `Product generation error. Expected 500 but generated ${products.length}.`
      );
    }

    // =================================================
    // INSERT PRODUCTS IN BATCHES
    // =================================================

    const chunkSize = 50;

    for (let i = 0; i < products.length; i += chunkSize) {

      const chunk = products.slice(i, i + chunkSize);

      const values = [];
      const queryParams = [];

      chunk.forEach(product => {

        values.push(
          '(?, ?, ?, ?, ?, ?, ?)'
        );

        queryParams.push(
          product.name,
          product.category,
          product.sku,
          product.barcode,
          product.price,
          product.gst_percent,
          product.stock
        );
      });

      const sql = `
        INSERT INTO products
        (
          name,
          category,
          sku,
          barcode,
          price,
          gst_percent,
          stock
        )
        VALUES ${values.join(', ')}

        ON DUPLICATE KEY UPDATE
          name = VALUES(name),
          category = VALUES(category),
          barcode = VALUES(barcode),
          price = VALUES(price),
          gst_percent = VALUES(gst_percent),
          stock = VALUES(stock)
      `;

      await connection.query(sql, queryParams);

      console.log(
        `✔ Inserted products ${i + 1} - ${Math.min(
          i + chunkSize,
          products.length
        )}`
      );
    }

    // =================================================
    // VERIFY PRODUCT COUNT
    // =================================================

    const [rows] = await connection.query(
      'SELECT COUNT(*) AS total FROM products'
    );

    const totalCount = Number(rows[0].total);

    console.log('===================================================');

    if (totalCount >= 500) {

      console.log(' SUCCESS: 500 Retail Products Seeded!');
      console.log(` Total Products in MySQL: ${totalCount}`);

    } else {

      console.log(
        `WARNING: Product count is ${totalCount}, expected at least 500.`
      );
    }

    console.log('===================================================');

  } catch (error) {

    console.error('===================================================');
    console.error(' FAILED to seed products.');
    console.error(` Error Code: ${error.code || 'UNKNOWN'}`);
    console.error(` Error Message: ${error.message}`);
    console.error('===================================================');

    process.exitCode = 1;

  } finally {

    if (connection) {
      await connection.end();
      console.log('✔ MySQL connection closed');
    }
  }
}

// ===================================================
// START SCRIPT
// ===================================================

seedDatabase();