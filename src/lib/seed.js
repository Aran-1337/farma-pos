import { getDb } from './db.js';

const products = [
  { name: 'بنادول أقراص 500مج', name_en: 'Panadol 500mg', barcode: '6281001210011', category: 'مسكنات', purchase_price: 18, selling_price: 25, quantity: 120, min_quantity: 20, expiry_date: '2027-03-15' },
  { name: 'بروفين 400مج', name_en: 'Brufen 400mg', barcode: '6281001210028', category: 'مسكنات', purchase_price: 22, selling_price: 33, quantity: 85, min_quantity: 15, expiry_date: '2027-06-20' },
  { name: 'كتافلام 50مج', name_en: 'Cataflam 50mg', barcode: '6281001210035', category: 'مسكنات', purchase_price: 30, selling_price: 45, quantity: 60, min_quantity: 10, expiry_date: '2027-01-10' },
  { name: 'فولتارين جل 50جم', name_en: 'Voltaren Gel 50g', barcode: '6281001210042', category: 'مسكنات', purchase_price: 35, selling_price: 52, quantity: 40, min_quantity: 8, expiry_date: '2027-09-01' },
  { name: 'أوجمنتين 1جم', name_en: 'Augmentin 1g', barcode: '6281001210059', category: 'مضادات حيوية', purchase_price: 85, selling_price: 120, quantity: 45, min_quantity: 10, expiry_date: '2026-12-01', requires_prescription: 1 },
  { name: 'فلاجيل 500مج', name_en: 'Flagyl 500mg', barcode: '6281001210066', category: 'مضادات حيوية', purchase_price: 15, selling_price: 22, quantity: 70, min_quantity: 15, expiry_date: '2027-04-15', requires_prescription: 1 },
  { name: 'سيبروفلوكساسين 500مج', name_en: 'Ciprofloxacin 500mg', barcode: '6281001210073', category: 'مضادات حيوية', purchase_price: 20, selling_price: 35, quantity: 55, min_quantity: 10, expiry_date: '2027-08-20', requires_prescription: 1 },
  { name: 'أموكسيل 500مج', name_en: 'Amoxil 500mg', barcode: '6281001210080', category: 'مضادات حيوية', purchase_price: 25, selling_price: 38, quantity: 65, min_quantity: 10, expiry_date: '2027-05-10', requires_prescription: 1 },
  { name: 'كلاريثروميسين 500مج', name_en: 'Klacid 500mg', barcode: '6281001210097', category: 'مضادات حيوية', purchase_price: 60, selling_price: 90, quantity: 30, min_quantity: 8, expiry_date: '2027-07-25', requires_prescription: 1 },
  { name: 'كونكور 5مج', name_en: 'Concor 5mg', barcode: '6281001210103', category: 'أدوية ضغط', purchase_price: 45, selling_price: 68, quantity: 50, min_quantity: 10, expiry_date: '2027-11-30' },
  { name: 'أملور 5مج', name_en: 'Amlor 5mg', barcode: '6281001210110', category: 'أدوية ضغط', purchase_price: 35, selling_price: 55, quantity: 40, min_quantity: 10, expiry_date: '2027-10-15' },
  { name: 'كابوتين 25مج', name_en: 'Capoten 25mg', barcode: '6281001210127', category: 'أدوية ضغط', purchase_price: 28, selling_price: 42, quantity: 35, min_quantity: 8, expiry_date: '2027-02-28' },
  { name: 'جلوكوفاج 500مج', name_en: 'Glucophage 500mg', barcode: '6281001210134', category: 'أدوية سكر', purchase_price: 18, selling_price: 30, quantity: 80, min_quantity: 15, expiry_date: '2027-08-01' },
  { name: 'أماريل 2مج', name_en: 'Amaryl 2mg', barcode: '6281001210141', category: 'أدوية سكر', purchase_price: 55, selling_price: 82, quantity: 35, min_quantity: 8, expiry_date: '2027-06-15' },
  { name: 'جانوفيا 100مج', name_en: 'Januvia 100mg', barcode: '6281001210158', category: 'أدوية سكر', purchase_price: 180, selling_price: 250, quantity: 20, min_quantity: 5, expiry_date: '2027-09-20' },
  { name: 'نكسيوم 40مج', name_en: 'Nexium 40mg', barcode: '6281001210165', category: 'أدوية معدة', purchase_price: 75, selling_price: 110, quantity: 45, min_quantity: 10, expiry_date: '2027-04-01' },
  { name: 'أنتودين 40مج', name_en: 'Antodine 40mg', barcode: '6281001210172', category: 'أدوية معدة', purchase_price: 12, selling_price: 20, quantity: 90, min_quantity: 20, expiry_date: '2027-07-10' },
  { name: 'موتيليوم 10مج', name_en: 'Motilium 10mg', barcode: '6281001210189', category: 'أدوية معدة', purchase_price: 25, selling_price: 38, quantity: 55, min_quantity: 10, expiry_date: '2027-03-20' },
  { name: 'كلاريتين 10مج', name_en: 'Claritine 10mg', barcode: '6281001210196', category: 'حساسية', purchase_price: 30, selling_price: 48, quantity: 60, min_quantity: 10, expiry_date: '2027-05-30' },
  { name: 'زيرتك 10مج', name_en: 'Zyrtec 10mg', barcode: '6281001210202', category: 'حساسية', purchase_price: 35, selling_price: 55, quantity: 50, min_quantity: 10, expiry_date: '2027-08-15' },
  { name: 'تلفاست 180مج', name_en: 'Telfast 180mg', barcode: '6281001210219', category: 'حساسية', purchase_price: 45, selling_price: 70, quantity: 40, min_quantity: 8, expiry_date: '2027-11-01' },
  { name: 'فيتامين سي 1000مج', name_en: 'Vitamin C 1000mg', barcode: '6281001210226', category: 'فيتامينات', purchase_price: 20, selling_price: 35, quantity: 100, min_quantity: 20, expiry_date: '2028-01-15' },
  { name: 'أوميجا 3', name_en: 'Omega 3', barcode: '6281001210233', category: 'فيتامينات', purchase_price: 65, selling_price: 95, quantity: 35, min_quantity: 8, expiry_date: '2027-12-01' },
  { name: 'كالسيوم + فيتامين د', name_en: 'Calcium + Vit D', barcode: '6281001210240', category: 'فيتامينات', purchase_price: 40, selling_price: 60, quantity: 50, min_quantity: 10, expiry_date: '2027-10-20' },
  { name: 'حديد فيروجلوبين', name_en: 'Feroglobin', barcode: '6281001210257', category: 'فيتامينات', purchase_price: 75, selling_price: 110, quantity: 30, min_quantity: 8, expiry_date: '2027-09-15' },
  { name: 'نولفادكس 20مج', name_en: 'Nolvadex 20mg', barcode: '6281001210264', category: 'أدوية متخصصة', purchase_price: 90, selling_price: 130, quantity: 15, min_quantity: 5, expiry_date: '2027-06-01', requires_prescription: 1 },
  { name: 'ليبيتور 20مج', name_en: 'Lipitor 20mg', barcode: '6281001210271', category: 'أدوية كولسترول', purchase_price: 70, selling_price: 105, quantity: 40, min_quantity: 8, expiry_date: '2027-07-15' },
  { name: 'كريستور 10مج', name_en: 'Crestor 10mg', barcode: '6281001210288', category: 'أدوية كولسترول', purchase_price: 85, selling_price: 125, quantity: 30, min_quantity: 8, expiry_date: '2027-08-20' },
  { name: 'فنتولين بخاخ', name_en: 'Ventolin Inhaler', barcode: '6281001210295', category: 'أدوية صدر', purchase_price: 25, selling_price: 40, quantity: 45, min_quantity: 10, expiry_date: '2027-05-01' },
  { name: 'سيريتايد بخاخ', name_en: 'Seretide Inhaler', barcode: '6281001210301', category: 'أدوية صدر', purchase_price: 180, selling_price: 260, quantity: 15, min_quantity: 5, expiry_date: '2027-04-15' },
  { name: 'نوروفين للأطفال', name_en: 'Nurofen Kids', barcode: '6281001210318', category: 'أدوية أطفال', purchase_price: 30, selling_price: 48, quantity: 55, min_quantity: 10, expiry_date: '2027-03-01' },
  { name: 'بنادول للأطفال شراب', name_en: 'Panadol Kids Syrup', barcode: '6281001210325', category: 'أدوية أطفال', purchase_price: 22, selling_price: 35, quantity: 65, min_quantity: 12, expiry_date: '2027-02-15' },
  { name: 'فلاجيل شراب أطفال', name_en: 'Flagyl Kids Syrup', barcode: '6281001210332', category: 'أدوية أطفال', purchase_price: 12, selling_price: 20, quantity: 45, min_quantity: 10, expiry_date: '2027-06-10' },
  { name: 'ديكساميثازون حقن', name_en: 'Dexamethasone Inj', barcode: '6281001210349', category: 'حقن', purchase_price: 15, selling_price: 25, quantity: 50, min_quantity: 10, expiry_date: '2027-09-01', requires_prescription: 1 },
  { name: 'سيفترياكسون 1جم حقن', name_en: 'Ceftriaxone 1g', barcode: '6281001210356', category: 'حقن', purchase_price: 35, selling_price: 55, quantity: 30, min_quantity: 8, expiry_date: '2027-10-15', requires_prescription: 1 },
  { name: 'بيتادين محلول', name_en: 'Betadine Solution', barcode: '6281001210363', category: 'مستلزمات طبية', purchase_price: 18, selling_price: 30, quantity: 70, min_quantity: 15, expiry_date: '2028-01-01' },
  { name: 'شاش طبي معقم', name_en: 'Sterile Gauze', barcode: '6281001210370', category: 'مستلزمات طبية', purchase_price: 8, selling_price: 15, quantity: 100, min_quantity: 20, expiry_date: '2028-06-01' },
  { name: 'لاصق طبي', name_en: 'Medical Tape', barcode: '6281001210387', category: 'مستلزمات طبية', purchase_price: 5, selling_price: 10, quantity: 150, min_quantity: 30, expiry_date: '2028-12-01' },
  { name: 'ترامادول 50مج', name_en: 'Tramadol 50mg', barcode: '6281001210394', category: 'مسكنات قوية', purchase_price: 25, selling_price: 40, quantity: 20, min_quantity: 5, expiry_date: '2027-07-01', requires_prescription: 1 },
  { name: 'زانتاك 150مج', name_en: 'Zantac 150mg', barcode: '6281001210400', category: 'أدوية معدة', purchase_price: 20, selling_price: 32, quantity: 60, min_quantity: 10, expiry_date: '2027-05-20' },
  { name: 'دوفالاك شراب', name_en: 'Duphalac Syrup', barcode: '6281001210417', category: 'أدوية معدة', purchase_price: 28, selling_price: 42, quantity: 40, min_quantity: 8, expiry_date: '2027-08-10' },
  { name: 'أدول أقراص', name_en: 'Adol Tablets', barcode: '6281001210424', category: 'مسكنات', purchase_price: 10, selling_price: 18, quantity: 110, min_quantity: 20, expiry_date: '2027-11-15' },
  { name: 'ديكلوفيناك جل', name_en: 'Diclofenac Gel', barcode: '6281001210431', category: 'مسكنات', purchase_price: 15, selling_price: 25, quantity: 50, min_quantity: 10, expiry_date: '2027-06-30' },
  { name: 'كومتركس أقراص', name_en: 'Comtrex', barcode: '6281001210448', category: 'برد وإنفلونزا', purchase_price: 18, selling_price: 28, quantity: 75, min_quantity: 15, expiry_date: '2027-04-20' },
  { name: 'كونجستال أقراص', name_en: 'Congestal', barcode: '6281001210455', category: 'برد وإنفلونزا', purchase_price: 12, selling_price: 20, quantity: 90, min_quantity: 20, expiry_date: '2027-03-10' },
  { name: 'ستربسلز', name_en: 'Strepsils', barcode: '6281001210462', category: 'برد وإنفلونزا', purchase_price: 15, selling_price: 25, quantity: 80, min_quantity: 15, expiry_date: '2027-09-25' },
  { name: 'فيسرالجين أقراص', name_en: 'Visceralgine', barcode: '6281001210479', category: 'مغص', purchase_price: 20, selling_price: 32, quantity: 55, min_quantity: 10, expiry_date: '2027-07-05' },
  { name: 'بسكوبان أقراص', name_en: 'Buscopan', barcode: '6281001210486', category: 'مغص', purchase_price: 22, selling_price: 35, quantity: 50, min_quantity: 10, expiry_date: '2027-08-18' },
  { name: 'جافيسكون شراب', name_en: 'Gaviscon Syrup', barcode: '6281001210493', category: 'أدوية معدة', purchase_price: 45, selling_price: 68, quantity: 35, min_quantity: 8, expiry_date: '2027-10-01' },
  { name: 'بريدنيزولون 5مج', name_en: 'Prednisolone 5mg', barcode: '6281001210509', category: 'كورتيزون', purchase_price: 12, selling_price: 20, quantity: 40, min_quantity: 8, expiry_date: '2027-05-15', requires_prescription: 1 },
  // Low stock items for alerts
  { name: 'إنسولين لانتوس', name_en: 'Lantus Insulin', barcode: '6281001210516', category: 'أدوية سكر', purchase_price: 280, selling_price: 380, quantity: 3, min_quantity: 5, expiry_date: '2026-08-01', requires_prescription: 1 },
  { name: 'هيروكس كريم', name_en: 'Herox Cream', barcode: '6281001210523', category: 'جلدية', purchase_price: 35, selling_price: 55, quantity: 2, min_quantity: 5, expiry_date: '2026-07-15' },
  // Expiring soon items
  { name: 'ريفو أقراص', name_en: 'Rivo Tablets', barcode: '6281001210530', category: 'مسكنات', purchase_price: 8, selling_price: 14, quantity: 45, min_quantity: 10, expiry_date: '2026-06-30' },
  { name: 'ديسفلاتيل أقراص', name_en: 'Disflatyl', barcode: '6281001210547', category: 'أدوية معدة', purchase_price: 15, selling_price: 25, quantity: 30, min_quantity: 8, expiry_date: '2026-07-20' },
];

