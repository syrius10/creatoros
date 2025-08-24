// app/pricing/checkout-button.tsx
'use client'

import { createClient } from '@/lib/supabaseBrowser'
import { useState } from 'react'

// Mark the props as read-only using the Readonly type
interface CheckoutButtonProps {
  readonly priceId?: string
}

export default function CheckoutButton({ priceId }: CheckoutButtonProps) {
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const handleCheckout = async () => {
    if (!priceId) return

    setLoading(true)

    try {
      // Get the current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        alert('You need to be logged in to make a purchase')
        setLoading(false)
        return
      }

      // Get the current user's orgs and use the first one for demo purposes
      const { data: orgs, error: orgError } = await supabase
        .from('org_members')
        .select('org_id')
        .eq('profile_id', user.id)

      if (orgError || !orgs || orgs.length === 0) {
        alert('You need to be part of an organization to make a purchase')
        setLoading(false)
        return
      }

      const orgId = orgs[0].org_id

      const { data, error } = await supabase.functions.invoke('checkout', {
        body: { priceId, orgId },
      })

      if (error) {
        console.error('Checkout error:', error)
        alert(error.message)
      } else if (data?.url) {
        window.location.href = data.url
      } else {
        alert('Failed to create checkout session')
      }
    } catch (error: any) {
      console.error('Checkout error:', error)
      alert('An error occurred during checkout')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleCheckout}
      disabled={loading || !priceId}
      className="mt-8 block w-full bg-indigo-600 border border-transparent rounded-md py-3 px-6 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loading ? 'Processing...' : 'Get Started'}
    </button>
  )
}