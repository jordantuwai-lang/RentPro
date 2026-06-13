import { NextRequest, NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';

export async function PATCH(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { creditHireLayout } = body;

  if (creditHireLayout !== undefined && !['tabs', 'single'].includes(creditHireLayout)) {
    return NextResponse.json({ error: 'Invalid layout value' }, { status: 400 });
  }

  const client = await clerkClient();
  await client.users.updateUserMetadata(userId, {
    publicMetadata: { creditHireLayout },
  });

  return NextResponse.json({ ok: true });
}
