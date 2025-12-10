'use client';
import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// Firebase
import { db } from '../../src/services/firebase';
import {
  getAuth,
  signInWithEmailAndPassword,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  onAuthStateChanged,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
} from 'firebase/firestore';

type Tab = 'email' | 'phone';

export default function LoginPage() {
  const router = useRouter();
  const auth = getAuth();
  const [activeTab, setActiveTab] = useState<Tab>('email');

  // Email login state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);

  // Phone login state
  const [phone, setPhone] = useState('+91');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [phoneLoading, setPhoneLoading] = useState(false);
  const confirmationResultRef = useRef<any>(null);
  const recaptchaRef = useRef<HTMLDivElement | null>(null);
  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);

  const [message, setMessage] = useState<string>('');

  // ---------- Role helpers ----------
  const isProviderRole = (val?: string | null) => {
    if (!val) return false;
    const r = val.toLowerCase();
    return r === 'service_provider' || r === 'provider' || r === 'worker'; // backward compatible
  };

  const goToByRole = async (uid: string, fallbackEmail?: string | null) => {
    // 1) Prefer users/<uid>.role
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) {
      const data = userDoc.data() as any;
      const role = data?.role || '';
      if (isProviderRole(role)) {
        router.push('/provider/dashboard');
        return;
      }
      if (role && role.toLowerCase() === 'customer' || role.toLowerCase() === 'user') {
        router.push('/customer/dashboard');
        return;
      }
    }

    // 2) Fallback: infer role by email in collections
    if (fallbackEmail) {
      // Prefer a future ServiceProviders collection first
      const spQ = query(collection(db, 'ServiceProviders'), where('email', '==', fallbackEmail));
      const workerQ = query(collection(db, 'Worker'), where('email', '==', fallbackEmail)); // current collection
      const customerQ = query(collection(db, 'Customer'), where('email', '==', fallbackEmail));

      const [spSnap, workerSnap, customerSnap] = await Promise.all([
        getDocs(spQ).catch(() => ({ empty: true } as any)),
        getDocs(workerQ).catch(() => ({ empty: true } as any)),
        getDocs(customerQ).catch(() => ({ empty: true } as any)),
      ]);

      if (spSnap && !spSnap.empty) {
        router.push('/provider/dashboard');
        return;
      }
      if (workerSnap && !workerSnap.empty) {
        router.push('/provider/dashboard');
        return;
      }
      if (customerSnap && !customerSnap.empty) {
        router.push('/customer/dashboard');
        return;
      }
    }

    // 3) Last resort
    router.push('/dashboard');
  };

  // Auto-redirect if already logged in
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (u) {
        await goToByRole(u.uid, u.email);
      }
    });
    return () => unsub();
  }, []);

  // ---------- Email / Password ----------
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setEmailLoading(true);
    try {
      const res = await signInWithEmailAndPassword(auth, email.trim(), password);
      await goToByRole(res.user.uid, res.user.email);
    } catch (err: any) {
      setMessage(err?.message || 'Failed to sign in.');
    } finally {
      setEmailLoading(false);
    }
  };

  // ---------- Phone / OTP ----------
  const ensureRecaptcha = () => {
    // RecaptchaVerifier must run only in the browser and needs the Auth instance explicitly.
    if (typeof window === 'undefined') return null;
    const container = document.getElementById('recaptcha-container');
    if (!container) return null;
    if (!recaptchaVerifierRef.current) {
      // Note: RecaptchaVerifier(auth, container, params) required by firebase/auth types.
      recaptchaVerifierRef.current = new RecaptchaVerifier(
        auth,
        container,
        { size: 'invisible', callback: () => {} }
      );
    }
    return recaptchaVerifierRef.current;
  };

  const sendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setPhoneLoading(true);

    try {
      const verifier = ensureRecaptcha();
      if (!verifier) throw new Error('reCAPTCHA not ready');

      const normalized = phone.trim();
      if (!normalized.startsWith('+') || normalized.length < 10) {
        throw new Error('Please enter phone in E.164 format, e.g. +919876543210');
        }

      const result = await signInWithPhoneNumber(auth, normalized, verifier);
      confirmationResultRef.current = result;
      setOtpSent(true);
      setMessage('OTP sent. Please check your phone.');
    } catch (err: any) {
      setMessage(err?.message || 'Failed to send OTP.');
      try {
        recaptchaVerifierRef.current?.clear();
        recaptchaVerifierRef.current = null;
      } catch {}
    } finally {
      setPhoneLoading(false);
    }
  };

  const verifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setPhoneLoading(true);
    try {
      if (!confirmationResultRef.current) {
        throw new Error('Please request OTP first.');
      }
      const cred = await confirmationResultRef.current.confirm(otp.trim());
      await goToByRole(cred.user.uid, cred.user.email);
    } catch (err: any) {
      setMessage(err?.message || 'Invalid OTP.');
    } finally {
      setPhoneLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      {/* reCAPTCHA anchor (invisible) */}
      <div id="recaptcha-container" ref={recaptchaRef} />

      <div className="w-full max-w-xl bg-white rounded-2xl shadow-md p-6 md:p-8">
        <h1 className="text-2xl font-bold text-[#1157d3] mb-1">Welcome back</h1>
        <p className="text-gray-600 mb-6">Sign in to continue to KaryaKarta</p>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('email')}
            className={`px-4 py-2 rounded-lg text-sm font-medium border ${
              activeTab === 'email'
                ? 'bg-[#1157d3] text-white border-[#1157d3]'
                : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100'
            }`}
          >
            Email / Password
          </button>
          <button
            onClick={() => setActiveTab('phone')}
            className={`px-4 py-2 rounded-lg text-sm font-medium border ${
              activeTab === 'phone'
                ? 'bg-[#1157d3] text-white border-[#1157d3]'
                : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100'
            }`}
          >
            Phone OTP
          </button>
        </div>

        {/* Forms */}
        {activeTab === 'email' ? (
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1157d3]"
                placeholder="you@example.com"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Password</label>
              <input
                type="password"
                value={password}
                minLength={6}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1157d3]"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={emailLoading}
              className="w-full bg-[#1157d3] hover:bg-[#0f4ec0] text-white rounded-md py-2 font-semibold"
            >
              {emailLoading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
        ) : (
          <div className="space-y-4">
            {!otpSent ? (
              <form onSubmit={sendOtp} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Phone Number (with country code)
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1157d3]"
                    placeholder="+919876543210"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={phoneLoading}
                  className="w-full bg-[#1157d3] hover:bg-[#0f4ec0] text-white rounded-md py-2 font-semibold"
                >
                  {phoneLoading ? 'Sending OTP…' : 'Send OTP'}
                </button>
              </form>
            ) : (
              <form onSubmit={verifyOtp} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Enter OTP</label>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1157d3]"
                    placeholder="6-digit code"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={phoneLoading}
                  className="w-full bg-[#1157d3] hover:bg-[#0f4ec0] text-white rounded-md py-2 font-semibold"
                >
                  {phoneLoading ? 'Verifying…' : 'Verify & Sign In'}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setOtp('');
                    setOtpSent(false);
                    try {
                      recaptchaVerifierRef.current?.clear();
                      recaptchaVerifierRef.current = null;
                    } catch {}
                  }}
                  className="w-full mt-1 text-sm text-[#1157d3] underline"
                >
                  Use a different number
                </button>
              </form>
            )}
          </div>
        )}

        {message && (
          <p className="mt-4 text-sm text-red-600">
            {message}
          </p>
        )}

        <div className="mt-6 text-sm text-gray-600">
          Don’t have an account?{' '}
          <Link href="/signup" className="text-[#1157d3] font-semibold underline">
            Create one
          </Link>
        </div>
      </div>
    </main>
  );
}