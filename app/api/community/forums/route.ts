import { NextRequest, NextResponse } from 'next/server';
import { CommunityService } from '@/lib/community';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('orgId');

    if (!orgId) {
      return NextResponse.json({ error: 'orgId is required' }, { status: 400 });
    }

    const forums = await CommunityService.getForums(orgId);
    return NextResponse.json(forums);
  } catch (error) {
    console.error('Error fetching forums:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { orgId, name, description, isPrivate } = await request.json();

    if (!orgId || !name) {
      return NextResponse.json({ error: 'orgId and name are required' }, { status: 400 });
    }

    const forum = await CommunityService.createForum(orgId, name, description, isPrivate || false);
    
    if (!forum) {
      return NextResponse.json({ error: 'Failed to create forum' }, { status: 500 });
    }

    return NextResponse.json(forum);
  } catch (error) {
    console.error('Error creating forum:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}