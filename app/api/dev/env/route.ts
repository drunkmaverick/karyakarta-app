import { NextResponse } from 'next/server';
export async function GET() {
  const pick = (k:string)=>process.env[k] ?? null;
  return NextResponse.json({
    FIRESTORE_EMULATOR_HOST: pick('FIRESTORE_EMULATOR_HOST'),
    FIREBASE_AUTH_EMULATOR_HOST: pick('FIREBASE_AUTH_EMULATOR_HOST'),
    FIREBASE_PROJECT_ID: pick('FIREBASE_PROJECT_ID'),
    GCLOUD_PROJECT: pick('GCLOUD_PROJECT'),
  });
}




































