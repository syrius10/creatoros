export interface Organization {
  id: string
  name: string
  slug: string
  created_at: string
  updated_at: string
}

export interface OrgMember {
  id: string
  org_id: string
  profile_id: string
  role: 'owner' | 'admin' | 'member'
  created_at: string
  updated_at: string
  org?: Organization
}

export interface OrgMemberWithOrg {
  org: Organization
}