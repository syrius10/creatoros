// app/api/lessons/[lessonId]/upload/route.ts
import { createClient } from '@/lib/supabaseServer'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Alternative approach using request.blob()
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ lessonId: string }> }
) {
  try {
    const { lessonId } = await context.params
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Read the request as blob
    const blob = await request.blob();
    
    // Extract metadata from headers
    // const contentType = request.headers.get('content-type') || '';
    const contentDisposition = request.headers.get('content-disposition') || '';
    const fileType = request.headers.get('x-file-type') as string | null; // Send file type in custom header

    if (!fileType) {
      return NextResponse.json({ error: 'File type header (x-file-type) is required' }, { status: 400 })
    }

    // Extract filename from content-disposition or generate one
    let originalFileName = 'uploaded-file';
    const filenameMatch = contentDisposition.match(/filename="(.+)"/);
    if (filenameMatch) {
      originalFileName = filenameMatch[1];
    }

    // Determine the bucket based on file type
    const bucketName = fileType === 'video' ? 'lesson-videos' : 'lesson-files'

    // Generate a unique filename
    const fileExt = originalFileName.split('.').pop() || 'bin';
    const fileName = `${lessonId}-${Math.random().toString(36).substring(2)}.${fileExt}`
    const filePath = `${fileName}`

    // Convert Blob to ArrayBuffer for Supabase upload
    const arrayBuffer = await blob.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    // Upload the file to Supabase Storage
    const { error: uploadError } = await supabase
      .storage
      .from(bucketName)
      .upload(filePath, uint8Array, {
        contentType: blob.type,
        upsert: false
      })

    if (uploadError) {
      console.error('File upload error:', uploadError)
      return NextResponse.json({ error: uploadError.message }, { status: 500 })
    }

    // Get the public URL
    const { data: { publicUrl } } = supabase
      .storage
      .from(bucketName)
      .getPublicUrl(filePath)

    // Update the lesson with the file URL
    const updateField = fileType === 'video' ? 'video_url' : 'content'
    const { error: updateError } = await supabase
      .from('lessons')
      .update({ [updateField]: publicUrl })
      .eq('id', lessonId)

    if (updateError) {
      console.error('Lesson update error:', updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, url: publicUrl })
  } catch (error) {
    console.error('Unexpected error in file upload:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}