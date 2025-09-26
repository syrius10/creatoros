import { createClient } from '@/lib/client'; // Use your existing Supabase client
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage'; // For local storage

interface SyncItem {
  id: string;
  action_type: string;
  payload: any;
  user_id: string;
  created_at: string;
}

class BackgroundSyncService {
  private readonly supabase;
  private syncQueue: SyncItem[] = [];
  private isSyncing = false;
  private syncInterval: ReturnType<typeof setInterval> | null = null;
  private readonly STORAGE_KEY = 'background_sync_queue';

  constructor() {
    this.supabase = createClient();
    // Async initialization moved outside constructor
  }

  async initializeSync() {
    try {
      // Load pending items from local storage
      await this.loadPendingItems();
      
      // Set up network listener
      NetInfo.addEventListener(state => {
        if (state.isConnected && this.syncQueue.length > 0) {
          console.log('Network connection restored, processing sync queue');
          this.processSyncQueue();
        }
      });

      // Start periodic sync (every 30 seconds when app is active)
      this.syncInterval = setInterval(() => {
        this.processSyncQueue();
      }, 30000);

      console.log('BackgroundSyncService initialized');
    } catch (error) {
      console.error('Error initializing BackgroundSyncService:', error);
    }
  }

  async addToSyncQueue(actionType: string, payload: any) {
    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const syncItem: SyncItem = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        action_type: actionType,
        payload,
        user_id: user.id,
        created_at: new Date().toISOString()
      };

      this.syncQueue.push(syncItem);
      await this.saveToLocalStorage();
      
      console.log('Added item to sync queue:', actionType);
      
      // Try to sync immediately if online
      const netState = await NetInfo.fetch();
      if (netState.isConnected) {
        this.processSyncQueue();
      }
    } catch (error) {
      console.error('Error adding to sync queue:', error);
      throw error;
    }
  }

  async processSyncQueue() {
    if (this.isSyncing || this.syncQueue.length === 0) return;

    this.isSyncing = true;
    console.log(`Processing sync queue with ${this.syncQueue.length} items`);

    const itemsToProcess = [...this.syncQueue];
    const successfulItems: string[] = [];
    const failedItems: string[] = [];

    for (const item of itemsToProcess) {
      try {
        await this.syncItem(item);
        successfulItems.push(item.id);
        console.log(`Successfully synced item: ${item.action_type}`);
      } catch (error) {
        console.error(`Sync failed for item ${item.id}:`, error);
        failedItems.push(item.id);
        
        // Implement retry logic (max 3 retries)
        if (item.payload.retryCount && item.payload.retryCount >= 3) {
          console.log(`Max retries reached for item ${item.id}, removing from queue`);
          successfulItems.push(item.id); // Remove from queue even if failed after max retries
        }
      }
    }

    // Remove successfully synced items
    this.syncQueue = this.syncQueue.filter(item => !successfulItems.includes(item.id));
    await this.saveToLocalStorage();

    this.isSyncing = false;
    
    if (successfulItems.length > 0) {
      console.log(`Successfully synced ${successfulItems.length} items`);
    }
    if (failedItems.length > 0) {
      console.log(`Failed to sync ${failedItems.length} items`);
    }
  }

  async syncItem(item: SyncItem) {
    // Verify user session is still valid
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user || user.id !== item.user_id) {
      throw new Error('User session invalid');
    }

    switch (item.action_type) {
      case 'course_progress':
        await this.syncCourseProgress(item.payload);
        break;
      case 'quiz_submission':
        await this.syncQuizSubmission(item.payload);
        break;
      case 'content_completion':
        await this.syncContentCompletion(item.payload);
        break;
      case 'user_activity':
        await this.syncUserActivity(item.payload);
        break;
      default:
        console.warn(`Unknown action type: ${item.action_type}`);
        break;
    }
  }

  async syncCourseProgress(payload: any) {
    const { data, error } = await this.supabase
      .from('user_progress')
      .upsert([{
        ...payload,
        updated_at: new Date().toISOString()
      }])
      .select();

    if (error) throw error;
    return data;
  }

  async syncQuizSubmission(payload: any) {
    const { data, error } = await this.supabase
      .from('quiz_submissions')
      .insert([{
        ...payload,
        submitted_at: new Date().toISOString()
      }])
      .select();

    if (error) throw error;
    return data;
  }

  async syncContentCompletion(payload: any) {
    const { data, error } = await this.supabase
      .from('content_completions')
      .upsert([{
        ...payload,
        completed_at: new Date().toISOString()
      }])
      .select();

    if (error) throw error;
    return data;
  }

  async syncUserActivity(payload: any) {
    const { data, error } = await this.supabase
      .from('user_activities')
      .insert([{
        ...payload,
        recorded_at: new Date().toISOString()
      }])
      .select();

    if (error) throw error;
    return data;
  }

  async loadPendingItems() {
    try {
      const storedQueue = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (storedQueue) {
        this.syncQueue = JSON.parse(storedQueue);
        console.log(`Loaded ${this.syncQueue.length} pending items from storage`);
      }
    } catch (error) {
      console.error('Error loading pending items:', error);
      this.syncQueue = [];
    }
  }

  async saveToLocalStorage() {
    try {
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.syncQueue));
    } catch (error) {
      console.error('Error saving to local storage:', error);
    }
  }

  getQueueStatus() {
    return {
      totalItems: this.syncQueue.length,
      pendingItems: this.syncQueue.length,
      isSyncing: this.isSyncing
    };
  }

  clearQueue() {
    this.syncQueue = [];
    return this.saveToLocalStorage();
  }

  async destroy() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
    
    // Save current queue before destroying
    await this.saveToLocalStorage();
    console.log('BackgroundSyncService destroyed');
  }
}

// Create singleton instance
export const backgroundSyncService = new BackgroundSyncService();
backgroundSyncService.initializeSync();