// app/admin/layout.tsx
import { ReactNode } from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import AdminSidebar from '../../components/AdminSidebar';

export const metadata = {
  title: 'Admin',
  description: 'Admin dashboard for Karya Karta',
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  const cookieStore = cookies();
  const isAdmin = cookieStore.get('admin')?.value === '1';

  // Allow the login subtree to bypass this layout (login has its own layout below)
  // This layout is used for /admin and deeper except /admin/login due to separate layout.tsx there.
  if (!isAdmin) {
    redirect('/admin/login');
  }

  return (
    <div className="flex">
      <AdminSidebar />
      <main className="flex-1 p-6 bg-[#f9fafb] min-h-screen">{children}</main>
    </div>
  );
}