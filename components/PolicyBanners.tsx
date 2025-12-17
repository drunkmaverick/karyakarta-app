'use client';
import React from 'react';
import { ShieldCheck, RefreshCcw, Clock } from 'lucide-react';

const policies = [
  {
    icon: <ShieldCheck className="w-6 h-6 text-blue-600" />,
    title: "Instant Replacement Guarantee",
    description: "If the service is not up to mark or gets cancelled, we'll make it right instantly.",
  },
  {
    icon: <RefreshCcw className="w-6 h-6 text-blue-600" />,
    title: "7-Day Service Warranty",
    description: "For cleaning services. If issues arise, we'll fix it at no cost.",
  },
  {
    icon: <Clock className="w-6 h-6 text-blue-600" />,
    title: "Anytime Support",
    description: "Need urgent help? We offer round-the-clock service availability in most areas.",
  },
];

export default function PolicyBanners() {
  return (
    <section className="px-4 py-6 md:px-12 bg-white">
      <h2 className="text-lg md:text-xl font-semibold text-gray-800 mb-4">Why Choose KaryaKarta</h2>
      <div className="grid md:grid-cols-3 gap-4">
        {policies.map((policy, index) => (
          <div key={index} className="flex items-start gap-3 p-4 border rounded-lg shadow-sm bg-gray-50">
            <div className="flex-shrink-0">{policy.icon}</div>
            <div>
              <h3 className="font-medium text-gray-800">{policy.title}</h3>
              <p className="text-sm text-gray-600">{policy.description}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}