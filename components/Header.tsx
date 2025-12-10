'use client';
import Image from 'next/image';
import { FaBell } from 'react-icons/fa';

export default function Header() {
  return (
    <header className="bg-white shadow-sm border-b">
      <div className="flex items-center justify-between px-4 py-3 max-w-7xl mx-auto">
        {/* Logo (centered via flex-grow hack) */}
        <div className="flex-1 text-center">
          <Image
            src="/karya-karta-logo copy.png"
            alt="KaryaKarta"
            width={120}
            height={40}
            className="mx-auto"
          />
        </div>

        {/* Notification + Profile */}
        <div className="flex items-center gap-4">
          <FaBell className="text-gray-500 text-lg" />
          <Image
  src="/default-avatar.png"
  alt="User Avatar"
  width={32}
  height={32}
  className="rounded-full object-cover"
/>        </div>
      </div>
    </header>
  );
}