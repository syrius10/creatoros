import { useEffect, useState } from 'react';
import { View, Text, FlatList, Button, Alert, StyleSheet, ActivityIndicator } from 'react-native';
import { supabase } from '@/mobile/lib/supabase';
import { openWebCheckout } from '@/mobile/lib/linking';

interface Course {
  id: string;
  title: string;
  description: string;
  price: number;
}

export default function AvailableCoursesScreen() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAvailableCourses = async () => {
      try {
        const { data: coursesData, error } = await supabase
          .from('courses')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setCourses(coursesData || []);
      } catch (error: any) {
        Alert.alert('Error', error.message || 'Failed to load courses');
      } finally {
        setLoading(false);
      }
    };

    fetchAvailableCourses();
  }, []);

  const handlePurchase = (courseId: string) => {
    openWebCheckout(courseId);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text>Loading available courses...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Available Courses</Text>
      <FlatList
        data={courses}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.courseItem}>
            <Text style={styles.courseTitle}>{item.title}</Text>
            <Text style={styles.courseDescription}>{item.description}</Text>
            <Text style={styles.coursePrice}>${item.price}</Text>
            <Button 
              title="Purchase Course" 
              onPress={() => handlePurchase(item.id)} 
            />
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  center: {
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center'
  },
  title: { fontSize: 24, marginBottom: 20, fontWeight: 'bold' },
  courseItem: { padding: 15, borderBottomWidth: 1, borderBottomColor: '#ccc', marginBottom: 10 },
  courseTitle: { fontSize: 18, fontWeight: '600', marginBottom: 5 },
  courseDescription: { marginBottom: 5, color: '#666' },
  coursePrice: { fontSize: 16, fontWeight: 'bold', marginBottom: 10 }
});