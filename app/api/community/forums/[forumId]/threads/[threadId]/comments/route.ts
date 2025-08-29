import { NextRequest, NextResponse } from 'next/server';
import { CommunityService } from '@/lib/community';

export async function GET(
  request: NextRequest,
  { params }: { params: { threadId: string } }
) {
  try {
    const comments = await CommunityService.getComments(params.threadId);
    return NextResponse.json(comments);
  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { threadId: string } }
) {
  try {
    const { orgId, content, parentId } = await request.json();

    if (!orgId || !content) {
      return NextResponse.json({ error: 'orgId and content are required' }, { status: 400 });
    }

    const comment = await CommunityService.createComment(orgId, params.threadId, content, parentId || null);
    
    if (!comment) {
      return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 });
    }

    return NextResponse.json(comment);
  } catch (error) {
    console.error('Error creating comment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}