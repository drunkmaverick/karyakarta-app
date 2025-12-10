import { NextResponse } from 'next/server';

export async function GET() {
  const pick = (k: string) => process.env[k] ?? null;
  return NextResponse.json({
    FIRESTORE_EMULATOR_HOST: pick('FIRESTORE_EMULATOR_HOST'),
    FIREBASE_PROJECT_ID: pick('FIREBASE_PROJECT_ID'),
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: pick('NEXT_PUBLIC_FIREBASE_PROJECT_ID'),
    FIREBASE_CLIENT_EMAIL: pick('FIREBASE_CLIENT_EMAIL'),
  });
}




































