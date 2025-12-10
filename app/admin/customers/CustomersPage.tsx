'use client';

import { useState, useEffect } from 'react';
import { Customer } from './types';
import { mapApiCustomerToType, formatTimestamp, toCsv, downloadCsv } from './utils';
import StatusBadge from './components/StatusBadge';
import ConfirmDialog from './components/ConfirmDialog';
import CustomerDrawer from './components/CustomerDrawer';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // UI state
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<'create' | 'edit'>('edit');
  const [deleteCustomer, setDeleteCustomer] = useState<Customer | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loadingBulk, setLoadingBulk] = useState(false);

  // Selection helpers
  const isSelected = (id: string) => selectedIds.includes(id);
  const toggleOne = (id: string) =>
    setSelectedIds(prev => isSelected(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const toggleAllVisible = () => {
    const ids = (filteredCustomers ?? customers ?? []).map(c => c.id).filter(Boolean);
    const allSelected = ids.every(id => selectedIds.includes(id));
    setSelectedIds(allSelected ? selectedIds.filter(id => !ids.includes(id)) : Array.from(new Set([...selectedIds, ...ids])));
  };

  // Clear selection when dataset changes
  useEffect(() => {
    setSelectedIds([]);
  }, [filteredCustomers, customers]);

  // Fetch customers
  const fetchCustomers = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await fetch('/api/customers/list?limit=100', { cache: 'no-store' });
      const data = await response.json();
      if (data.ok && data.items) {
        const normalizedCustomers = data.items.map(mapApiCustomerToType);
        setCustomers(normalizedCustomers);
      } else {
        setError(data.error || 'Failed to fetch customers');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  // Apply filters
  useEffect(() => {
    let filtered = [...customers];
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        customer =>
          customer.id.toLowerCase().includes(query) ||
          customer.name.toLowerCase().includes(query) ||
          customer.phone.toLowerCase().includes(query) ||
          (customer.email && customer.email.toLowerCase().includes(query)) ||
          customer.area.toLowerCase().includes(query)
      );
    }
    if (statusFilter !== 'all') {
      filtered = filtered.filter(customer => 
        statusFilter === 'active' ? customer.active : !customer.active
      );
    }
    filtered.sort((a, b) => {
      if (a.createdAt && b.createdAt) {
        const aTime = a.createdAt._seconds || 0;
        const bTime = b.createdAt._seconds || 0;
        return bTime - aTime;
      }
      return 0;
    });
    setFilteredCustomers(filtered);
  }, [customers, searchQuery, statusFilter]);

  // Initial fetch
  useEffect(() => {
    fetchCustomers();
  }, []);

  // Handlers
  const handleCustomerUpdate = () => {
    fetchCustomers();
    setIsDrawerOpen(false);
    setSelectedCustomer(null);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteCustomer) return;
    setIsDeleting(true);
    try {
      const response = await fetch('/api/customers/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: deleteCustomer.id }),
      });
      const data = await response.json();
      if (data.ok) {
        await fetchCustomers();
        setDeleteCustomer(null);
      } else {
        setError(data.error || 'Failed to delete customer');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsDeleting(false);
    }
  };

  const openDrawer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setDrawerMode('edit');
    setIsDrawerOpen(true);
  };

  const openCreateDrawer = () => {
    setSelectedCustomer(null);
    setDrawerMode('create');
    setIsDrawerOpen(true);
  };

  const openDeleteDialog = (customer: Customer) => {
    setDeleteCustomer(customer);
  };

  const handleExportCsv = () => {
    const visibleRows = filteredCustomers ?? customers ?? [];
    if (!visibleRows.length) return;
    const toISO = (t: any) => {
      if (!t) return '';
      if (t instanceof Date) return t.toISOString();
      if (typeof t === 'object' && '_seconds' in t) return new Date(t._seconds * 1000 + Math.floor((t._nanoseconds || 0) / 1e6)).toISOString();
      const d = new Date(t);
      return isNaN(d.getTime()) ? '' : d.toISOString();
    };
    const headers = ['id', 'name', 'phone', 'email', 'area', 'active', 'notes', 'createdAtISO', 'updatedAtISO'];
    const rows = visibleRows.map((c: any) => ({
      id: c.id ?? '',
      name: c.name ?? '',
      phone: c.phone ?? '',
      email: c.email ?? '',
      area: c.area ?? '',
      active: c.active ?? true,
      notes: c.notes ?? '',
      createdAtISO: toISO(c.createdAt),
      updatedAtISO: toISO(c.updatedAt),
    }));
    const csv = toCsv(headers, rows);
    const ts = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
    downloadCsv(`customers-${ts}.csv`, csv);
  };

  // Bulk actions
  async function bulkDelete(ids: string[]) {
    for (const id of ids) {
      try {
        await fetch('/api/customers/delete', {
          method: 'DELETE',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ id })
        });
      } catch (e) {
        console.error('delete failed', id, e);
      }
    }
  }

  const handleBulkDelete = async () => {
    if (!selectedIds.length) return;
    if (!confirm(`Delete ${selectedIds.length} customer(s)? This cannot be undone.`)) return;
    setLoadingBulk(true);
    await bulkDelete(selectedIds);
    setLoadingBulk(false);
    setSelectedIds([]);
    await fetchCustomers();
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Customers</h1>
          <p className="text-gray-600">Manage customer information and bookings</p>
        </div>
        <button
          onClick={openCreateDrawer}
          className="px-6 py-3 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700"
        >
          New Customer
        </button>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* Bulk Action Bar */}
      {selectedIds.length > 0 && (
        <div className="mb-3 flex items-center justify-between rounded-md border p-3 bg-white">
          <div className="text-sm text-gray-700">
            {selectedIds.length} selected
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={handleBulkDelete} 
              disabled={loadingBulk} 
              className="px-3 py-2 rounded-md bg-rose-600 text-white text-sm disabled:opacity-60"
            >
              {loadingBulk ? 'Deleting...' : 'Delete Selected'}
            </button>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="bg-white rounded-2xl shadow-sm border p-4 mb-6 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          {/* Search */}
          <input
            type="text"
            placeholder="Search by ID, name, phone, email, or area..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-2 text-sm border rounded-lg"
          />
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
            className="px-3 py-2 text-sm border rounded-lg"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCsv}
            disabled={isLoading || filteredCustomers.length === 0}
            className="px-3 py-2 rounded-md bg-gray-100 hover:bg-gray-200 text-sm"
          >
            Export CSV
          </button>
          <button
            onClick={fetchCustomers}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            {isLoading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-3 py-2">
                  <input
                    type="checkbox"
                    aria-label="Select all"
                    checked={(filteredCustomers ?? customers ?? []).length > 0 &&
                             (filteredCustomers ?? customers ?? []).every(c => selectedIds.includes(c.id))}
                    onChange={toggleAllVisible}
                    disabled={(filteredCustomers ?? customers ?? []).length === 0}
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Phone
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Area
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Notes
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={10} className="px-6 py-12 text-center text-gray-500">
                    Loading customers...
                  </td>
                </tr>
              ) : filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-6 py-12 text-center text-gray-500">
                    {customers.length === 0 ? 'No customers found' : 'No customers match your filters'}
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2">
                      <input
                        type="checkbox"
                        aria-label={`Select customer ${customer.id}`}
                        checked={isSelected(customer.id)}
                        onChange={() => toggleOne(customer.id)}
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatTimestamp(customer.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                      {customer.id.slice(0, 8)}...
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {customer.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {customer.phone}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {customer.email || '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {customer.area}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge active={customer.active} />
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                      {customer.notes || '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => openDrawer(customer)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => openDeleteDialog(customer)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <CustomerDrawer
        open={isDrawerOpen}
        customer={selectedCustomer}
        mode={drawerMode}
        onClose={() => { setIsDrawerOpen(false); setSelectedCustomer(null); }}
        onSaved={handleCustomerUpdate}
      />
      <ConfirmDialog
        open={!!deleteCustomer}
        title="Delete Customer"
        description={`Are you sure you want to delete customer ${deleteCustomer?.name}?`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteCustomer(null)}
        loading={isDeleting}
      />
    </div>
  );
}
