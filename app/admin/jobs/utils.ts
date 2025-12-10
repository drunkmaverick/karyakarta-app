export function formatCurrency(amount: number, currency = 'INR') {
  try { return new Intl.NumberFormat('en-IN', { style: 'currency', currency }).format(amount); }
  catch { return `${amount} ${currency}`; }
}

export function formatTimestamp(t: any) {
  if (!t) return '-';
  if (t instanceof Date) return t.toLocaleString();
  if (typeof t === 'object' && '_seconds' in t) {
    const d = new Date(t._seconds * 1000 + Math.floor((t._nanoseconds || 0)/1e6));
    return d.toLocaleString();
  }
  const d = new Date(t);
  return isNaN(d.getTime()) ? '-' : d.toLocaleString();
}

export function toCsv(headers: string[], rows: Record<string, any>[]) {
  const esc = (v: any) => {
    const s = v === null || v === undefined ? '' : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g,'""')}"` : s;
  };
  const head = headers.map(esc).join(',');
  const body = rows.map(r => headers.map(h => esc(r[h])).join(',')).join('\n');
  return head + '\n' + body + '\n';
}

export function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export function mapApiJobToType(j: any) {
  return {
    id: j.id,
    customerId: j.customerId,
    areaId: j.areaId,
    service: j.service,
    priceQuoted: j.priceQuoted,
    status: j.status,
    scheduledAt: j.scheduledAt,
    createdAt: j.createdAt,
    updatedAt: j.updatedAt,
  };
}
