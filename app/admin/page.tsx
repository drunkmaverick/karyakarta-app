// app/admin/page.tsx  (server component)
export const metadata = { title: 'Admin' };

import Link from 'next/link';

export default function AdminPage() {
  const items = [
    { href: '/admin/cleaners', label: 'Cleaners' },
    { href: '/admin/payouts', label: 'Payouts' },
    { href: '/admin/jobs', label: 'Jobs' },
    { href: '/admin/analytics', label: 'Analytics' },
  ];

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-4">Admin</h1>
      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {items.map((i) => (
          <li key={i.href}>
            <Link
              href={i.href}
              className="block rounded-lg border p-4 hover:bg-gray-50"
            >
              {i.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}