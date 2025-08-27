import { useEffect, useState } from 'react';
import { View, Text, FlatList, Button, Alert, StyleSheet, ActivityIndicator } from 'react-native';
import { supabase } from '@/mobile/lib/supabase';
import { Link, useRouter } from 'expo-router';
import * as Linking from 'expo-linking';

// Define interfaces for your data
interface Course {
  id: string;
  title: string;
  description: string;
  created_at: string;
  updated_at: string;
}

interface Enrollment {
  id: string;
  course_id: string;
  profile_id: string;
  created_at: string;
}

export default function CoursesScreen() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const fetchCourses = async () => {
    setRefreshing(true);
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      Alert.alert('Authentication required', 'Please sign in to view your courses');
      router.replace('/(auth)/signin');
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      // Fetch enrolled courses with proper typing
      const { data: enrollments, error: enrollmentError } = await supabase
        .from('enrollments')
        .select('course_id')
        .eq('profile_id', session.user.id) as { data: Enrollment[] | null, error: any };

      if (enrollmentError) {
        throw enrollmentError;
      }

      if (enrollments && enrollments.length > 0) {
        const courseIds = enrollments.map(e => e.course_id);
        
        // Type the courses query
        const { data: enrolledCourses, error: coursesError } = await supabase
          .from('courses')
          .select('*')
          .in('id', courseIds)
          .order('created_at', { ascending: false }) as { data: Course[] | null, error: any };

        if (coursesError) {
          throw coursesError;
        }

        setCourses(enrolledCourses || []);
      } else {
        setCourses([]);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load courses');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    // Handle deep links when app is opened from a URL
    const handleDeepLink = (event: { url: string }) => {
      const url = Linking.parse(event.url);
      
      if (url.hostname === 'purchase-success') {
        // Handle successful purchase
        const courseId = url.queryParams?.course_id;
        if (courseId) {
          // Refresh courses to show the newly purchased course
          fetchCourses();
          Alert.alert('Success', 'Your purchase was completed successfully!');
        }
      }
      
      if (url.hostname === 'purchase-cancel') {
        // Handle cancelled purchase
        Alert.alert('Cancelled', 'Your purchase was not completed.');
      }
    };

    // Add event listener for deep links
    const subscription = Linking.addEventListener('url', handleDeepLink);

    // Check if app was opened with a deep link
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink({ url });
      }
    });

    return () => subscription.remove();
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text>Loading your courses...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Courses</Text>
        <Button 
          title="Browse All Courses" 
          onPress={() => router.push('/available-courses')} 
        />
      </View>
      
      {courses.length === 0 ? (
        <View style={styles.center}>
          <Text>You are not enrolled in any courses yet.</Text>
          <Text style={styles.subtitle}>Browse our available courses to get started!</Text>
        </View>
      ) : (
        <FlatList
          data={courses}
          keyExtractor={(item) => item.id}
          refreshing={refreshing}
          onRefresh={fetchCourses}
          renderItem={({ item }) => (
            <View style={styles.courseItem}>
              <Text style={styles.courseTitle}>{item.title}</Text>
              <Text style={styles.courseDescription}>{item.description}</Text>
              <Link href={`/courses/${item.id}`} asChild>
                <Button title="View Course" />
              </Link>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    padding: 20 
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  center: {
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center'
  },
  title: { 
    fontSize: 24, 
    fontWeight: 'bold' 
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 10,
    textAlign: 'center',
  },
  courseItem: { 
    padding: 15, 
    borderBottomWidth: 1, 
    borderBottomColor: '#ccc',
    marginBottom: 10
  },
  courseTitle: { 
    fontSize: 18, 
    fontWeight: '600',
    marginBottom: 5
  },
  courseDescription: {
    marginBottom: 10,
    color: '#666'
  }
});