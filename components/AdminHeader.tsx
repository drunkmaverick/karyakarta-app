'use client';
import React from 'react';

export default function AdminHeader({ title }: { title: string }) {
  return (
    <div className="w-full bg-white px-6 py-4 shadow-sm border-b mb-6">
<h1 className="text-xl font-semibold text-[#1157d3]">
  {title || 'KaryaKarta'}
</h1>
    </div>
  );
}