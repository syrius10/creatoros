// app/checkout/success/page.tsx
import { createClient } from '@/lib/supabaseServer'
import { redirect } from 'next/navigation'

// Define the props interface with readonly modifier
interface SuccessPageProps {
  readonly searchParams: { 
    readonly session_id: string 
  }
}

export default async function SuccessPage({ searchParams }: SuccessPageProps) {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    redirect('/signin')
  }

  // Verify the session was successful and order is paid
  const { data: order } = await supabase
    .from('orders')
    .select('*')
    .eq('stripe_session_id', searchParams.session_id)
    .single()

  if (!order || order.status !== 'paid') {
    // You might want to poll or wait for webhook to update
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md">
          <h1 className="text-2xl font-bold text-gray-900">Processing your payment...</h1>
          <p className="mt-4 text-gray-600">Please wait while we confirm your payment.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-gray-900">Payment Successful!</h1>
        <p className="mt-4 text-gray-600">Thank you for your purchase.</p>
      </div>
    </div>
  )
}