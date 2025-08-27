import { useEffect, useState } from 'react';
import { View, Text, FlatList, Button, StyleSheet, ActivityIndicator } from 'react-native';
import { supabase } from '@/mobile/lib/supabase';
import { useLocalSearchParams, router } from 'expo-router';

// Define interfaces for your data
interface Lesson {
  id: string;
  title: string;
  description: string;
  video_url: string;
  is_free: boolean;
  sort_order: number;
  section_id: string;
  created_at: string;
  updated_at: string;
}

interface Section {
  id: string;
  title: string;
  sort_order: number;
  course_id: string;
  created_at: string;
  updated_at: string;
  lessons: Lesson[];
}

interface Course {
  id: string;
  title: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export default function CourseDetailScreen() {
  const { id } = useLocalSearchParams();
  const [sections, setSections] = useState<Section[]>([]);
  const [courseTitle, setCourseTitle] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourseContent = async () => {
      try {
        // Ensure id is a string (it could be an array from useLocalSearchParams)
        const courseId = Array.isArray(id) ? id[0] : id;
        
        if (!courseId) {
          console.error('No course ID provided');
          setLoading(false);
          return;
        }

        // First get course title with proper typing
        const { data: courseData, error: courseError } = await supabase
          .from('courses')
          .select('title')
          .eq('id', courseId)
          .single() as { data: Course | null, error: any };

        if (courseError) throw courseError;
        setCourseTitle(courseData?.title || 'Course Details');

        // Then get sections with lessons with proper typing
        const { data: sectionsData, error: sectionsError } = await supabase
          .from('sections')
          .select(`
            *,
            lessons(*)
          `)
          .eq('course_id', courseId)
          .order('sort_order')
          .order('sort_order', { foreignTable: 'lessons', ascending: true }) as { data: Section[] | null, error: any };

        if (sectionsError) throw sectionsError;

        if (sectionsData) {
          setSections(sectionsData);
        }
      } catch (error: any) {
        console.error('Error fetching course content:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCourseContent();
  }, [id]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text>Loading course content...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{courseTitle}</Text>
      <FlatList
        data={sections}
        keyExtractor={(item) => item.id}
        renderItem={({ item: section }) => (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            {section.lessons.map((lesson) => (
              <View key={lesson.id} style={styles.lesson}>
                <Text style={styles.lessonTitle}>{lesson.title}</Text>
                <Text style={styles.lessonDescription}>{lesson.description}</Text>
                <Button 
                  title="Play Lesson" 
                  onPress={() => {
                    router.push(`/lessons/${lesson.id}`);
                  }} 
                />
              </View>
            ))}
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    padding: 20 
  },
  center: {
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center'
  },
  title: { 
    fontSize: 24, 
    marginBottom: 20, 
    fontWeight: 'bold' 
  },
  section: { 
    marginBottom: 25 
  },
  sectionTitle: { 
    fontSize: 18, 
    fontWeight: 'bold',
    marginBottom: 10 
  },
  lesson: { 
    padding: 12, 
    backgroundColor: '#f9f9f9',
    borderRadius: 5,
    marginBottom: 10
  },
  lessonTitle: { 
    fontSize: 16, 
    fontWeight: '600',
    marginBottom: 5
  },
  lessonDescription: {
    marginBottom: 10,
    color: '#666'
  }
});