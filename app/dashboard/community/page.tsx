// This is a simple redirect page that doesn't use any client-side hooks
import { redirect } from 'next/navigation'

export default function CommunityPage() {
  redirect('/community/client')
}

// These exports ensure no static generation
export const dynamic = 'force-dynamic'
export const revalidate = 0