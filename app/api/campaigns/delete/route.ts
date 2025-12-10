import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '../../_lib/requireAdmin';
import { db } from '../../../../lib/firebaseAdmin';

export const dynamic = 'force-dynamic';

export async function DELETE(request: NextRequest) {
  try {
    // Check admin authentication
    const adminCheck = requireAdmin(request);
    if (adminCheck) return adminCheck;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Campaign ID is required' },
        { status: 400 }
      );
    }

    const useMock = process.env.USE_MOCK === '1';

    if (useMock) {
      // Mock delete for testing
      console.log('Mock delete for campaign:', id);

      return NextResponse.json({
        success: true,
        message: 'Campaign deleted successfully'
      });
    }

    // Real Firestore implementation
    if (!db) {
      return NextResponse.json(
        { success: false, error: 'Database not available' },
        { status: 500 }
      );
    }
    
    await db.collection('campaigns').doc(id).delete();

    return NextResponse.json({
      success: true,
      message: 'Campaign deleted successfully'
    });

  } catch (error: any) {
    console.error('Error deleting campaign:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}