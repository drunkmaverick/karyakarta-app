'use client';
import React from 'react';

const services = [
  {
    name: 'Maid Service',
    status: 'available',
    emoji: '🧼',
    description: 'Daily and periodic home cleaning services.',
  },
  {
    name: 'Plumbing',
    status: 'coming-soon',
    emoji: '🛠️',
    description: 'Fix leaks, install taps, and more.',
  },
  {
    name: 'Electricals',
    status: 'coming-soon',
    emoji: '💡',
    description: 'Switches, wiring, appliance setup.',
  },
];

export default function HomeServices() {
  return (
    <section className="px-6 py-10 bg-white">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Our Services</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {services.map((s) => (
          <div
            key={s.name}
            className={`border rounded-lg p-4 shadow-sm transition ${
              s.status === 'coming-soon'
                ? 'bg-gray-100 opacity-60 cursor-not-allowed'
                : 'bg-blue-50 hover:shadow-md'
            }`}
          >
            <div className="text-4xl mb-2">{s.emoji}</div>
            <h3 className="text-lg font-semibold">{s.name}</h3>
            <p className="text-sm text-gray-600">{s.description}</p>

            {s.status === 'coming-soon' && (
              <span className="inline-block mt-2 text-xs px-2 py-1 bg-yellow-300 text-gray-800 rounded-full">
                Coming Soon
              </span>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}