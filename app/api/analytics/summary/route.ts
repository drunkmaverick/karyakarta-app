import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { requireAdmin } from '../../_lib/requireAdmin';
import { dbAdmin } from '../../../lib/firebase-admin';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const guard = requireAdmin(request);
  if (guard) return guard;
  try {
    // Fetch all collections in parallel
    const [jobsSnap, payoutsSnap, providersSnap, customersSnap] = await Promise.all([
      dbAdmin.collection('jobs').get(),
      dbAdmin.collection('payouts').get(),
      dbAdmin.collection('providers').get(),
      dbAdmin.collection('customers').get()
    ]);

    // Process jobs data
    const jobs = jobsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    const jobsByStatus = jobs.reduce((acc: Record<string, number>, job: any) => {
      const status = job.status || 'unknown';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    // Process payouts data
    const payouts = payoutsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    const totalPayoutAmount = payouts.reduce((sum: number, payout: any) => {
      return sum + (Number(payout.amount) || 0);
    }, 0);
    
    const completedPayouts = payouts.filter((payout: any) => payout.status === 'completed').length;
    const failedPayouts = payouts.filter((payout: any) => payout.status === 'failed').length;

    // Process providers data
    const providers = providersSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    // Process customers data
    const customers = customersSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    const summary = {
      jobs: {
        total: jobs.length,
        byStatus: jobsByStatus
      },
      payouts: {
        total: payouts.length,
        totalAmount: totalPayoutAmount,
        completed: completedPayouts,
        failed: failedPayouts
      },
      providers: {
        total: providers.length
      },
      customers: {
        total: customers.length
      }
    };

    return NextResponse.json({ ok: true, summary });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message ?? String(e) }, { status: 500 });
  }
}
