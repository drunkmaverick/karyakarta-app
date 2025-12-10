import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // PASTE HERE payout listing logic
    return NextResponse.json({ success: true, payouts: [] });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Failed to fetch payouts' },
      { status: 500 }
    );
  }
}









































