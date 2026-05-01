export function formatCurrency(amount) {
  return new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP' }).format(amount);
}

export function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Intl.DateTimeFormat('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(dateStr));
}

export function generateInvoiceNumber() {
  const now = new Date();
  const y = now.getFullYear().toString().slice(-2);
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const r = Math.floor(Math.random() * 9000 + 1000);
  return `INV-${y}${m}${d}-${r}`;
}

export function isExpiringSoon(expiryDate, daysThreshold = 90) {
  if (!expiryDate) return false;
  const expiry = new Date(expiryDate);
  const now = new Date();
  const diff = (expiry - now) / (1000 * 60 * 60 * 24);
  return diff <= daysThreshold && diff > 0;
}

export function isExpired(expiryDate) {
  if (!expiryDate) return false;
  return new Date(expiryDate) <= new Date();
}

export function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}
