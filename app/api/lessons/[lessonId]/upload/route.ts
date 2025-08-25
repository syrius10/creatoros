import { createClient } from '@/lib/supabaseServer'
import { NextResponse } from 'next/server'

export async function POST(
  request: Request,
  { params }: { params: { lessonId: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const fileType = formData.get('type') as string // 'video' or 'file'

    if (!file || !fileType) {
      return NextResponse.json({ error: 'File and type are required' }, { status: 400 })
    }

    // Determine the bucket based on file type
    const bucketName = fileType === 'video' ? 'lesson-videos' : 'lesson-files'

    // Generate a unique filename
    const fileExt = file.name.split('.').pop()
    const fileName = `${params.lessonId}-${Math.random().toString(36).substring(2)}.${fileExt}`
    const filePath = `${fileName}`

    // Upload the file to Supabase Storage - remove unused uploadData variable
    const { error: uploadError } = await supabase
      .storage
      .from(bucketName)
      .upload(filePath, file)

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
      .eq('id', params.lessonId)

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