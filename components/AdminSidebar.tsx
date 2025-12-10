'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';

const logoPath = '/karya-karta-logo copy.png';

const navItems = [
  { name: 'Dashboard', href: '/admin' },
  { name: 'Service Providers', href: '/admin/cleaners' },
  { name: 'Customers', href: '/admin/customers' },
  { name: 'Jobs', href: '/admin/jobs' },
  { name: 'Transactions', href: '/admin/transactions' },
  { name: 'Campaigns', href: '/admin/campaigns' },
  { name: 'Payouts', href: '/admin/payouts' },
  { name: 'Analytics', href: '/admin/analytics' },
  { name: 'Settings', href: '/admin/settings' },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-[#0b3b91] text-white min-h-screen p-6 flex flex-col shadow-xl">
      {/* Logo Section */}
      <div className="flex items-center gap-2 mb-10">
        <Image src={logoPath} alt="Karya Karta Logo" width={36} height={36} />
        <span className="text-xl font-bold tracking-tight">KaryaKarta</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`block px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-white text-[#0b3b91]'
                  : 'hover:bg-[#1157d3]/90 hover:text-white text-white/90'
              }`}
            >
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Logout Button */}
      <div className="mt-auto mb-4">
        <button
          onClick={async () => {
            await fetch('/api/admin/logout', { method: 'POST' });
            window.location.href = '/admin/login';
          }}
          className="w-full px-4 py-2 text-sm font-medium text-white/90 hover:text-white hover:bg-[#1157d3]/90 rounded-lg transition-all duration-200"
        >
          Logout
        </button>
      </div>

      {/* Footer */}
      <footer className="text-xs text-white/60">
        &copy; {new Date().getFullYear()} KaryaKarta
      </footer>
    </aside>
  );
}