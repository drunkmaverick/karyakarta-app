'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export default function AdminAuthGuard({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Skip auth check for login page
    if (pathname === '/admin/login') {
      setIsAuthenticated(true);
      setIsLoading(false);
      return;
    }

    // Check if admin cookie exists
    const checkAuth = () => {
      const adminCookie = document.cookie
        .split('; ')
        .find(row => row.startsWith('admin='));
      
      if (adminCookie && adminCookie.split('=')[1] === '1') {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
        router.push('/admin/login');
      }
      setIsLoading(false);
    };

    // Add a small delay to ensure pathname is available
    const timer = setTimeout(checkAuth, 100);
    return () => clearTimeout(timer);
  }, [router, pathname]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect to login
  }

  return <>{children}</>;
}
