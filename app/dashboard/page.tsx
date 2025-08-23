import { createClient } from '@/lib/supabaseServer'
import { redirect } from 'next/navigation'
import { OrgMemberWithOrg } from '@/types/database'
import OrgSwitcher from './org-switcher' // Add this import

export default async function Dashboard() {
  try {
    const supabase = await createClient()
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    if (sessionError) {
      console.error('Session error:', sessionError)
      redirect('/signin')
    }

    if (!session) {
      redirect('/signin')
    }

    const { data: orgs, error: orgsError } = await supabase
      .from('org_members')
      .select(`
        org:orgs (*)
      `)
      .eq('profile_id', session.user.id)

    if (orgsError) {
      console.error('Orgs error:', orgsError)
      // Continue rendering but without orgs data
    }

    // Type assertion for the response data
    const orgsWithTyping = orgs as unknown as OrgMemberWithOrg[]

    return (
      <div className="min-h-screen bg-gray-100">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <div className="mt-8">
              {/* Add the OrgSwitcher component here */}
              <OrgSwitcher />
              
              <h2 className="text-xl font-semibold mt-8">Your Organizations</h2>
              <ul className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                {orgsWithTyping?.map(({ org }) => (
                  <li key={org.id} className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                      <h3 className="text-lg font-medium text-gray-900">{org.name}</h3>
                      <p className="mt-1 text-sm text-gray-500">Slug: {org.slug}</p>
                    </div>
                  </li>
                ))}
              </ul>
              {(!orgsWithTyping || orgsWithTyping.length === 0) && (
                <p className="text-gray-500 mt-4">You are not a member of any organizations yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  } catch (error) {
    console.error('Dashboard error:', error)
    redirect('/signin')
  }
}