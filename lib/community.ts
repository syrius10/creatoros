import { createClient } from '@/lib/supabaseServer';

// Define types since we don't have Database from '@/types/supabase'
export interface Forum {
  id: string;
  org_id: string;
  name: string;
  description: string | null;
  position: number;
  is_private: boolean;
  created_at: string;
  updated_at: string;
  thread_count?: number;
  latest_thread?: Thread;
}

export interface Thread {
  id: string;
  org_id: string;
  forum_id: string;
  user_id: string;
  title: string;
  content: string;
  is_pinned: boolean;
  is_locked: boolean;
  created_at: string;
  updated_at: string;
  user?: {
    id: string;
    email: string;
    full_name?: string;
    avatar_url?: string;
  };
  comment_count?: number;
  reaction_count?: number;
  user_reaction?: string;
}

export interface Comment {
  id: string;
  org_id: string;
  thread_id: string;
  user_id: string;
  content: string;
  parent_id: string | null;
  created_at: string;
  updated_at: string;
  user?: {
    id: string;
    email: string;
    full_name?: string;
    avatar_url?: string;
  };
  replies?: Comment[];
  reaction_count?: number;
  user_reaction?: string;
}

export interface Reaction {
  id: string;
  org_id: string;
  thread_id: string | null;
  comment_id: string | null;
  user_id: string;
  type: string;
  created_at: string;
}

export class CommunityService {
  static async getForums(orgId: string): Promise<Forum[]> {
    const supabase = await createClient();
    const { data: forums, error } = await supabase
      .from('forums')
      .select(`
        *,
        threads:threads(count),
        latest_thread:threads!inner(
          id,
          title,
          created_at,
          user:profiles(id, full_name)
        )
      `)
      .eq('org_id', orgId)
      .order('position', { ascending: true })
      .order('created_at', { ascending: false, referencedTable: 'threads' })
      .limit(1, { referencedTable: 'threads' });

    if (error) {
      console.error('Error fetching forums:', error);
      return [];
    }

    return forums.map(forum => ({
      ...forum,
      thread_count: forum.threads[0]?.count || 0,
      latest_thread: forum.latest_thread[0] || null
    }));
  }

  static async createForum(orgId: string, name: string, description: string | null = null, isPrivate: boolean = false): Promise<Forum | null> {
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data: forum, error } = await supabase
      .from('forums')
      .insert({
        org_id: orgId,
        name,
        description,
        is_private: isPrivate
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating forum:', error);
      return null;
    }

    return forum;
  }

  static async getForum(forumId: string): Promise<Forum | null> {
    const supabase = await createClient();
    const { data: forum, error } = await supabase
      .from('forums')
      .select('*')
      .eq('id', forumId)
      .single();

    if (error) {
      console.error('Error fetching forum:', error);
      return null;
    }

    return forum;
  }

  static async getThreads(forumId: string, page = 1, limit = 20): Promise<Thread[]> {
    const supabase = await createClient();
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data: threads, error } = await supabase
      .from('threads')
      .select(`
        *,
        user:profiles(id, email, full_name, avatar_url),
        comments:comments(count),
        reactions:reactions(count)
      `)
      .eq('forum_id', forumId)
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      console.error('Error fetching threads:', error);
      return [];
    }

    return threads.map(thread => ({
      ...thread,
      comment_count: thread.comments[0]?.count || 0,
      reaction_count: thread.reactions[0]?.count || 0
    }));
  }

  static async getThread(threadId: string): Promise<Thread | null> {
    const supabase = await createClient();
    const { data: thread, error } = await supabase
      .from('threads')
      .select(`
        *,
        user:profiles(id, email, full_name, avatar_url)
      `)
      .eq('id', threadId)
      .single();

    if (error) {
      console.error('Error fetching thread:', error);
      return null;
    }

    return thread;
  }

  static async createThread(orgId: string, forumId: string, title: string, content: string): Promise<Thread | null> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data: thread, error } = await supabase
      .from('threads')
      .insert({
        org_id: orgId,
        forum_id: forumId,
        user_id: user.id,
        title,
        content
      })
      .select(`
        *,
        user:profiles(id, email, full_name, avatar_url)
      `)
      .single();

    if (error) {
      console.error('Error creating thread:', error);
      return null;
    }

    return thread;
  }

  static async getComments(threadId: string): Promise<Comment[]> {
    const supabase = await createClient();
    const { data: comments, error } = await supabase
      .from('comments')
      .select(`
        *,
        user:profiles(id, email, full_name, avatar_url),
        reactions:reactions(count)
      `)
      .eq('thread_id', threadId)
      .is('parent_id', null)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching comments:', error);
      return [];
    }

    // Fetch replies for each comment
    const commentsWithReplies = await Promise.all(
      comments.map(async (comment) => {
        const { data: replies } = await supabase
          .from('comments')
          .select(`
            *,
            user:profiles(id, email, full_name, avatar_url),
            reactions:reactions(count)
          `)
          .eq('parent_id', comment.id)
          .order('created_at', { ascending: true });

        return {
          ...comment,
          replies: replies || [],
          reaction_count: comment.reactions[0]?.count || 0
        };
      })
    );

    return commentsWithReplies;
  }

  static async createComment(orgId: string, threadId: string, content: string, parentId: string | null = null): Promise<Comment | null> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data: comment, error } = await supabase
      .from('comments')
      .insert({
        org_id: orgId,
        thread_id: threadId,
        user_id: user.id,
        content,
        parent_id: parentId
      })
      .select(`
        *,
        user:profiles(id, email, full_name, avatar_url)
      `)
      .single();

    if (error) {
      console.error('Error creating comment:', error);
      return null;
    }

    return comment;
  }

  static async addReaction(orgId: string, threadId: string | null, commentId: string | null, type: string): Promise<Reaction | null> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('User not authenticated');
    }

    // First, remove any existing reaction by this user on this item
    await supabase
      .from('reactions')
      .delete()
      .eq('user_id', user.id)
      .eq('org_id', orgId)
      .eq('thread_id', threadId)
      .eq('comment_id', commentId);

    // Add the new reaction
    const { data: reaction, error } = await supabase
      .from('reactions')
      .insert({
        org_id: orgId,
        thread_id: threadId,
        comment_id: commentId,
        user_id: user.id,
        type
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding reaction:', error);
      return null;
    }

    return reaction;
  }

  static async removeReaction(orgId: string, threadId: string | null, commentId: string | null): Promise<boolean> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('User not authenticated');
    }

    const { error } = await supabase
      .from('reactions')
      .delete()
      .eq('user_id', user.id)
      .eq('org_id', orgId)
      .eq('thread_id', threadId)
      .eq('comment_id', commentId);

    if (error) {
      console.error('Error removing reaction:', error);
      return false;
    }

    return true;
  }
}