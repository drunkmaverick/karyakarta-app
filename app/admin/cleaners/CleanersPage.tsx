'use client';

import { useEffect, useMemo, useState } from 'react';

type Provider = {
  id: string;
  name: string;
  phone: string;
  area: string;
  active: boolean;
  rating?: number;
  createdAt?: any;
  updatedAt?: any;
};

function StatusPill({ active }: { active: boolean }) {
  return (
    <span
      className={
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ' +
        (active
          ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
          : 'bg-rose-50 text-rose-700 ring-1 ring-rose-200')
      }
    >
      {active ? 'Active' : 'Inactive'}
    </span>
  );
}

export default function CleanersPage() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string>('');

  // filters
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('all');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = [...providers];
    if (q) {
      list = list.filter((p) =>
        [p.name, p.phone, p.area, p.id].some((v) => (v || '').toLowerCase().includes(q))
      );
    }
    if (activeFilter !== 'all') {
      list = list.filter((p) => (activeFilter === 'active' ? p.active : !p.active));
    }
    // newest first (by updatedAt or createdAt)
    list.sort((a, b) => {
      const ta =
        (a.updatedAt?._seconds ?? a.createdAt?._seconds ?? 0) * 1000 +
        Math.floor((a.updatedAt?._nanoseconds ?? a.createdAt?._nanoseconds ?? 0) / 1e6);
      const tb =
        (b.updatedAt?._seconds ?? b.createdAt?._seconds ?? 0) * 1000 +
        Math.floor((b.updatedAt?._nanoseconds ?? b.createdAt?._nanoseconds ?? 0) / 1e6);
      return tb - ta;
    });
    return list;
  }, [providers, query, activeFilter]);

  async function fetchProviders() {
    setLoading(true);
    setErr('');
    try {
      const res = await fetch('/api/providers/list?limit=100', { cache: 'no-store' });
      const data = await res.json();
      if (data.ok) setProviders(data.items || []);
      else setErr(data.error || 'Failed to load providers');
    } catch (e: any) {
      setErr(e?.message || 'Failed to load providers');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchProviders();
  }, []);

  // CRUD helpers (simple prompt-based UI for now)
  async function createProvider() {
    const name = prompt('Provider name:');
    if (!name) return;
    const phone = prompt('Phone (+91-xxxx):') || '';
    const area = prompt('Area/Locality:') || '';
    try {
      const res = await fetch('/api/providers/create', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name, phone, area }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || 'Create failed');
      await fetchProviders();
    } catch (e: any) {
      alert(e.message || 'Create failed');
    }
  }

  async function editProvider(p: Provider) {
    const name = prompt('Name:', p.name) ?? p.name;
    const phone = prompt('Phone:', p.phone) ?? p.phone;
    const area = prompt('Area:', p.area) ?? p.area;
    const activeStr = prompt('Active? (yes/no):', p.active ? 'yes' : 'no') ?? (p.active ? 'yes' : 'no');
    const active = /^y(es)?$/i.test(activeStr);
    try {
      const res = await fetch('/api/providers/update', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ id: p.id, name, phone, area, active }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || 'Update failed');
      await fetchProviders();
    } catch (e: any) {
      alert(e.message || 'Update failed');
    }
  }

  async function deleteProvider(p: Provider) {
    if (!confirm(`Delete provider "${p.name}"? This cannot be undone.`)) return;
    try {
      const res = await fetch('/api/providers/delete', {
        method: 'DELETE',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ id: p.id }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || 'Delete failed');
      await fetchProviders();
    } catch (e: any) {
      alert(e.message || 'Delete failed');
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Providers</h1>
          <p className="text-gray-600">Manage your service providers / cleaners</p>
        </div>
        <button
          onClick={createProvider}
          className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
        >
          + New Provider
        </button>
      </div>

      {/* Error */}
      {err && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-red-700">
          {err}
        </div>
      )}

      {/* Toolbar */}
      <div className="bg-white rounded-2xl shadow-sm border p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex gap-3 w-full sm:w-auto">
            <input
              type="text"
              placeholder="Search name / phone / area / id"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full sm:w-80 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <select
              value={activeFilter}
              onChange={(e) => setActiveFilter(e.target.value as any)}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <button
            onClick={fetchProviders}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading ? 'Loading…' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            <p className="mt-2 text-gray-600">Loading providers…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-500">No providers found</p>
            <button
              onClick={createProvider}
              className="mt-4 px-4 py-2 text-sm font-medium text-green-600 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              Create your first provider
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Phone
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Area
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="font-medium">{p.name}</div>
                      <div className="text-gray-500 text-xs font-mono">{p.id.slice(0, 8)}…</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{p.phone}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{p.area}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusPill active={p.active} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex gap-3">
                        <button
                          onClick={() => editProvider(p)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteProvider(p)}
                          className="text-rose-600 hover:text-rose-900"
                        >
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
    </div>
  );
}