import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from '@insforge/sdk/ssr/middleware';

export async function proxy(request: NextRequest) {
  const response = NextResponse.next();
  await updateSession({ requestCookies: request.cookies, responseCookies: response.cookies });
  const forwarded = NextResponse.next({ request: { headers: request.headers } });
  for (const cookie of response.cookies.getAll()) forwarded.cookies.set(cookie);
  return forwarded;
}

export const config = { matcher: ['/dashboard/:path*', '/create-campaign', '/sign-in', '/sign-up'] };
