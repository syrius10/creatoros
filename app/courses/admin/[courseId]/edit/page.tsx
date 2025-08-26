// app/courses/admin/[courseId]/edit/page.tsx (Server Component)
import CourseEditClient from './CourseEditClient'

interface PageProps {
  params: Promise<{ courseId: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function CourseEditPage({ params }: PageProps) {
  const { courseId } = await params;
  
  return <CourseEditClient courseId={courseId} />
}