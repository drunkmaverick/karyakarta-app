import { NextResponse } from 'next/server';
import { getAppVersion } from '../../../src/lib/version';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const version = getAppVersion();
    
    return NextResponse.json({
      ok: true,
      version
    });
  } catch (error: any) {
    console.error('Error getting version info:', error);
    return NextResponse.json(
      { ok: false, error: error.message || 'Failed to get version info' },
      { status: 500 }
    );
  }
}
