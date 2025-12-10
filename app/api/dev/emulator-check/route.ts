import { NextResponse } from 'next/server';

function withHttp(host: string) {
  if (!host) return '';
  if (host.startsWith('http://') || host.startsWith('https://')) return host;
  return `http://${host}`;
}

async function ping(url: string, timeoutMs = 800) {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);
    const res = await fetch(url, { method: 'GET', signal: ctrl.signal });
    clearTimeout(t);
    // Any HTTP status means it's reachable (even 404). We just care about TCP reachability.
    return { reachable: true, status: res.status };
  } catch (e) {
    return { reachable: false, error: (e as Error).message };
  }
}

export async function GET() {
  const fsHost = process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:8080';
  const authHost = process.env.AUTH_EMULATOR_HOST || '127.0.0.1:9099';
  const hubHost = process.env.FIREBASE_EMULATOR_HUB || '127.0.0.1:4400'; // optional

  const targets = [
    { name: 'firestore', host: fsHost, url: withHttp(fsHost) },
    { name: 'auth', host: authHost, url: withHttp(authHost) },
    { name: 'hub', host: hubHost, url: withHttp(hubHost) },
  ];

  const results = await Promise.all(
    targets.map(async t => ({ name: t.name, host: t.host, ...(await ping(t.url)) }))
  );

  const ok = results.filter(r => r.name !== 'hub').every(r => r.reachable);

  return NextResponse.json({
    ok,
    results,
    note: 'This only checks TCP reachability of emulators from the Next.js server.',
  });
}
