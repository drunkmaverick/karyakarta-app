import { Customer } from './types';

export function formatTimestamp(ts: any): string {
  if (!ts) return 'N/A';
  
  try {
    // Handle Firestore Timestamp shape {_seconds, _nanoseconds}
    if (ts._seconds) {
      const date = new Date(ts._seconds * 1000);
      return date.toLocaleString('en-IN');
    }
    
    // Handle regular Date objects or ISO strings
    if (ts instanceof Date) {
      return ts.toLocaleString('en-IN');
    }
    
    if (typeof ts === 'string') {
      return new Date(ts).toLocaleString('en-IN');
    }
    
    // Handle timestamp numbers
    if (typeof ts === 'number') {
      return new Date(ts).toLocaleString('en-IN');
    }
    
    return 'Invalid Date';
  } catch {
    return 'Invalid Date';
  }
}

export function mapApiCustomerToType(o: any): Customer {
  return {
    id: o.id || '',
    name: o.name || '',
    phone: o.phone || '',
    email: o.email || '',
    area: o.area || '',
    active: o.active !== undefined ? o.active : true,
    notes: o.notes || '',
    createdAt: o.createdAt,
    updatedAt: o.updatedAt,
  };
}

// --- CSV helpers ---
export type CsvValue = string | number | boolean | null | undefined | Date;
const csvEscape = (v: CsvValue): string => {
  if (v === null || v === undefined) return '';
  if (v instanceof Date) return v.toISOString();
  const s = String(v);
  const mustQuote = /[",\n]/.test(s);
  const escaped = s.replace(/"/g, '""');
  return mustQuote ? `"${escaped}"` : escaped;
};

export function toCsv(headers: string[], rows: Array<Record<string, CsvValue>>): string {
  const headLine = headers.map(csvEscape).join(',');
  const bodyLines = rows.map(r => headers.map(h => csvEscape(r[h as keyof typeof r])).join(','));
  return [headLine, ...bodyLines].join('\n');
}

export function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
// --- end CSV helpers ---
