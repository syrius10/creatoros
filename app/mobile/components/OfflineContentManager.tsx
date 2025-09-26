import React, { useState, useEffect } from 'react';
import { View, Text, Button, FlatList, Alert, StyleSheet } from 'react-native';
import { createClient } from '@/lib/client';

interface OfflineContent {
  id: string;
  content_type: string;
  content_id: string;
  title: string;
  file_path: string;
  file_size: number;
  downloaded_at: string;
}

// Moved component outside to fix SonarQube error
const DownloadExampleSection = ({ onDownload }: { onDownload: (type: string, id: string, title: string) => void }) => (
  <View style={styles.downloadSection}>
    <Text style={styles.sectionHeader}>Download Sample Content</Text>
    <View style={styles.downloadButtons}>
      <Button 
        title="Download Course" 
        onPress={() => onDownload('course', 'sample-course-1', 'Sample Course')}
      />
      <Button 
        title="Download Video" 
        onPress={() => onDownload('video', 'sample-video-1', 'Sample Video Lesson')}
      />
    </View>
  </View>
);

const OfflineContentItem = ({ 
  item, 
  onRemove 
}: { 
  item: OfflineContent; 
  onRemove: (id: string) => void 
}) => {
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <View style={styles.item}>
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.subtitle}>{item.content_type} • {formatFileSize(item.file_size)}</Text>
      <Text style={styles.date}>Downloaded: {new Date(item.downloaded_at).toLocaleDateString()}</Text>
      <Button 
        title="Remove" 
        onPress={() => onRemove(item.id)}
        color="#ff4444"
      />
    </View>
  );
};

export default function OfflineContentManager() {
  const [offlineContent, setOfflineContent] = useState<OfflineContent[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const supabase = createClient();

  // Get user from Supabase auth instead of OrgContext
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
    };
    getUser();
  }, [supabase]);

  const fetchOfflineContent = async () => {
    if (!currentUser) return;
    
    setLoading(true);
    const { data, error } = await supabase
      .from('offline_access')
      .select('*')
      .eq('user_id', currentUser.id)
      .order('downloaded_at', { ascending: false });

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      setOfflineContent(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchOfflineContent();
  }, [currentUser]);

  const downloadContent = async (contentType: string, contentId: string, title: string) => {
    if (!currentUser) return;

    const filePath = `${contentType}_${contentId}.tmp`;
    
    const { data, error } = await supabase
      .from('offline_access')
      .upsert([{
        user_id: currentUser.id,
        content_type: contentType,
        content_id: contentId,
        title,
        file_path: filePath,
        file_size: 0
      }])
      .select()
      .single();

    if (error) {
      Alert.alert('Download Failed', error.message);
    } else {
      setOfflineContent([data, ...offlineContent]);
      Alert.alert('Success', 'Content downloaded for offline access.');
    }
  };

  const removeOfflineContent = async (contentId: string) => {
    if (!currentUser) return;

    const { error } = await supabase
      .from('offline_access')
      .delete()
      .eq('id', contentId)
      .eq('user_id', currentUser.id);

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      setOfflineContent(offlineContent.filter(item => item.id !== contentId));
      Alert.alert('Success', 'Content removed from offline storage.');
    }
  };

  const renderItem = ({ item }: { item: OfflineContent }) => (
    <OfflineContentItem item={item} onRemove={removeOfflineContent} />
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Offline Content</Text>
      
      {!currentUser ? (
        <Text style={styles.errorText}>Please log in to access offline content</Text>
      ) : (
        <>
          <DownloadExampleSection onDownload={downloadContent} />
          <Button title="Refresh" onPress={fetchOfflineContent} disabled={loading} />
          
          {offlineContent.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No offline content yet</Text>
              <Text style={styles.emptySubtext}>Download content to access it offline</Text>
            </View>
          ) : (
            <FlatList
              data={offlineContent}
              renderItem={renderItem}
              keyExtractor={item => item.id}
              style={styles.list}
              refreshing={loading}
              onRefresh={fetchOfflineContent}
            />
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    padding: 16,
    backgroundColor: '#f5f5f5'
  },
  header: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    marginBottom: 16,
    textAlign: 'center'
  },
  downloadSection: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center'
  },
  downloadButtons: {
    gap: 8
  },
  list: { 
    marginTop: 16,
    borderRadius: 8,
    overflow: 'hidden'
  },
  item: { 
    padding: 16, 
    borderBottomWidth: 1, 
    borderBottomColor: '#e0e0e0',
    backgroundColor: 'white'
  },
  title: { 
    fontSize: 16, 
    fontWeight: 'bold',
    marginBottom: 4
  },
  subtitle: { 
    fontSize: 14, 
    color: '#666', 
    marginBottom: 4
  },
  date: { 
    fontSize: 12, 
    color: '#999', 
    marginBottom: 8
  },
  errorText: {
    textAlign: 'center',
    color: '#ff4444',
    fontSize: 16,
    marginTop: 20
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 8
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center'
  }
});