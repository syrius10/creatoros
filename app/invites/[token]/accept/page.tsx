// app/invites/[token]/accept/page.tsx
'use client'

import { createClient } from '@/lib/supabaseBrowser'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

// Update props to accept Promise params
interface AcceptInvitePageProps {
  params: Promise<{ token: string }>
}

export default function AcceptInvitePage(props: AcceptInvitePageProps) {
  const [status, setStatus] = useState('loading')
  const [message, setMessage] = useState('Processing your invite...')
  const [token, setToken] = useState<string>('')
  const router = useRouter()

  // Extract nested ternary to separate function
  const getStatusTitle = (currentStatus: string) => {
    switch (currentStatus) {
      case 'loading':
        return 'Processing Invite'
      case 'success':
        return 'Success!'
      case 'error':
        return 'Error'
      default:
        return 'Processing Invite'
    }
  }

  useEffect(() => {
    // Resolve the params promise
    async function resolveParams() {
      const resolvedParams = await props.params
      setToken(resolvedParams.token)
    }
    
    resolveParams()
  }, [props.params])

  useEffect(() => {
    async function acceptInvite() {
      if (!token) return // Wait until token is available

      try {
        const supabase = createClient()
        const { data: { session } } = await supabase.auth.getSession()

        if (!session) {
          // Redirect to signin with invite token
          router.push(`/signin?invite_token=${token}`)
          return
        }

        const response = await fetch(`/api/invites/${token}/accept`, {
          method: 'POST',
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const result = await response.json()

        if (response.ok) {
          setStatus('success')
          setMessage('Successfully joined organization! Redirecting...')
          setTimeout(() => router.push('/dashboard'), 2000)
        } else {
          setStatus('error')
          setMessage(result.error || 'Failed to accept invite')
        }
      } catch (error: any) {
        setStatus('error')
        setMessage('An error occurred while processing your invite')
        // Log the error instead of swallowing it
        console.error('Invite acceptance error:', error)
      }
    }

    if (token) {
      acceptInvite()
    }
  }, [token, router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">
          {getStatusTitle(status)}
        </h1>
        <p>{message}</p>
      </div>
    </div>
  )
}