'use client';
import React, { useEffect, useState } from 'react';
import { useAuth } from '../../src/hooks/useAuth';
import { getCurrentUserData } from '../../src/services/auth';
import { getUserBookings } from '../../src/services/bookings';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../src/services/firebase';
import { useRouter } from 'next/navigation';
import { Shield, ExternalLink } from 'lucide-react';

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [form, setForm] = useState({ name: '', phone: '', address: '' });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [bookings, setBookings] = useState<any[]>([]);
  const [bookingLoading, setBookingLoading] = useState(true);

  // Fetch user data
  useEffect(() => {
    const fetchUser = async () => {
      if ((user as any)?.uid) {
        const res = await getCurrentUserData((user as any).uid);
        if (res.success) {
          setForm({
            name: res.userData?.name || '',
            phone: res.userData?.phone || '',
            address: res.userData?.address || ''
          });
        }
      }
    };
    fetchUser();
  }, [user]);

  // Fetch bookings
  useEffect(() => {
    const fetchBookings = async () => {
      if (!(user as any)?.uid) return;
      setBookingLoading(true);
      const res = await getUserBookings((user as any).uid);
      if (res.success) setBookings(res.bookings || []);
      setBookingLoading(false);
    };
    fetchBookings();
  }, [user]);

  if (!loading && !user) {
    router.push('/login');
    return null;
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage('');

    try {
      const ref = doc(db, 'users', (user as any).uid);
      await updateDoc(ref, {
        name: form.name,
        phone: form.phone,
        address: form.address
      });
      setMessage('✅ Profile updated!');
    } catch (err) {
      console.error("🔥 Failed to update profile:", err);
      setMessage('❌ Failed to update.');
    }

    setSaving(false);
  };

  const handleCancelBooking = async (id: string) => {
    const confirm = window.confirm('Are you sure you want to cancel this booking?');
    if (!confirm) return;
    try {
      await updateDoc(doc(db, 'bookings', id), {
        status: 'cancelled',
        updatedAt: new Date()
      });
      setBookings(bookings.map(b => b.id === id ? { ...b, status: 'cancelled' } : b));
    } catch (err) {
      alert("❌ Failed to cancel booking.");
    }
  };

  const handleReschedule = async (id: string) => {
    const newDate = prompt('Enter new date (YYYY-MM-DD):');
    const newTime = prompt('Enter new time (e.g. 10:00 AM):');
    if (!newDate || !newTime) return;
    try {
      await updateDoc(doc(db, 'bookings', id), {
        date: newDate,
        time: newTime,
        status: 'pending',
        updatedAt: new Date()
      });
      setBookings(bookings.map(b => b.id === id ? { ...b, date: newDate, time: newTime, status: 'pending' } : b));
    } catch (err) {
      alert("❌ Failed to reschedule booking.");
    }
  };

  const handleFeedback = async (id: string) => {
    const comment = prompt('Leave your feedback:');
    const ratingStr = prompt('Give a rating out of 5:');
    const rating = parseInt(ratingStr || '0');
    if (!comment || isNaN(rating)) return;

    try {
      await updateDoc(doc(db, 'bookings', id), {
        feedback: {
          comment,
          rating
        },
        updatedAt: new Date()
      });
      alert("✅ Feedback submitted!");
    } catch (err) {
      alert("❌ Failed to submit feedback.");
    }
  };

  return (
    <main className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">My Profile</h1>

      <label className="block mb-2">
        Name:
        <input
          name="name"
          value={form.name}
          onChange={handleChange}
          className="w-full border rounded p-2 mt-1"
        />
      </label>

      <label className="block mb-2">
        Phone:
        <input
          name="phone"
          value={form.phone}
          onChange={handleChange}
          className="w-full border rounded p-2 mt-1"
        />
      </label>

      <label className="block mb-4">
        Address:
        <textarea
          name="address"
          value={form.address}
          onChange={handleChange}
          className="w-full border rounded p-2 mt-1"
        />
      </label>

      <button
        onClick={handleSave}
        disabled={saving}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        {saving ? 'Saving...' : 'Save'}
      </button>

      {message && <p className="mt-3 text-sm">{message}</p>}

      {/* Privacy Policy Link */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg border">
        <button
          onClick={() => window.open('/privacy.html', '_blank')}
          className="flex items-center space-x-3 w-full p-2 rounded-lg hover:bg-white transition-colors group"
        >
          <Shield className="w-5 h-5 text-gray-400 group-hover:text-blue-600" />
          <div className="flex-1 text-left">
            <p className="text-sm font-medium text-gray-900 group-hover:text-blue-600">
              Privacy Policy
            </p>
            <p className="text-xs text-gray-500">
              Learn how we collect and protect your data
            </p>
          </div>
          <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-blue-600" />
        </button>
      </div>

      <hr className="my-6" />

      <h2 className="text-xl font-bold mb-4">My Bookings</h2>
      {bookingLoading ? (
        <p>Loading bookings...</p>
      ) : bookings.length === 0 ? (
        <p>No bookings found.</p>
      ) : (
        <div className="space-y-4">
          {bookings.map(b => (
            <div key={b.id} className="border p-3 rounded bg-white shadow-sm">
              <div className="flex justify-between items-center mb-1">
                <strong>{b.date} – {b.time}</strong>
                <span className="text-xs uppercase bg-gray-200 text-gray-700 px-2 py-0.5 rounded">
                  {b.status}
                </span>
              </div>
              <p className="text-sm">📍 {b.address}</p>
              {b.assignedTo && (
                <p className="text-sm text-gray-500">Assigned to: {b.assignedTo}</p>
              )}

              <div className="mt-2 flex flex-wrap gap-2">
                {(b.status !== 'cancelled' && b.status !== 'completed') && (
                  <>
                    <button onClick={() => handleReschedule(b.id)} className="text-sm px-3 py-1 bg-yellow-100 text-yellow-800 rounded border border-yellow-300 hover:bg-yellow-200">
                      Reschedule
                    </button>
                    <button onClick={() => handleCancelBooking(b.id)} className="text-sm px-3 py-1 bg-red-100 text-red-800 rounded border border-red-300 hover:bg-red-200">
                      Cancel
                    </button>
                  </>
                )}

                {b.status === 'completed' && !b.feedback && (
                  <button onClick={() => handleFeedback(b.id)} className="text-sm px-3 py-1 bg-blue-100 text-blue-800 rounded border border-blue-300 hover:bg-blue-200">
                    Leave Feedback
                  </button>
                )}
              </div>

              {b.feedback && (
                <p className="mt-2 text-sm text-green-700">⭐ {b.feedback.rating}/5 – “{b.feedback.comment}”</p>
              )}
            </div>
          ))}
        </div>
      )}
    </main>
  );
}