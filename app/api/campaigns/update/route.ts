import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '../../_lib/requireAdmin';
import { db } from '../../../../lib/firebaseAdmin';
import { UpdateCampaignRequest } from '../_types';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Check admin authentication
    const adminCheck = requireAdmin(request);
    if (adminCheck) return adminCheck;

    const body: UpdateCampaignRequest = await request.json();

    if (!body.id) {
      return NextResponse.json(
        { success: false, error: 'Campaign ID is required' },
        { status: 400 }
      );
    }

    const useMock = process.env.USE_MOCK === '1';

    if (useMock) {
      // Mock update for testing
      console.log('Mock update for campaign:', body.id, 'with data:', body);

      return NextResponse.json({
        success: true,
        message: 'Campaign updated successfully'
      });
    }

    // Real Firestore implementation
    if (!db) {
      return NextResponse.json(
        { success: false, error: 'Database not available' },
        { status: 500 }
      );
    }
    
    const docRef = db.collection('campaigns').doc(body.id);
    
    // Prepare update data (exclude id from update)
    const { id, ...updateData } = body;
    const finalUpdateData = {
      ...updateData,
      updatedAt: new Date()
    };
    
    await docRef.update(finalUpdateData);

    return NextResponse.json({
      success: true,
      message: 'Campaign updated successfully'
    });

  } catch (error: any) {
    console.error('Error updating campaign:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}