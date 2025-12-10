'use client';

import { useEffect, useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import StatusBadge from './components/StatusBadge';
import EmptyState from '../../../components/ui/EmptyState';
import { TableSkeleton } from '../../../components/ui/LoadingSkeleton';
import ErrorState from '../../../components/ui/ErrorState';
import { useUIState } from '../../../src/hooks/useUIState';

/** ---------- Types & helpers ---------- */
type FirestoreTs =
  | { _seconds: number; _nanoseconds: number }
  | string
  | number
  | Date
  | null
  | undefined;

type Job = {
  id: string;
  customerId: string;
  providerId?: string;
  areaId: string;
  service: string;
  priceQuoted?: number;
  currency?: string;
  status: 'created' | 'in_progress' | 'completed' | 'failed' | 'canceled';
  notes?: string;
  scheduledAt?: FirestoreTs;
  createdAt?: FirestoreTs;
  updatedAt?: FirestoreTs;
};

type ListResponse = { success: true; jobs: any[] } | { success: false; error: string };

function tsToDate(t: FirestoreTs): Date | null {
  if (!t) return null;
  if (t instanceof Date) return t;
  if (typeof t === 'string' || typeof t === 'number') {
    const d = new Date(t);
    return isNaN(d.getTime()) ? null : d;
  }
  if (typeof t === 'object' && '_seconds' in t) {
    return new Date(t._seconds * 1000 + Math.floor((t._nanoseconds || 0) / 1e6));
  }
  return null;
}

function fmtDate(t: FirestoreTs): string {
  const d = tsToDate(t);
  return d ? d.toLocaleString() : '-';
}

function fmtCurrency(amount?: number, currency = 'INR'): string {
  if (typeof amount !== 'number') return '-';
  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${amount} ${currency}`;
  }
}

function toCsv(headers: string[], rows: Record<string, any>[]): string {
  const esc = (v: any) => {
    if (v == null) return '';
    const s = String(v);
    if (s.includes('"') || s.includes(',') || s.includes('\n')) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };
  const head = headers.join(',');
  const body = rows.map(r => headers.map(h => esc(r[h])).join(',')).join('\n');
  return `${head}\n${body}\n`;
}

function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** ---------- Create Job Drawer (inline component) ---------- */
function CreateJobDrawer({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [customerId, setCustomerId] = useState('');
  const [areaId, setAreaId] = useState('');
  const [service, setService] = useState<'deep_cleaning' | 'ac_service' | ''>('');
  const [scheduledAt, setScheduledAt] = useState<string>(''); // ISO (local) via input datetime-local
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    if (open) {
      setCustomerId('');
      setAreaId('');
      setService('');
      setScheduledAt('');
      setErr('');
      setSubmitting(false);
    }
  }, [open]);

  async function handleCreate() {
    setErr('');
    if (!customerId || !areaId || !service) {
      setErr('Please fill customerId, areaId and service.');
      return;
    }
    setSubmitting(true);
    try {
      const body: any = { customerId, areaId, service };
      if (scheduledAt) {
        // convert local datetime-local value to ISO UTC
        const date = new Date(scheduledAt);
        body.scheduledAt = date.toISOString();
      }
      const res = await fetch('/api/jobs/create', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok && data?.id) {
        onClose();
        onCreated();
      } else {
        setErr(data?.error || 'Create failed');
      }
    } catch (e: any) {
      setErr(e?.message || 'Create failed');
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/40" onClick={onClose} />
      <div className="w-full max-w-md bg-white h-full shadow-xl border-l flex flex-col">
        <div className="p-4 border-b">
          <h3 className="text-lg font-semibold">New Job</h3>
          <p className="text-sm text-gray-500">Create a service job</p>
        </div>
        <div className="p-4 space-y-4 overflow-auto">
          {err && (
            <div className="p-2 text-sm rounded border border-red-200 bg-red-50 text-red-700">
              {err}
            </div>
          )}
          <div>
            <label className="block text-sm text-gray-700 mb-1" htmlFor="customerId">
              Customer ID
            </label>
            <input
              id="customerId"
              name="customerId"
              type="text"
              value={customerId}
              onChange={e => setCustomerId(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="cust_001"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1" htmlFor="areaId">
              Area ID
            </label>
            <input
              id="areaId"
              name="areaId"
              type="text"
              value={areaId}
              onChange={e => setAreaId(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="area_001"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1" htmlFor="service">
              Service
            </label>
            <select
              id="service"
              name="service"
              value={service}
              onChange={e => setService(e.target.value as any)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a service…</option>
              <option value="deep_cleaning">Deep Cleaning</option>
              <option value="ac_service">AC Service</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1" htmlFor="scheduledAt">
              Scheduled At (optional)
            </label>
            <input
              id="scheduledAt"
              name="scheduledAt"
              type="datetime-local"
              value={scheduledAt}
              onChange={e => setScheduledAt(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        <div className="p-4 border-t flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded-md border" disabled={submitting}>
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={submitting}
            className="px-4 py-2 rounded-md bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {submitting ? 'Creating…' : 'Create Job'}
          </button>
        </div>
      </div>
    </div>
  );
}

/** ---------- Main Page ---------- */
export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [filtered, setFiltered] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');

  // filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | Job['status']>('all');

  // selection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const isSelected = (id: string) => selectedIds.includes(id);
  const toggleOne = (id: string) =>
    setSelectedIds(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));
  const toggleAllVisible = () => {
    const ids = (filtered.length ? filtered : jobs).map(j => j.id);
    const allSelected = ids.every(id => selectedIds.includes(id));
    setSelectedIds(allSelected ? selectedIds.filter(id => !ids.includes(id)) : Array.from(new Set([...selectedIds, ...ids])));
  };

  // edit modal
  const [editOpen, setEditOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [editStatus, setEditStatus] = useState<Job['status']>('created');
  const [editNotes, setEditNotes] = useState<string>('');
  const [editProviderId, setEditProviderId] = useState<string>('');
  const [saving, setSaving] = useState(false);

  // providers list
  const [providers, setProviders] = useState<Array<{id: string, name: string}>>([]);
  const [payouts, setPayouts] = useState<Array<{id: string, jobId: string, status: string, amount: number}>>([]);

  // create drawer
  const [createOpen, setCreateOpen] = useState(false);

  const statuses: Job['status'][] = ['created', 'in_progress', 'completed', 'failed', 'canceled'];

  async function fetchJobs() {
    setIsLoading(true);
    setError('');
    try {
      const res = await fetch('/api/jobs/list?limit=200', { cache: 'no-store' });
      const data: ListResponse = await res.json();
      if (!data.success) {
        setError(data.error || 'Failed to load jobs');
        setJobs([]);
      } else {
        const normalized: Job[] = (data.jobs || []).map((j: any) => ({
          id: j.id,
          customerId: j.customerId,
          providerId: j.providerId,
          areaId: j.areaId,
          service: j.service,
          priceQuoted: j.priceQuoted,
          currency: j.currency || 'INR',
          status: j.status,
          notes: j.notes,
          scheduledAt: j.scheduledAt,
          createdAt: j.createdAt,
          updatedAt: j.updatedAt,
        }));
        setJobs(normalized);
      }
    } catch (e: any) {
      setError(e?.message || 'Failed to load jobs');
      setJobs([]);
    } finally {
      setIsLoading(false);
    }
  }

  async function fetchProviders() {
    try {
      const res = await fetch('/api/providers/list', { cache: 'no-store' });
      const data = await res.json();
      if (data.ok) {
        setProviders(data.providers || []);
      }
    } catch (e) {
      console.error('Failed to load providers:', e);
    }
  }

  async function fetchPayouts() {
    try {
      const res = await fetch('/api/payouts/list', { cache: 'no-store' });
      const data = await res.json();
      if (data.ok) {
        setPayouts(data.payouts || []);
      }
    } catch (e) {
      console.error('Failed to load payouts:', e);
    }
  }

  useEffect(() => {
    fetchJobs();
    fetchProviders();
    fetchPayouts();
  }, []);

  useEffect(() => {
    setSelectedIds([]);
  }, [jobs]);

  useEffect(() => {
    let arr = [...jobs];
    const q = search.trim().toLowerCase();
    if (q) {
      arr = arr.filter(j =>
        (j.id || '').toLowerCase().includes(q) ||
        (j.customerId || '').toLowerCase().includes(q) ||
        (j.providerId || '').toLowerCase().includes(q) ||
        (j.service || '').toLowerCase().includes(q)
      );
    }
    if (statusFilter !== 'all') {
      arr = arr.filter(j => j.status === statusFilter);
    }
    arr.sort((a, b) => {
      const ad = tsToDate(a.createdAt)?.getTime() || 0;
      const bd = tsToDate(b.createdAt)?.getTime() || 0;
      return bd - ad;
    });
    setFiltered(arr);
  }, [jobs, search, statusFilter]);

  function openEdit(job: Job) {
    setEditingJob(job);
    setEditStatus(job.status);
    setEditNotes(job.notes || '');
    setEditProviderId(job.providerId || '');
    setEditOpen(true);
  }

  async function saveEdit() {
    if (!editingJob) return;
    setSaving(true);
    try {
      const res = await fetch('/api/jobs/update', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          id: editingJob.id,
          status: editStatus,
          notes: editNotes || undefined,
          providerId: editProviderId || undefined,
        }),
      });
      const data = await res.json();
      if (data?.ok) {
        setEditOpen(false);
        setEditingJob(null);
        await fetchJobs();
        await fetchPayouts(); // Refresh payouts in case status changed
      } else {
        alert(data?.error || 'Failed to update job');
      }
    } catch (e: any) {
      alert(e?.message || 'Failed to update job');
    } finally {
      setSaving(false);
    }
  }

  async function deleteOne(id: string) {
    if (!confirm('Delete this job? This cannot be undone.')) return;
    try {
      await fetch('/api/jobs/delete', {
        method: 'DELETE',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      await fetchJobs();
    } catch (e) {
      console.error(e);
      alert('Delete failed');
    }
  }

  const [bulkWorking, setBulkWorking] = useState(false);

  async function bulkUpdateStatus(ids: string[], status: Job['status']) {
    for (const id of ids) {
      try {
        await fetch('/api/jobs/update', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ id, status }),
        });
      } catch (e) {
        console.error('update failed', id, e);
      }
    }
  }
  async function bulkDelete(ids: string[]) {
    for (const id of ids) {
      try {
        await fetch('/api/jobs/delete', {
          method: 'DELETE',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ id }),
        });
      } catch (e) {
        console.error('delete failed', id, e);
      }
    }
  }

  async function doBulkComplete() {
    if (!selectedIds.length) return;
    setBulkWorking(true);
    await bulkUpdateStatus(selectedIds, 'completed');
    setBulkWorking(false);
    setSelectedIds([]);
    await fetchJobs();
  }
  async function doBulkFail() {
    if (!selectedIds.length) return;
    setBulkWorking(true);
    await bulkUpdateStatus(selectedIds, 'failed');
    setBulkWorking(false);
    setSelectedIds([]);
    await fetchJobs();
  }
  async function doBulkCancel() {
    if (!selectedIds.length) return;
    setBulkWorking(true);
    await bulkUpdateStatus(selectedIds, 'canceled');
    setBulkWorking(false);
    setSelectedIds([]);
    await fetchJobs();
  }
  async function doBulkDelete() {
    if (!selectedIds.length) return;
    if (!confirm(`Delete ${selectedIds.length} job(s)? This cannot be undone.`)) return;
    setBulkWorking(true);
    await bulkDelete(selectedIds);
    setBulkWorking(false);
    setSelectedIds([]);
    await fetchJobs();
  }

  const visible = useMemo(() => (filtered.length ? filtered : jobs), [filtered, jobs]);

  function getPayoutForJob(jobId: string) {
    return payouts.find(p => p.jobId === jobId);
  }

  function getProviderName(providerId?: string) {
    if (!providerId) return '-';
    const provider = providers.find(p => p.id === providerId);
    return provider?.name || providerId.slice(0, 8) + '...';
  }

  function exportCsv() {
    if (!visible.length) {
      console.log('No rows to export');
      return;
    }
    const headers = [
      'id',
      'customerId',
      'providerId',
      'areaId',
      'service',
      'priceQuoted',
      'currency',
      'status',
      'notes',
      'scheduledAtISO',
      'createdAtISO',
      'updatedAtISO',
    ];
    const rows = visible.map(j => ({
      id: j.id || '',
      customerId: j.customerId || '',
      providerId: j.providerId || '',
      areaId: j.areaId || '',
      service: j.service || '',
      priceQuoted: j.priceQuoted ?? '',
      currency: j.currency || 'INR',
      status: j.status || '',
      notes: j.notes || '',
      scheduledAtISO: tsToDate(j.scheduledAt)?.toISOString() || '',
      createdAtISO: tsToDate(j.createdAt)?.toISOString() || '',
      updatedAtISO: tsToDate(j.updatedAt)?.toISOString() || '',
    }));
    const csv = toCsv(headers, rows);
    const ts = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
    downloadCsv(`jobs-${ts}.csv`, csv);
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Jobs</h1>
          <p className="text-gray-600">Track and manage service jobs</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setCreateOpen(true)}
            className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700"
          >
            New Job
          </button>
          <button
            onClick={exportCsv}
            disabled={isLoading || visible.length === 0}
            className="px-3 py-2 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-900 text-sm disabled:opacity-50"
          >
            Export CSV
          </button>
          <button
            onClick={fetchJobs}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* Toolbar */}
      <div className="bg-white rounded-2xl shadow-sm border p-4 mb-4">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            <div className="flex-1 min-w-0">
              <input
                type="text"
                placeholder="Search by Job ID, Customer ID, Provider ID, or Service…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="min-w-0">
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value as any)}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Status</option>
                <option value="created">Created</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
                <option value="canceled">Canceled</option>
              </select>
            </div>
          </div>

          {/* Bulk bar */}
          {selectedIds.length > 0 && (
            <div className="flex items-center gap-2">
              <button onClick={doBulkComplete} disabled={bulkWorking} className="px-3 py-2 rounded-md bg-emerald-600 text-white text-sm disabled:opacity-60">
                {bulkWorking ? 'Working…' : 'Mark Completed'}
              </button>
              <button onClick={doBulkFail} disabled={bulkWorking} className="px-3 py-2 rounded-md bg-amber-600 text-white text-sm disabled:opacity-60">
                {bulkWorking ? 'Working…' : 'Mark Failed'}
              </button>
              <button onClick={doBulkCancel} disabled={bulkWorking} className="px-3 py-2 rounded-md bg-gray-600 text-white text-sm disabled:opacity-60">
                {bulkWorking ? 'Working…' : 'Mark Canceled'}
              </button>
              <button onClick={doBulkDelete} disabled={bulkWorking} className="px-3 py-2 rounded-md bg-rose-600 text-white text-sm disabled:opacity-60">
                {bulkWorking ? 'Working…' : 'Delete'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Table / Empty / Loading */}
      <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
        {isLoading ? (
          <TableSkeleton rows={5} columns={6} />
        ) : visible.length === 0 ? (
          <EmptyState
            icon={Plus}
            title="No jobs yet"
            description="Get started by creating your first job."
            action={{
              label: "Create your first job",
              onClick: () => setCreateOpen(true)
            }}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-3">
                    <input
                      type="checkbox"
                      aria-label="Select all"
                      checked={visible.length > 0 && visible.every(j => selectedIds.includes(j.id))}
                      onChange={toggleAllVisible}
                      disabled={visible.length === 0}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Job ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Provider
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Service
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Scheduled
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Payout
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {visible.map(job => (
                  <tr key={job.id} className="hover:bg-gray-50">
                    <td className="px-3 py-4">
                      <input
                        type="checkbox"
                        aria-label={`Select job ${job.id}`}
                        checked={isSelected(job.id)}
                        onChange={() => toggleOne(job.id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {fmtDate(job.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                      {job.id.slice(0, 8)}…
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                      {(job.customerId || '-').slice(0, 10)}…
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {getProviderName(job.providerId)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {job.service || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {fmtCurrency(job.priceQuoted, job.currency)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={job.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {fmtDate(job.scheduledAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {(() => {
                        const payout = getPayoutForJob(job.id);
                        if (!payout) {
                          return job.status === 'completed' ? (
                            <span className="text-yellow-600">No payout</span>
                          ) : '-';
                        }
                        return (
                          <div className="flex flex-col">
                            <span className={`text-xs px-2 py-1 rounded ${
                              payout.status === 'completed' ? 'bg-green-100 text-green-800' :
                              payout.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {payout.status}
                            </span>
                            <span className="text-xs text-gray-500 mt-1">
                              {fmtCurrency(payout.amount, 'INR')}
                            </span>
                          </div>
                        );
                      })()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-2">
                        <button onClick={() => openEdit(job)} className="text-blue-600 hover:text-blue-900">
                          View / Update
                        </button>
                        <button onClick={() => deleteOne(job.id)} className="text-rose-600 hover:text-rose-900">
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editOpen && editingJob && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-xl bg-white shadow-lg border">
            <div className="p-4 border-b">
              <h3 className="text-lg font-semibold">Update Job</h3>
              <p className="text-xs text-gray-500 mt-1 font-mono break-all">{editingJob.id}</p>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm text-gray-700 mb-1">Status</label>
                <select
                  value={editStatus}
                  onChange={e => setEditStatus(e.target.value as Job['status'])}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  {['created', 'in_progress', 'completed', 'failed', 'canceled'].map(s => (
                    <option key={s} value={s}>
                      {s.replace('_', ' ')}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Assign Provider</label>
                <select
                  value={editProviderId}
                  onChange={e => setEditProviderId(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">No provider assigned</option>
                  {providers.map(provider => (
                    <option key={provider.id} value={provider.id}>
                      {provider.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Notes</label>
                <textarea
                  value={editNotes}
                  onChange={e => setEditNotes(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={4}
                  placeholder="Optional notes…"
                />
              </div>
            </div>
            <div className="p-4 border-t flex justify-end gap-2">
              <button
                onClick={() => {
                  setEditOpen(false);
                  setEditingJob(null);
                }}
                className="px-4 py-2 rounded-md border"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                onClick={saveEdit}
                disabled={saving}
                className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Drawer */}
      <CreateJobDrawer
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={fetchJobs}
      />
    </div>
  );
}