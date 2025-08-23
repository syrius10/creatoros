'use client'

import { createClient } from '@/lib/supabaseBrowser'
import { useEffect, useState } from 'react'

interface Org {
  id: string
  name: string
  slug: string
}

interface OrgMemberWithOrg {
  org: Org
}

export default function OrgSwitcher() {
  const [orgs, setOrgs] = useState<Org[]>([])
  const [currentOrg, setCurrentOrg] = useState<Org | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const fetchOrgs = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('org_members')
        .select('org:orgs(*)')
        .eq('profile_id', user.id)

      if (data) {
        const orgList = data.map((item: OrgMemberWithOrg) => item.org) as Org[]
        setOrgs(orgList)
        setCurrentOrg(orgList[0] || null)
      }
    }

    fetchOrgs()
  }, [supabase])

  return (
    <div>
      <label htmlFor="org-switcher" className="block text-sm font-medium text-gray-700">
        Switch organization
      </label>
      <select
        id="org-switcher"
        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
        value={currentOrg?.id || ''}
        onChange={(e) => {
          const org = orgs.find(o => o.id === e.target.value)
          setCurrentOrg(org || null)
        }}
      >
        {orgs.map(org => (
          <option key={org.id} value={org.id}>
            {org.name}
          </option>
        ))}
      </select>
    </div>
  )
}