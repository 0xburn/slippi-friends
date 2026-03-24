import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

function resolveBase(requestUrl: string, returnTo: string | null): string {
  if (returnTo) {
    try {
      const url = new URL(returnTo);
      if (url.protocol === 'https:') return url.origin;
    } catch {}
  }
  if (process.env.NEXT_PUBLIC_APP_URL && process.env.NEXT_PUBLIC_APP_URL !== 'http://localhost:3000') {
    return process.env.NEXT_PUBLIC_APP_URL;
  }
  return new URL(requestUrl).origin;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/friends';
  const returnTo = searchParams.get('return_to');
  const base = resolveBase(request.url, returnTo);

  const needsProxy = returnTo && base !== new URL(request.url).origin;
  const pathPrefix = needsProxy ? '/friendlies' : '';

  if (code) {
    const supabase = createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${base}${pathPrefix}${next}`);
    }
  }

  return NextResponse.redirect(`${base}${pathPrefix}/?error=auth`);
}
