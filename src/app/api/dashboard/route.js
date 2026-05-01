import { getDb } from '@/lib/db';
import { seedDatabase } from '@/lib/seed';
import { NextResponse } from 'next/server';

function init() { getDb(); seedDatabase(); }

export async function GET() {
  init();
  const db = getDb();
  const today = new Date().toISOString().split('T')[0];

  const todaySales = db.prepare(`SELECT COALESCE(SUM(total),0) as total, COUNT(*) as count FROM invoices WHERE DATE(created_at)=DATE('now','localtime') AND status='completed'`).get();
  const todayProfit = db.prepare(`SELECT COALESCE(SUM(ii.quantity * (ii.unit_price - p.purchase_price)),0) as profit FROM invoice_items ii JOIN invoices i ON ii.invoice_id=i.id JOIN products p ON ii.product_id=p.id WHERE DATE(i.created_at)=DATE('now','localtime') AND i.status='completed'`).get();
  const lowStock = db.prepare(`SELECT COUNT(*) as count FROM products WHERE quantity <= min_quantity`).get();
  const expiringSoon = db.prepare(`SELECT COUNT(*) as count FROM products WHERE expiry_date <= DATE('now','+90 days') AND expiry_date > DATE('now')`).get();
  const expired = db.prepare(`SELECT COUNT(*) as count FROM products WHERE expiry_date <= DATE('now')`).get();

  // Last 7 days sales
  const last7Days = db.prepare(`
    SELECT DATE(created_at) as date, COALESCE(SUM(total),0) as total, COUNT(*) as count
    FROM invoices WHERE created_at >= DATE('now','-7 days') AND status='completed'
    GROUP BY DATE(created_at) ORDER BY date
  `).all();

  // Top selling products
  const topProducts = db.prepare(`
    SELECT p.name, SUM(ii.quantity) as total_qty, SUM(ii.total) as total_sales
    FROM invoice_items ii JOIN products p ON ii.product_id=p.id
    JOIN invoices i ON ii.invoice_id=i.id
    WHERE i.status='completed' AND i.created_at >= DATE('now','-30 days')
    GROUP BY ii.product_id ORDER BY total_qty DESC LIMIT 10
  `).all();

  // Low stock alerts
  const lowStockItems = db.prepare(`SELECT id, name, quantity, min_quantity FROM products WHERE quantity <= min_quantity ORDER BY quantity LIMIT 10`).all();

  // Expiring items
  const expiringItems = db.prepare(`SELECT id, name, expiry_date, quantity FROM products WHERE expiry_date <= DATE('now','+90 days') AND expiry_date > DATE('now') ORDER BY expiry_date LIMIT 10`).all();

  // Recent invoices
  const recentInvoices = db.prepare(`SELECT id, invoice_number, total, payment_method, status, created_at FROM invoices ORDER BY created_at DESC LIMIT 10`).all();

  return NextResponse.json({
    stats: { todaySales: todaySales.total, invoiceCount: todaySales.count, profit: todayProfit.profit, lowStock: lowStock.count, expiringSoon: expiringSoon.count, expired: expired.count },
    last7Days, topProducts, lowStockItems, expiringItems, recentInvoices
  });
}