const customers = [
  { name: 'أحمد محمد علي', phone: '01012345678', insurance_company: 'مصر للتأمين', insurance_number: 'INS-001', loyalty_points: 150 },
  { name: 'فاطمة حسن إبراهيم', phone: '01098765432', insurance_company: null, insurance_number: null, loyalty_points: 80 },
  { name: 'محمد عبدالله السيد', phone: '01155544433', insurance_company: 'أليانز', insurance_number: 'INS-002', loyalty_points: 220 },
  { name: 'سارة أحمد محمود', phone: '01234567890', insurance_company: null, insurance_number: null, loyalty_points: 45 },
  { name: 'عمر خالد يوسف', phone: '01087654321', insurance_company: 'بوبا', insurance_number: 'INS-003', loyalty_points: 310 },
];

export function seedDatabase() {
  const db = getDb();

  const count = db.prepare('SELECT COUNT(*) as c FROM products').get();
  if (count.c > 0) return;

  const insertProduct = db.prepare(`
    INSERT INTO products (name, name_en, barcode, category, purchase_price, selling_price, quantity, min_quantity, expiry_date, requires_prescription)
    VALUES (@name, @name_en, @barcode, @category, @purchase_price, @selling_price, @quantity, @min_quantity, @expiry_date, @requires_prescription)
  `);

  const insertCustomer = db.prepare(`
    INSERT INTO customers (name, phone, insurance_company, insurance_number, loyalty_points)
    VALUES (@name, @phone, @insurance_company, @insurance_number, @loyalty_points)
  `);

  const insertInvoice = db.prepare(`
    INSERT INTO invoices (invoice_number, customer_id, subtotal, discount, total, payment_method, amount_paid, change_amount, status, created_at)
    VALUES (@invoice_number, @customer_id, @subtotal, @discount, @total, @payment_method, @amount_paid, @change_amount, @status, @created_at)
  `);

  const insertItem = db.prepare(`
    INSERT INTO invoice_items (invoice_id, product_id, product_name, quantity, unit_price, total)
    VALUES (@invoice_id, @product_id, @product_name, @quantity, @unit_price, @total)
  `);

  const txn = db.transaction(() => {
    for (const p of products) {
      insertProduct.run({ ...p, requires_prescription: p.requires_prescription || 0 });
    }
    for (const c of customers) {
      insertCustomer.run(c);
    }

    // Generate sample invoices for the last 30 days
    const now = new Date();
    for (let d = 29; d >= 0; d--) {
      const date = new Date(now);
      date.setDate(date.getDate() - d);
      const invoicesPerDay = Math.floor(Math.random() * 6) + 3;

      for (let i = 0; i < invoicesPerDay; i++) {
        const hour = Math.floor(Math.random() * 12) + 8;
        const minute = Math.floor(Math.random() * 60);
        date.setHours(hour, minute, 0);

        const itemCount = Math.floor(Math.random() * 4) + 1;
        const usedProducts = [];
        let subtotal = 0;
        const items = [];

        for (let j = 0; j < itemCount; j++) {
          let pIdx;
          do { pIdx = Math.floor(Math.random() * products.length); } while (usedProducts.includes(pIdx));
          usedProducts.push(pIdx);
          const prod = products[pIdx];
          const qty = Math.floor(Math.random() * 3) + 1;
          const total = prod.selling_price * qty;
          subtotal += total;
          items.push({ product_id: pIdx + 1, product_name: prod.name, quantity: qty, unit_price: prod.selling_price, total });
        }

        const disc = Math.random() > 0.8 ? Math.round(subtotal * 0.05) : 0;
        const total = subtotal - disc;
        const methods = ['cash', 'card', 'insurance'];
        const method = methods[Math.floor(Math.random() * 3)];
        const paid = method === 'cash' ? Math.ceil(total / 10) * 10 : total;

        const y = date.getFullYear().toString().slice(-2);
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const dd = String(date.getDate()).padStart(2, '0');
        const invNum = `INV-${y}${m}${dd}-${String(d * 10 + i + 1).padStart(4, '0')}`;

        const custId = Math.random() > 0.6 ? Math.floor(Math.random() * 5) + 1 : null;

        const result = insertInvoice.run({
          invoice_number: invNum,
          customer_id: custId,
          subtotal, discount: disc, total,
          payment_method: method,
          amount_paid: paid,
          change_amount: paid - total,
          status: 'completed',
          created_at: date.toISOString()
        });

        for (const item of items) {
          insertItem.run({ ...item, invoice_id: result.lastInsertRowid });
        }
      }
    }
  });

  txn();
}
