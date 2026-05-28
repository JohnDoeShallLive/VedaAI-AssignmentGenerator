'use server';

import { cookies } from 'next/headers';

export async function setAuthCookie(sessionCookie: string) {
  cookies().set('__session', sessionCookie, {
    maxAge: 60 * 60 * 24 * 5, // 5 days
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  });
}

export async function removeAuthCookie() {
  cookies().delete('__session');
}
