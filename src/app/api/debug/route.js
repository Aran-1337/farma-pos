import { getDb } from '@/lib/db';
import { NextResponse } from 'next/server';
import * as xlsx from 'xlsx';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

function findValue(normalizedRow, keywords) {
  for (const key in normalizedRow) {
    if (keywords.some(kw => key.includes(kw))) {
      return normalizedRow[key];
    }
  }
  return undefined;
}

function mapRowToProduct(row) {
  const normalizedRow = {};
  for (const key in row) {
    const cleanKey = key.trim().toLowerCase().replace(/_/g, ' ');
    normalizedRow[cleanKey] = row[key];
  }

  const find = (kw) => findValue(normalizedRow, kw);

  const nameVal = find(['اسم عربي', 'اسم الدواء', 'اسم الصنف', 'الاسم', 'الصنف', 'name', 'item', 'product', 'description']);
  const nameEnVal = find(['اسم انجليزي', 'انجليزي', 'إنجليزي', 'en', 'english']);
  const barcodeVal = find(['باركود', 'كود', 'barcode', 'code', 'sku', 'شفرة']);

  return {
    name: String(nameVal || '').trim(),
    name_en: String(nameEnVal || '').trim(),
    barcode: String(barcodeVal || '').trim()
  };
}

export async function GET() {
  try {
    const db = getDb();
    const barcode = '6223003201982';
    const product = db.prepare('SELECT * FROM products WHERE barcode = ?').get(barcode);
    const allBarcodes = db.prepare('SELECT barcode, name FROM products').all();

    return NextResponse.json({ 
      searchingFor: barcode,
      found: product,
      allBarcodesCount: allBarcodes.length,
      sampleBarcodes: allBarcodes.slice(0, 10)
    });
  } catch (e) {
    return NextResponse.json({ error: e.toString() });
  }
}
