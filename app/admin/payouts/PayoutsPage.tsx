'use client';

import { useState, useEffect } from 'react';
import { Payout } from './types';
import { mapApiPayoutToType, formatCurrency, formatTimestamp, toCsv, downloadCsv } from './utils';
import StatusBadge from './components/StatusBadge';
import ConfirmDialog from './components/ConfirmDialog';
import PayoutDrawer from './components/PayoutDrawer';

export default function PayoutsPage() {
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [filteredPayouts, setFilteredPayouts] = useState<Payout[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | Payout['status']>('all');

  // UI state
  const [selectedPayout, setSelectedPayout] = useState<Payout | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<'create' | 'edit'>('edit');
  const [deletePayout, setDeletePayout] = useState<Payout | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loadingBulk, setLoadingBulk] = useState(false);

  // Auto-refresh state
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);

  // Selection helpers
  const isSelected = (id: string) => selectedIds.includes(id);
  const toggleOne = (id: string) =>
    setSelectedIds(prev => isSelected(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const toggleAllVisible = () => {
    const ids = (filteredPayouts ?? payouts ?? []).map(p => p.id).filter(Boolean);
    const allSelected = ids.every(id => selectedIds.includes(id));
    setSelectedIds(allSelected ? selectedIds.filter(id => !ids.includes(id)) : Array.from(new Set([...selectedIds, ...ids])));
  };

  // Clear selection when dataset changes
  useEffect(() => {
    setSelectedIds([]);
  }, [filteredPayouts, payouts]);

  // Fetch payouts
  const fetchPayouts = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await fetch('/api/payouts/list?limit=100', { cache: 'no-store' });
      const data = await response.json();
      if (data.ok && data.items) {
        const normalizedPayouts = data.items.map(mapApiPayoutToType);
        setPayouts(normalizedPayouts);
        setLastUpdatedAt(new Date());
      } else {
        setError(data.error || 'Failed to fetch payouts');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  // Apply filters
  useEffect(() => {
    let filtered = [...payouts];
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        payout =>
          payout.id.toLowerCase().includes(query) ||
          payout.providerId.toLowerCase().includes(query)
      );
    }
    if (statusFilter !== 'all') {
      filtered = filtered.filter(payout => payout.status === statusFilter);
    }
    filtered.sort((a, b) => {
      if (a.createdAt && b.createdAt) {
        const aTime = a.createdAt._seconds || 0;
        const bTime = b.createdAt._seconds || 0;
        return bTime - aTime;
      }
      return 0;
    });
    setFilteredPayouts(filtered);
  }, [payouts, searchQuery, statusFilter]);

  // Initial fetch
  useEffect(() => {
    fetchPayouts();
  }, []);

  // Auto-refresh effect
  useEffect(() => {
    if (!autoRefresh) return;
    const id = setInterval(() => {
      fetchPayouts();
    }, 10_000);
    return () => clearInterval(id);
  }, [autoRefresh]);

  // Handlers
  const handlePayoutUpdate = () => {
    fetchPayouts();
    setIsDrawerOpen(false);
    setSelectedPayout(null);
  };

  const handleDeleteConfirm = async () => {
    if (!deletePayout) return;
    setIsDeleting(true);
    try {
      const response = await fetch('/api/payouts/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: deletePayout.id }),
      });
      const data = await response.json();
      if (data.ok) {
        await fetchPayouts();
        setDeletePayout(null);
      } else {
        setError(data.error || 'Failed to delete payout');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsDeleting(false);
    }
  };

  const openDrawer = (payout: Payout) => {
    setSelectedPayout(payout);
    setDrawerMode('edit');
    setIsDrawerOpen(true);
  };

  const openCreateDrawer = () => {
    setSelectedPayout(null);
    setDrawerMode('create');
    setIsDrawerOpen(true);
  };

  const openDeleteDialog = (payout: Payout) => {
    setDeletePayout(payout);
  };

  const handleExportCsv = () => {
    const visibleRows = filteredPayouts ?? payouts ?? [];
    if (!visibleRows.length) return;
    const toISO = (t: any) => {
      if (!t) return '';
      if (t instanceof Date) return t.toISOString();
      if (typeof t === 'object' && '_seconds' in t) return new Date(t._seconds * 1000 + Math.floor((t._nanoseconds || 0) / 1e6)).toISOString();
      const d = new Date(t);
      return isNaN(d.getTime()) ? '' : d.toISOString();
    };
    const headers = ['id', 'providerId', 'amount', 'currency', 'status', 'notes', 'source', 'createdAtISO', 'updatedAtISO'];
    const rows = visibleRows.map((p: any) => ({
      id: p.id ?? '',
      providerId: p.providerId ?? '',
      amount: p.amount ?? 0,
      currency: p.currency ?? 'INR',
      status: p.status ?? '',
      notes: p.notes ?? '',
      source: p.source ?? '',
      createdAtISO: toISO(p.createdAt),
      updatedAtISO: toISO(p.updatedAt),
    }));
    const csv = toCsv(headers, rows);
    const ts = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
    downloadCsv(`payouts-${ts}.csv`, csv);
  };

  // Bulk actions
  async function bulkUpdateStatus(ids: string[], status: 'completed' | 'failed') {
    for (const id of ids) {
      try {
        await fetch('/api/payouts/update', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ id, status })
        });
      } catch (e) {
        console.error('update failed', id, e);
      }
    }
  }
  async function bulkDelete(ids: string[]) {
    for (const id of ids) {
      try {
        await fetch('/api/payouts/delete', {
          method: 'DELETE',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ id })
        });
      } catch (e) {
        console.error('delete failed', id, e);
      }
    }
  }
  const handleBulkComplete = async () => {
    if (!selectedIds.length) return;
    setLoadingBulk(true);
    await bulkUpdateStatus(selectedIds, 'completed');
    setLoadingBulk(false);
    setSelectedIds([]);
    await fetchPayouts();
  };
  const handleBulkFail = async () => {
    if (!selectedIds.length) return;
    setLoadingBulk(true);
    await bulkUpdateStatus(selectedIds, 'failed');
    setLoadingBulk(false);
    setSelectedIds([]);
    await fetchPayouts();
  };
  const handleBulkDelete = async () => {
    if (!selectedIds.length) return;
    if (!confirm(`Delete ${selectedIds.length} payout(s)? This cannot be undone.`)) return;
    setLoadingBulk(true);
    await bulkDelete(selectedIds);
    setLoadingBulk(false);
    setSelectedIds([]);
    await fetchPayouts();
  }; // ✅ properly closed

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Payouts</h1>
          <p className="text-gray-600">Manage and track all payout transactions</p>
        </div>
        <button
          onClick={openCreateDrawer}
          className="px-6 py-3 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700"
        >
          New Payout
        </button>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* Toolbar */}
      <div className="bg-white rounded-2xl shadow-sm border p-4 mb-6 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          {/* Search */}
          <input
            type="text"
            placeholder="Search by ID or Provider ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-2 text-sm border rounded-lg"
          />
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | Payout['status'])}
            className="px-3 py-2 text-sm border rounded-lg"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
            <option value="canceled">Canceled</option>
          </select>
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            Auto refresh
          </label>
          <div className="text-xs text-gray-500 hidden sm:block">
            {lastUpdatedAt ? `Last updated: ${lastUpdatedAt.toLocaleTimeString()}` : '—'}
          </div>
          <button
            onClick={handleExportCsv}
            disabled={isLoading || filteredPayouts.length === 0}
            className="px-3 py-2 rounded-md bg-gray-100 hover:bg-gray-200 text-sm"
          >
            Export CSV
          </button>
          <button
            onClick={fetchPayouts}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            {isLoading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* ... table and other UI unchanged ... */}

      <PayoutDrawer
        open={isDrawerOpen}
        payout={selectedPayout}
        mode={drawerMode}
        onClose={() => { setIsDrawerOpen(false); setSelectedPayout(null); }}
        onSaved={handlePayoutUpdate}
      />
      <ConfirmDialog
        open={!!deletePayout}
        title="Delete Payout"
        description={`Are you sure you want to delete payout ${deletePayout?.id}?`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeletePayout(null)}
      />
    </div>
  );
}