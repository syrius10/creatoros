import { useEffect, useState, useRef } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { supabase } from '@/mobile/lib/supabase';
import { useLocalSearchParams } from 'expo-router';

// Define interfaces for your data
interface Lesson {
  id: string;
  title: string;
  video_url: string;
  description: string;
  is_free: boolean;
  sort_order: number;
  section_id: string;
  created_at: string;
  updated_at: string;
}

interface SignedUrlResponse {
  signedUrl: string;
}

export default function LessonPlayerScreen() {
  const { id } = useLocalSearchParams();
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [lessonTitle, setLessonTitle] = useState('');
  const videoRef = useRef<Video>(null);

  useEffect(() => {
    const fetchLesson = async () => {
      try {
        // Ensure id is a string (it could be an array from useLocalSearchParams)
        const lessonId = Array.isArray(id) ? id[0] : id;
        
        if (!lessonId) {
          Alert.alert('Error', 'No lesson ID provided');
          setLoading(false);
          return;
        }

        // First, get the lesson details with proper typing
        const { data: lesson, error: lessonError } = await supabase
          .from('lessons')
          .select('title, video_url')
          .eq('id', lessonId)
          .single() as { data: Lesson | null, error: any };

        if (lessonError) throw lessonError;

        if (lesson) {
          setLessonTitle(lesson.title);
          
          // Create a signed URL for private videos with proper typing
          const { data: signedUrlData, error: signedUrlError } = await supabase
            .storage
            .from('lesson-videos')
            .createSignedUrl(lesson.video_url, 60 * 60) as { data: SignedUrlResponse | null, error: any }; // 1 hour expiry

          if (signedUrlError) throw signedUrlError;

          if (signedUrlData && signedUrlData.signedUrl) {
            setVideoUrl(signedUrlData.signedUrl);
          } else {
            throw new Error('Failed to generate signed URL');
          }
        }
      } catch (error: any) {
        console.error('Error fetching lesson:', error);
        Alert.alert('Error', 'Failed to load video');
      } finally {
        setLoading(false);
      }
    };

    fetchLesson();
  }, [id]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text>Loading video...</Text>
      </View>
    );
  }

  if (!videoUrl) {
    return (
      <View style={styles.center}>
        <Text>Video not available</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{lessonTitle}</Text>
      <Video
        ref={videoRef}
        source={{ uri: videoUrl }}
        rate={1.0}
        volume={1.0}
        isMuted={false}
        resizeMode={ResizeMode.CONTAIN}
        shouldPlay
        useNativeControls
        style={styles.video}
        onError={(error) => {
          console.error('Video playback error:', error);
          Alert.alert('Playback Error', 'Failed to play video');
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  center: {
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center',
    backgroundColor: '#fff'
  },
  title: {
    color: '#fff',
    fontSize: 18,
    padding: 15,
    textAlign: 'center'
  },
  video: {
    flex: 1,
    width: '100%'
  }
});