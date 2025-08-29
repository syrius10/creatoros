import { createClient } from '@/lib/supabaseServer';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { orgId } = await request.json();

  if (!orgId) {
    return NextResponse.json({ error: 'orgId is required' }, { status: 400 });
  }

  // Check if user is admin
  const { data: user } = await supabase.auth.getUser();
  const { data: membership } = await supabase
    .from('org_members')
    .select('role')
    .eq('org_id', orgId)
    .eq('user_id', user.user?.id)
    .single();

  if (!membership || !['owner', 'admin'].includes(membership.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  // Create sample forums
  const { data: forums } = await supabase
    .from('forums')
    .insert([
      {
        org_id: orgId,
        name: 'General Discussion',
        description: 'Talk about anything related to our community',
        position: 0,
        is_private: false
      },
      {
        org_id: orgId,
        name: 'Announcements',
        description: 'Important updates and news',
        position: 1,
        is_private: false
      },
      {
        org_id: orgId,
        name: 'Feedback & Suggestions',
        description: 'Share your ideas to help us improve',
        position: 2,
        is_private: false
      },
      {
        org_id: orgId,
        name: 'Private Team Space',
        description: 'Internal discussions for team members',
        position: 3,
        is_private: true
      }
    ])
    .select();

  if (!forums) {
    return NextResponse.json({ error: 'Failed to create forums' }, { status: 500 });
  }

  // Create sample threads
  const generalForum = forums.find(f => f.name === 'General Discussion');
  if (generalForum && user.user?.id) {
    await supabase
      .from('threads')
      .insert([
        {
          forum_id: generalForum.id,
          author_id: user.user.id,
          title: 'Welcome to our community!',
          content: 'Hello everyone! Welcome to our new community space. Feel free to introduce yourself and let us know what brings you here.',
          is_pinned: true
        },
        {
          forum_id: generalForum.id,
          author_id: user.user.id,
          title: 'How are you using our platform?',
          content: 'I\'m curious to hear how everyone is using our platform and what features you find most valuable.',
          is_pinned: false
        }
      ]);
  }

  return NextResponse.json({ 
    success: true, 
    message: 'Sample community data created successfully',
    forums 
  });
}