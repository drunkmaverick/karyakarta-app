// components/HomeHero.tsx
'use client';
import React from 'react';
import Link from 'next/link';

export default function HomeHero() {
  return (
    <section className="bg-[#f5f7fa] text-[#1a1a1a] py-16 px-6 md:px-12 lg:px-24">
      <div className="max-w-5xl mx-auto text-center">
        <h1 className="text-3xl md:text-5xl font-bold mb-6 leading-tight">
          Maid Services, Reinvented.
        </h1>
        <p className="text-lg md:text-xl mb-8 text-gray-700 max-w-2xl mx-auto">
          Safe, fast and on your terms. Book trusted professionals at the tap of a button.
        </p>
        <Link
          href="/book"
          className="inline-block bg-[#1157d3] text-white px-6 py-3 rounded-md text-lg font-medium hover:bg-[#0e46b6] transition"
        >
          Book Now
        </Link>
      </div>
    </section>
  );
}