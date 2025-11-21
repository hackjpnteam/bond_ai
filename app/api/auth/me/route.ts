import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth-middleware';

export const GET = requireAuth(async (request: NextRequest, user) => {
  return new Response(
    JSON.stringify({
      success: true,
      user
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    }
  );
});