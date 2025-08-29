import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

// Test database operations directly
test.describe('Community Database Tests', () => {
  let supabase: any;
  let testForumId: string;
  let testThreadId: string;
  let testCommentId: string;
  
  // Use the provided UUIDs for testing
  const TEST_ORG_ID = 'd5e6b38d-8ee0-49db-bfec-881b4d6dda94';
  const TEST_PROFILE_ID = '3e6eece1-76d9-4d06-86d0-86021402795d';

  test.beforeAll(async () => {
    // Initialize Supabase client
    supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // First, check if the test org exists
    const { data: org, error: orgError } = await supabase
      .from('orgs')
      .select('id')
      .eq('id', TEST_ORG_ID)
      .single();
    
    if (orgError || !org) {
      console.error('Test org does not exist. Please create it first or use an existing org ID.');
      return;
    }

    // Check if the test profile exists
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', TEST_PROFILE_ID)
      .single();
    
    if (profileError || !profile) {
      console.error('Test profile does not exist. Please create it first or use an existing profile ID.');
      return;
    }

    // Create a test forum
    const { data: forum, error: forumError } = await supabase
      .from('forums')
      .insert([{
        org_id: TEST_ORG_ID,
        name: 'Test Forum',
        description: 'A test forum',
        is_private: false,
        position: 0
      }])
      .select()
      .single();
    
    if (forumError) {
      console.error('Error creating forum:', forumError);
      return;
    }
    
    testForumId = forum.id;

    // Create a test thread
    const { data: thread, error: threadError } = await supabase
      .from('threads')
      .insert([{
        forum_id: testForumId,
        profile_id: TEST_PROFILE_ID,
        title: 'Test Thread',
        content: 'This is a test thread'
      }])
      .select()
      .single();
    
    if (threadError) {
      console.error('Error creating thread:', threadError);
      return;
    }
    
    testThreadId = thread.id;
  });

  test.afterAll(async () => {
    // Clean up test data
    if (testCommentId) {
      await supabase.from('comments').delete().eq('id', testCommentId);
    }
    if (testThreadId) {
      await supabase.from('threads').delete().eq('id', testThreadId);
    }
    if (testForumId) {
      await supabase.from('forums').delete().eq('id', testForumId);
    }
  });

  test('should create a comment', async () => {
    const { data: comment, error } = await supabase
      .from('comments')
      .insert([{
        thread_id: testThreadId,
        profile_id: TEST_PROFILE_ID,
        content: 'This is a test comment'
      }])
      .select()
      .single();
    
    expect(error).toBeNull();
    expect(comment).toHaveProperty('id');
    expect(comment.content).toBe('This is a test comment');
    
    // Store the comment ID for cleanup
    testCommentId = comment.id;
  });

  test('should add a reaction', async () => {
    const { data: reaction, error } = await supabase
      .from('reactions')
      .insert([{
        profile_id: TEST_PROFILE_ID,
        thread_id: testThreadId,
        type: 'like'
      }])
      .select()
      .single();
    
    expect(error).toBeNull();
    expect(reaction).toHaveProperty('id');
    expect(reaction.type).toBe('like');
  });

  test('should get forums for an organization', async () => {
    const { data: forums, error } = await supabase
      .from('forums')
      .select('*')
      .eq('org_id', TEST_ORG_ID);
    
    expect(error).toBeNull();
    expect(Array.isArray(forums)).toBe(true);
    expect(forums.length).toBeGreaterThan(0);
  });

  test('should get threads for a forum', async () => {
    const { data: threads, error } = await supabase
      .from('threads')
      .select('*')
      .eq('forum_id', testForumId);
    
    expect(error).toBeNull();
    expect(Array.isArray(threads)).toBe(true);
    expect(threads.length).toBeGreaterThan(0);
  });

  test('should get comments for a thread', async () => {
    const { data: comments, error } = await supabase
      .from('comments')
      .select('*')
      .eq('thread_id', testThreadId);
    
    expect(error).toBeNull();
    expect(Array.isArray(comments)).toBe(true);
  });
});