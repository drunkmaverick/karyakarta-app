import './globals.css';
import { ToastProvider } from '../components/ui/Toast';
import OfflineBar from '../components/ui/OfflineBar';
import DevFooter from '../components/DevFooter';
import GlobalErrorBoundary from '../src/components/GlobalErrorBoundary';

export const metadata = {
  title: 'KaryaKarta',
  description: 'Admin & ops dashboard',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 text-gray-900 antialiased">
        <GlobalErrorBoundary>
          <ToastProvider>
            <OfflineBar />
            {children}
            <DevFooter />
          </ToastProvider>
        </GlobalErrorBoundary>
      </body>
    </html>
  );
}
