import { NextRequest, NextResponse } from 'next/server';
import { CommunityService } from '@/lib/community';

export async function GET(
  request: NextRequest,
  { params }: { params: { forumId: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const threads = await CommunityService.getThreads(params.forumId, page, limit);
    return NextResponse.json(threads);
  } catch (error) {
    console.error('Error fetching threads:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { forumId: string } }
) {
  try {
    const { orgId, title, content } = await request.json();

    if (!orgId || !title || !content) {
      return NextResponse.json({ error: 'orgId, title, and content are required' }, { status: 400 });
    }

    const thread = await CommunityService.createThread(orgId, params.forumId, title, content);
    
    if (!thread) {
      return NextResponse.json({ error: 'Failed to create thread' }, { status: 500 });
    }

    return NextResponse.json(thread);
  } catch (error) {
    console.error('Error creating thread:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}