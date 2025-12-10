// app/admin/login/layout.tsx
import { ReactNode } from 'react';

export const metadata = {
  title: 'Admin Login',
};

export default function LoginLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}