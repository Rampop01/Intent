import { parseUserIntent } from '@/lib/ai-real-service';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { intent } = await request.json();

    if (!intent || typeof intent !== 'string') {
      return NextResponse.json(
        { error: 'Invalid intent provided' },
        { status: 400 }
      );
    }

    console.log('[v0] Parsing user intent:', intent);

    const parsedIntent = await parseUserIntent(intent);

    console.log('[v0] Parsed intent:', parsedIntent);

    return NextResponse.json(parsedIntent);
  } catch (error) {
    console.error('[v0] Error parsing intent:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to parse intent',
      },
      { status: 500 }
    );
  }
}
