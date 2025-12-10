'use client';
import React, { useEffect, useState } from 'react';
import { useAuth } from '../../src/hooks/useAuth';
import { getUserBookings } from '../../src/services/bookings';
import { useRouter } from 'next/navigation';

export default function BookingListPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [bookings, setBookings] = useState<any[]>([]);
  const [fetching, setFetching] = useState(true);

  const fetchBookings = async () => {
    if (!user) return;
    setFetching(true);
    const result = await getUserBookings((user as any).uid);
    if (result.success) {
      setBookings(result.bookings || []);
    }
    setFetching(false);
  };

  useEffect(() => {
    if (user) {
      fetchBookings();
    }
  }, [user]);

  if (loading || fetching) return <p className="p-6">Loading...</p>;
  if (!user) {
    router.push('/login');
    return null;
  }

  return (
    <main className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">My Bookings</h1>

      <button
        onClick={fetchBookings}
        className="text-sm text-blue-600 underline mb-4"
      >
        Refresh
      </button>

      {bookings.length === 0 ? (
        <p className="text-gray-600">No bookings yet.</p>
      ) : (
        <div className="space-y-4">
          {bookings.map((b) => (
            <div key={b.id} className="border rounded p-4 bg-white shadow-sm">
              <p className="font-medium">{b.address}</p>
              <p className="text-sm text-gray-600">
                {b.date} at {b.time}
              </p>
              <p className="text-sm mt-1">
                Status: <span className="font-semibold">{b.status}</span>
              </p>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}