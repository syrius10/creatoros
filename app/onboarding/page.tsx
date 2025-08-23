'use client'

import { createClient } from '@/lib/supabaseBrowser'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function Onboarding() {
  const [orgName, setOrgName] = useState('')
  const [loading, setLoading] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      alert('User not authenticated')
      setLoading(false)
      return
    }

    const { data, error } = await supabase
      .from('orgs')
      .insert({ name: orgName })
      .select()
      .single()

    if (error) {
      alert(error.message)
    } else {
      // Add current user as owner
      const { error: memberError } = await supabase
        .from('org_members')
        .insert({
          org_id: data.id,
          profile_id: user.id,
          role: 'owner'
        })

      if (memberError) {
        alert(memberError.message)
      } else {
        router.push('/dashboard')
      }
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create Your Organization
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleCreateOrg}>
          <div>
            <input
              type="text"
              required
              className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Organization Name"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
            />
          </div>
          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              {loading ? 'Creating...' : 'Create Organization'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}