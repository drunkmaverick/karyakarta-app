'use client';

import { useEffect, useMemo, useState } from 'react';
import type { Payout } from '../types';

type Mode = 'create' | 'edit';

interface Props {
  open: boolean;
  payout: Payout | null;
  mode: Mode;
  onClose: () => void;
  onSaved: () => void; // parent will re-fetch and close drawer
}

export default function PayoutDrawer({ open, payout, mode, onClose, onSaved }: Props) {
  const isCreate = mode === 'create';

  // form state
  const [providerId, setProviderId] = useState('');
  const [amount, setAmount] = useState<number | ''>('');
  const [currency, setCurrency] = useState<'INR' | 'USD' | 'EUR'>('INR');
  const [status, setStatus] = useState<Payout['status']>('pending');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string>('');

  // initialize when drawer opens / payout changes
  useEffect(() => {
    setErr('');
    if (!open) return;
    if (isCreate) {
      setProviderId('');
      setAmount('');
      setCurrency('INR');
      setStatus('pending');
      setNotes('');
    } else if (payout) {
      setProviderId(payout.providerId ?? '');
      setAmount(payout.amount ?? '');
      setCurrency((payout.currency as any) ?? 'INR');
      setStatus(payout.status ?? 'pending');
      setNotes(payout.notes ?? '');
    }
  }, [open, isCreate, payout]);

  const title = useMemo(
    () => (isCreate ? 'New Payout' : `Payout • ${payout?.id?.slice(0, 8) ?? ''}…`),
    [isCreate, payout?.id]
  );

  if (!open) return null;

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setErr('');

    try {
      setSaving(true);

      if (isCreate) {
        // minimal validation
        if (!providerId.trim()) throw new Error('Provider ID is required');
        if (amount === '' || Number(amount) <= 0) throw new Error('Amount must be greater than 0');

        const res = await fetch('/api/payouts/create', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            providerId: providerId.trim(),
            amount: Number(amount),
            currency,
            status, // API will coerce to pending if needed; we pass it for flexibility
            meta: notes ? { notes } : undefined,
          }),
        });
        const data = await res.json();
        if (!res.ok || !data.ok) throw new Error(data.error || 'Failed to create payout');
      } else {
        if (!payout?.id) throw new Error('Missing payout id');
        const res = await fetch('/api/payouts/update', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            id: payout.id,
            status,
            notes,
          }),
        });
        const data = await res.json();
        if (!res.ok || !data.ok) throw new Error(data.error || 'Failed to update payout');
      }

      onSaved(); // parent will refresh + close
    } catch (e: any) {
      setErr(e?.message || String(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-40">
      {/* backdrop */}
      <div className="absolute inset-0 bg-black/30" onClick={() => !saving && onClose()} />

      {/* panel */}
      <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl flex flex-col">
        {/* header */}
        <div className="px-5 py-4 border-b flex items-center justify-between">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-md p-2 hover:bg-gray-100 disabled:opacity-50"
            aria-label="Close drawer"
          >
            ✕
          </button>
        </div>

        {/* body */}
        <form onSubmit={handleSave} className="p-5 flex-1 overflow-y-auto space-y-4">
          {err && (
            <div className="p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md">
              {err}
            </div>
          )}

          {/* Provider ID */}
          <div className="space-y-1">
            <label htmlFor="providerId" className="text-sm font-medium text-gray-700">
              Provider ID
            </label>
            <input
              id="providerId"
              name="providerId"
              type="text"
              autoComplete="off"
              value={providerId}
              onChange={(e) => setProviderId(e.target.value)}
              disabled={!isCreate || saving}
              placeholder="e.g. prov_001"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
              required
            />
            {!isCreate && (
              <p className="text-xs text-gray-500">Provider ID can’t be changed after creation.</p>
            )}
          </div>

          {/* Amount */}
          <div className="space-y-1">
            <label htmlFor="amount" className="text-sm font-medium text-gray-700">
              Amount
            </label>
            <input
              id="amount"
              name="amount"
              type="number"
              min={1}
              step="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
              disabled={saving}
              placeholder="e.g. 1200"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
              required
            />
          </div>

          {/* Currency + Status (status only shown in edit) */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label htmlFor="currency" className="text-sm font-medium text-gray-700">
                Currency
              </label>
              <select
                id="currency"
                name="currency"
                value={currency}
                onChange={(e) => setCurrency(e.target.value as any)}
                disabled={saving}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
              >
                <option value="INR">INR</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
              </select>
            </div>

            {!isCreate && (
              <div className="space-y-1">
                <label htmlFor="status" className="text-sm font-medium text-gray-700">
                  Status
                </label>
                <select
                  id="status"
                  name="status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as Payout['status'])}
                  disabled={saving}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                >
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="completed">Completed</option>
                  <option value="failed">Failed</option>
                  <option value="canceled">Canceled</option>
                </select>
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-1">
            <label htmlFor="notes" className="text-sm font-medium text-gray-700">
              Notes
            </label>
            <textarea
              id="notes"
              name="notes"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={saving}
              placeholder="Optional notes (visible to admins)"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
            />
          </div>
        </form>

        {/* footer */}
        <div className="px-5 py-4 border-t flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            formAction=""
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'Saving…' : isCreate ? 'Create Payout' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}