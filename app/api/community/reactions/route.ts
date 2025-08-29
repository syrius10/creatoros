import { NextRequest, NextResponse } from 'next/server';
import { CommunityService } from '@/lib/community';

export async function POST(request: NextRequest) {
  try {
    const { orgId, threadId, commentId, type } = await request.json();

    if (!orgId || !type) {
      return NextResponse.json({ error: 'orgId and type are required' }, { status: 400 });
    }

    if (!threadId && !commentId) {
      return NextResponse.json({ error: 'Either threadId or commentId is required' }, { status: 400 });
    }

    const reaction = await CommunityService.addReaction(orgId, threadId || null, commentId || null, type);
    
    if (!reaction) {
      return NextResponse.json({ error: 'Failed to add reaction' }, { status: 500 });
    }

    return NextResponse.json(reaction);
  } catch (error) {
    console.error('Error adding reaction:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('orgId');
    const threadId = searchParams.get('threadId');
    const commentId = searchParams.get('commentId');

    if (!orgId) {
      return NextResponse.json({ error: 'orgId is required' }, { status: 400 });
    }

    if (!threadId && !commentId) {
      return NextResponse.json({ error: 'Either threadId or commentId is required' }, { status: 400 });
    }

    const success = await CommunityService.removeReaction(orgId, threadId, commentId);
    
    if (!success) {
      return NextResponse.json({ error: 'Failed to remove reaction' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing reaction:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}