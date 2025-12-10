import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '../../_lib/requireAdmin';
import { db, messaging } from '../../../../lib/firebaseAdmin';

export const dynamic = 'force-dynamic';

// Haversine distance calculation
function distanceMeters(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = (b.lat - a.lat) * Math.PI / 180;
  const dLng = (b.lng - a.lng) * Math.PI / 180;
  const lat1 = a.lat * Math.PI / 180;
  const lat2 = b.lat * Math.PI / 180;

  const a1 = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLng / 2) * Math.sin(dLng / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a1), Math.sqrt(1 - a1));

  return R * c;
}

// In-memory cooldown tracking (in production, use Redis or database)
const campaignCooldowns = new Map<string, number>();

export async function POST(request: NextRequest) {
  try {
    // Check admin authentication
    const adminCheck = requireAdmin(request);
    if (adminCheck) return adminCheck;

    const { campaignId, center, radiusMeters, dryRun } = await request.json();
    const useMock = process.env.USE_MOCK === '1';
    
    if (!campaignId) {
      return NextResponse.json(
        { ok: false, error: 'Campaign ID is required' },
        { status: 400 }
      );
    }

    // Check cooldown (skip for dry run)
    if (!dryRun) {
      const now = Date.now();
      const lastSent = campaignCooldowns.get(campaignId);
      const cooldownMs = 30 * 1000; // 30 seconds
      
      if (lastSent && (now - lastSent) < cooldownMs) {
        const remainingSeconds = Math.ceil((cooldownMs - (now - lastSent)) / 1000);
        return NextResponse.json(
          { ok: false, error: `Please wait ${remainingSeconds} seconds before sending another notification for this campaign` },
          { status: 429 }
        );
      }
    }

    let campaign: any;
    let targetedUsers: string[] = [];
    let tokensToNotify: string[] = [];

    if (useMock) {
      // Mock campaign data for testing
      campaign = {
        name: 'Test Campaign',
        description: 'A test campaign for development',
        area: { lat: 19.123, lng: 72.835, radiusM: 2000 }
      };

      // Mock customer data for testing
      targetedUsers = ['user1', 'user2', 'user3'];
      tokensToNotify = ['token1', 'token2', 'token3'];
    } else {
      // Real Firestore implementation
      if (!db) {
        return NextResponse.json(
          { ok: false, error: 'Database not available' },
          { status: 500 }
        );
      }
      
      // Get campaign details
      const campaignRef = db.collection('campaigns').doc(campaignId);
      const campaignDoc = await campaignRef.get();

      if (!campaignDoc.exists) {
        return NextResponse.json(
          { ok: false, error: 'Campaign not found' },
          { status: 404 }
        );
      }

      campaign = campaignDoc.data()!;
      const campaignCenter = center || campaign.center;
      const radiusM = radiusMeters || (campaign.radiusKm * 1000) || 2000;

      // Get all push tokens with location data
      // Note: Firestore doesn't allow multiple != filters, so we'll get all and filter in code
      const pushTokensSnapshot = await db.collection('pushTokens').get();

      pushTokensSnapshot.forEach((doc) => {
        const tokenData = doc.data();
        const location = { lat: tokenData.lat, lng: tokenData.lng };

        if (location && tokenData.token) {
          const distance = distanceMeters(campaignCenter, location);

          if (distance <= radiusM) {
            if (tokenData.uid) {
              targetedUsers.push(tokenData.uid);
            }
            tokensToNotify.push(tokenData.token);
          }
        }
      });
    }

    let sentCount = 0;
    let failureCount = 0;
    let cleanedTokenCount = 0;

    if (useMock) {
      // Mock response
      sentCount = tokensToNotify.length;
      console.log('FCM not configured - mock mode:', {
        targetedUsers: targetedUsers.length,
        tokensToNotify: tokensToNotify.length,
        campaign: campaign.name
      });
    } else {
      // Real FCM implementation
      if (!messaging) {
        throw new Error('FCM not initialized - check Firebase credentials');
      }
      
      if (tokensToNotify.length > 0) {
        try {
          // Send multicast message using FCM
          const message = {
            notification: {
              title: `New Campaign: ${campaign.title}`,
              body: campaign.description || 'Check out this new cleaning campaign near you!',
            },
            data: {
              type: 'campaign',
              campaignId: campaignId,
              url: `/campaigns/${campaignId}`,
            },
            tokens: tokensToNotify,
          };

          const response = await messaging.sendEachForMulticast(message);
          
          sentCount = response.successCount;
          failureCount = response.failureCount;

          // Log failed tokens and remove invalid ones from database
          let cleanedTokenCount = 0;
          if (response.failureCount > 0) {
            const failedTokens = response.responses
              .map((resp, idx) => resp.success ? null : tokensToNotify[idx])
              .filter(Boolean);
            
            console.log('Failed tokens:', failedTokens);
            
            // Remove invalid tokens from database
            if (failedTokens.length > 0 && db) {
              try {
                const deletePromises = failedTokens.map(async (token) => {
                  if (!db) return;
                  const tokenQuery = await db.collection('pushTokens')
                    .where('token', '==', token)
                    .get();
                  
                  if (!tokenQuery.empty) {
                    const batch = db.batch();
                    tokenQuery.docs.forEach(doc => batch.delete(doc.ref));
                    await batch.commit();
                    console.log(`Removed invalid token: ${token}`);
                    cleanedTokenCount++;
                  }
                });
                
                await Promise.all(deletePromises);
              } catch (cleanupError) {
                console.error('Error cleaning up invalid tokens:', cleanupError);
              }
            }
          }
        } catch (fcmError) {
          console.error('FCM send error:', fcmError);
          return NextResponse.json(
            { ok: false, error: 'Failed to send notifications' },
            { status: 500 }
          );
        }
      }
    }

    // If dry run, return only the count without sending
    if (dryRun) {
      return NextResponse.json({
        ok: true,
        targetedUsers: targetedUsers.length,
        dryRun: true,
        message: `Would target ${targetedUsers.length} users`
      });
    }

    // Update cooldown timestamp for successful sends
    if (sentCount > 0) {
      campaignCooldowns.set(campaignId, Date.now());
    }

    return NextResponse.json({
      ok: true,
      targetedUsers: targetedUsers.length,
      sentCount,
      failureCount,
      cleanedTokens: cleanedTokenCount,
      skipped: useMock,
      message: useMock 
        ? `Mock: Would send to ${sentCount} users` 
        : `Notifications sent to ${sentCount} users`
    });

  } catch (error: any) {
    console.error('Error sending campaign notifications:', error);
    return NextResponse.json(
      { ok: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

