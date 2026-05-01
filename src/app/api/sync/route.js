import { getDb } from '@/lib/db';
import { NextResponse } from 'next/server';
import * as xlsx from 'xlsx';

function mapRowToProduct(row) {
  // Normalize row keys to lowercase and trim spaces for flexible matching
  const normalizedRow = {};
  for (const key in row) {
    const cleanKey = key.trim().toLowerCase().replace(/_/g, ' ');
    normalizedRow[cleanKey] = row[key];
  }

  // Find a value by matching any of the given keywords in the keys
  const findValue = (keywords) => {
    for (const key in normalizedRow) {
      if (keywords.some(kw => key.includes(kw))) {
        return normalizedRow[key];
      }
    }
    return undefined;
  };

  const nameVal = findValue(['اسم الصنف', 'اسم الدواء', 'اسم عربي', 'الاسم العربي', 'name', 'item', 'product', 'description']);
  const nameEnVal = findValue(['اسم انجليزي', 'الاسم الانجليزي', 'en', 'english']);
  const barcodeVal = findValue(['باركود دولي', 'باركود', 'كود', 'barcode', 'code', 'sku', 'شفرة']);
  const categoryVal = findValue(['فئة', 'قسم', 'تصنيف', 'مجموعة', 'category', 'group', 'type']);
  const manufacturerVal = findValue(['شركة', 'مصنع', 'مورد', 'مستورد', 'manufacturer', 'company', 'brand']);
  const purchasePriceVal = findValue(['سعر الشراء', 'سعر شراء', 'شراء', 'تكلفة', 'purchase', 'cost']);
  const sellingPriceVal = findValue(['سعر البيع', 'سعر بيع', 'بيع', 'مستهلك', 'سعر', 'selling', 'price', 'retail']);
  const qtyVal = findValue(['كمية', 'رصيد', 'مخزون', 'quantity', 'stock', 'qty']);
  const minQtyVal = findValue(['حد', 'أدنى', 'min']);
  const expiryVal = findValue(['صلاحية', 'تاريخ', 'انتهاء', 'expiry', 'expire', 'date']);
  const rxVal = findValue(['روشتة', 'وصفة', 'prescription', 'rx']);
  
  const activeIngredientVal = findValue(['مادة', 'فعالة', 'active', 'ingredient']);
  const volumeWeightVal = findValue(['حجم', 'وزن', 'volume', 'weight']);
  const concentrationVal = findValue(['تركيز', 'concentration']);
  const pharmaFormVal = findValue(['شكل', 'صيدلاني', 'form']);

  const parsePrice = (v) => {
    if (typeof v === 'number') return v;
    if (!v) return 0;
    const match = String(v).match(/[\d.]+/);
    return match ? parseFloat(match[0]) : 0;
  };

  return {
    name: String(nameVal || '').trim(),
    name_en: String(nameEnVal || '').trim(),
    barcode: String(barcodeVal || '').trim() || String(Math.floor(Math.random() * 1000000000)),
    category: String(categoryVal || 'أدوية عامة').trim(),
    manufacturer: String(manufacturerVal || '').trim(),
    active_ingredient: String(activeIngredientVal || '').trim(),
    volume_weight: String(volumeWeightVal || '').trim(),
    concentration: String(concentrationVal || '').trim(),
    pharmaceutical_form: String(pharmaFormVal || '').trim(),
    purchase_price: parsePrice(purchasePriceVal),
    selling_price: parsePrice(sellingPriceVal),
    quantity: parseInt(qtyVal) || 0,
    min_quantity: parseInt(minQtyVal) || 5,
    expiry_date: expiryVal ? String(expiryVal).trim() : null,
    requires_prescription: rxVal ? 1 : 0
  };
}

export async function POST(request) {
  const db = getDb();
  
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const apiUrl = formData.get('apiUrl');

    let productsToSync = [];

    if (file) {
      // Handle Excel Upload
      const buffer = Buffer.from(await file.arrayBuffer());
      const workbook = xlsx.read(buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const rawData = xlsx.utils.sheet_to_json(sheet);
      
      productsToSync = rawData.map(mapRowToProduct).filter(p => p.name && p.name.length > 1);
    } else if (apiUrl) {
      // Handle API Fetch
      const response = await fetch(apiUrl);
      if (!response.ok) throw new Error('فشل في جلب البيانات من الـ API');
      const rawData = await response.json();
      
      const items = Array.isArray(rawData) ? rawData : (rawData.data || rawData.products || []);
      productsToSync = items.map(mapRowToProduct).filter(p => p.name && p.name.length > 1);
    } else {
      return NextResponse.json({ error: 'يجب توفير ملف إكسيل أو رابط API' }, { status: 400 });
    }

    if (productsToSync.length === 0) {
      return NextResponse.json({ error: 'لم يتم العثور على أي أدوية صالحة' }, { status: 400 });
    }

    let added = 0;
    let updated = 0;

    const txn = db.transaction((items) => {
      for (const item of items) {
        // Check if exists by barcode or name
        let existing;
        if (item.barcode) {
          existing = db.prepare('SELECT id FROM products WHERE barcode = ?').get(item.barcode);
        }
        if (!existing) {
          existing = db.prepare('SELECT id FROM products WHERE name = ? OR name_en = ?').get(item.name, item.name_en || 'NULL_VAL');
        }

        if (existing) {
          // Update and restore if deleted
          db.prepare(`
            UPDATE products SET 
              name = ?, name_en = ?,
              purchase_price = ?, selling_price = ?, 
              manufacturer = COALESCE(NULLIF(?, ''), manufacturer), 
              category = COALESCE(NULLIF(?, ''), category), 
              active_ingredient = COALESCE(NULLIF(?, ''), active_ingredient),
              volume_weight = COALESCE(NULLIF(?, ''), volume_weight),
              concentration = COALESCE(NULLIF(?, ''), concentration),
              pharmaceutical_form = COALESCE(NULLIF(?, ''), pharmaceutical_form),
              is_deleted = 0,
              updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
          `).run(
            item.name, item.name_en, 
            item.purchase_price, item.selling_price, 
            item.manufacturer, item.category, 
            item.active_ingredient, item.volume_weight, 
            item.concentration, item.pharmaceutical_form, 
            existing.id
          );
          updated++;
        } else {
          // Insert
          db.prepare(`
            INSERT INTO products (name, name_en, barcode, category, manufacturer, active_ingredient, volume_weight, concentration, pharmaceutical_form, purchase_price, selling_price, quantity, min_quantity, expiry_date, requires_prescription, is_deleted)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
          `).run(item.name, item.name_en, item.barcode, item.category, item.manufacturer, item.active_ingredient, item.volume_weight, item.concentration, item.pharmaceutical_form, item.purchase_price, item.selling_price, item.quantity, item.min_quantity, item.expiry_date, item.requires_prescription);
          added++;
        }
      }
    });

    txn(productsToSync);

    return NextResponse.json({ success: true, added, updated, total: productsToSync.length });
  } catch (error) {
    console.error('Sync error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
