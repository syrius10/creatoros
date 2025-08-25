// app/builder/[siteId]/page.tsx
import { createClient } from '@/lib/supabaseServer'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function SiteBuilderPage({
  params,
}: {
  params: Promise<{ siteId: string }>
}) {
  const { siteId } = await params
  
  const supabase = await createClient()
  
  // ✅ USE getUser() INSTEAD OF getSession()
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    console.log('DEBUG: No user - redirecting to signin')
    redirect('/signin')
  }

  console.log('DEBUG: User authenticated:', user.id)

  // Fetch site details
  const { data: site, error: siteError } = await supabase
    .from('sites')
    .select('*')
    .eq('id', siteId)
    .single()

  console.log('DEBUG: Site query results - Data:', site)
  console.log('DEBUG: Site query results - Error:', siteError)

  if (!site) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Site not found</h1>
          <p className="mt-2 text-gray-600">Site ID: {siteId}</p>
        </div>
      </div>
    )
  }

  // SIMPLE TEST CONTENT - No complex components
  return (
    <html>
      <body>
        <div style={{ padding: '20px', backgroundColor: '#f3f4f6', minHeight: '100vh' }}>
          <h1 style={{ color: 'red', fontSize: '24px', marginBottom: '20px' }}>
            🎉 SUCCESS! Page is working
          </h1>
          <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px' }}>
            <p><strong>Site:</strong> {site.name}</p>
            <p><strong>Site ID:</strong> {site.id}</p>
            <p><strong>User:</strong> {user.email}</p>
            <p><strong>User ID:</strong> {user.id}</p>
          </div>
        </div>
      </body>
    </html>
  )
}