import Database from 'better-sqlite3';
import path from 'path';

let db;

export function getDb() {
  if (!db) {
    const dbPath = path.join(process.cwd(), 'farma.db');
    db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initializeDatabase();
  }
  autoMigrate(db);
  return db;
}

function initializeDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      name_en TEXT,
      barcode TEXT UNIQUE,
      category TEXT,
      purchase_price REAL NOT NULL,
      selling_price REAL NOT NULL,
      quantity INTEGER DEFAULT 0,
      min_quantity INTEGER DEFAULT 5,
      expiry_date TEXT,
      requires_prescription INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT UNIQUE,
      email TEXT,
      address TEXT,
      loyalty_points INTEGER DEFAULT 0,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS invoices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_number TEXT UNIQUE NOT NULL,
      customer_id INTEGER,
      user_id INTEGER,
      subtotal REAL NOT NULL,
      discount REAL DEFAULT 0,
      tax REAL DEFAULT 0,
      total REAL NOT NULL,
      payment_method TEXT NOT NULL,
      amount_paid REAL,
      change_amount REAL DEFAULT 0,
      status TEXT DEFAULT 'completed',
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (customer_id) REFERENCES customers(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS invoice_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      product_name TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      unit_price REAL NOT NULL,
      discount REAL DEFAULT 0,
      total REAL NOT NULL,
      FOREIGN KEY (invoice_id) REFERENCES invoices(id),
      FOREIGN KEY (product_id) REFERENCES products(id)
    );

    CREATE TABLE IF NOT EXISTS returns (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      user_id INTEGER,
      quantity INTEGER NOT NULL,
      reason TEXT,
      refund_amount REAL NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (invoice_id) REFERENCES invoices(id),
      FOREIGN KEY (product_id) REFERENCES products(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS debts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_id INTEGER,
      user_id INTEGER,
      customer_name TEXT NOT NULL,
      customer_phone TEXT,
      total_amount REAL NOT NULL,
      amount_paid REAL DEFAULT 0,
      remaining REAL NOT NULL,
      status TEXT DEFAULT 'pending',
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (invoice_id) REFERENCES invoices(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('owner', 'cashier')),
      permissions TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS suppliers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT,
      email TEXT,
      address TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS purchase_orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      supplier_id INTEGER NOT NULL,
      total_amount REAL DEFAULT 0,
      status TEXT DEFAULT 'pending', -- pending, received, cancelled
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      received_at DATETIME,
      FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
    );

    CREATE TABLE IF NOT EXISTS purchase_order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      product_name TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      unit_cost REAL NOT NULL,
      total REAL NOT NULL,
      FOREIGN KEY (order_id) REFERENCES purchase_orders(id),
      FOREIGN KEY (product_id) REFERENCES products(id)
    );

    CREATE TABLE IF NOT EXISTS expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      amount REAL NOT NULL,
      category TEXT NOT NULL,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      action_type TEXT NOT NULL,
      description TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    INSERT OR IGNORE INTO users (username, password, role, permissions) VALUES ('admin', 'admin', 'owner', '{"can_discount":true,"can_return":true,"can_view_drawer":true,"can_add_expense":true}');
    INSERT OR IGNORE INTO users (username, password, role, permissions) VALUES ('cashier', '1234', 'cashier', '{"can_discount":false,"can_return":false,"can_view_drawer":false,"can_add_expense":true}');
  `);
}

function autoMigrate(db) {
  const migrations = {
    users: [
      'permissions TEXT DEFAULT "{}"',
      'is_deleted INTEGER DEFAULT 0'
    ],
    invoices: [
      'user_id INTEGER REFERENCES users(id)',
      "status TEXT DEFAULT 'completed'"
    ],
    returns: ['user_id INTEGER REFERENCES users(id)'],
    debts: ['user_id INTEGER REFERENCES users(id)'],
    products: [
      'manufacturer TEXT',
      'active_ingredient TEXT',
      'volume_weight TEXT',
      'concentration TEXT',
      'pharmaceutical_form TEXT',
      'is_deleted INTEGER DEFAULT 0',
      'batch_no TEXT'
    ]
  };

  for (const [table, cols] of Object.entries(migrations)) {
    try {
      const info = db.prepare(`PRAGMA table_info(${table})`).all();
      const existingCols = info.map(c => c.name);
      for (const colDef of cols) {
        const colName = colDef.split(' ')[0];
        if (!existingCols.includes(colName)) {
          db.exec(`ALTER TABLE ${table} ADD COLUMN ${colDef}`);
        }
      }
    } catch (e) {
      console.error(`Auto-migration failed for table ${table}:`, e.message);
    }
  }
}
