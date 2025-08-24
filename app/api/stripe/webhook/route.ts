// app/api/stripe/webhook/route.ts
import { createClient } from '@/lib/supabaseServer'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { headers } from 'next/headers'

// Initialize Stripe with proper error handling
const stripeSecretKey = process.env.STRIPE_SECRET_KEY
if (!stripeSecretKey) {
  throw new Error('STRIPE_SECRET_KEY environment variable is not set')
}

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2025-07-30.basil',
})

export async function POST(request: Request) {
  const body = await request.text()
  const headersList = await headers()
  const signature = headersList.get('stripe-signature')

  if (!signature) {
    console.error('Missing stripe-signature header')
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
    if (!webhookSecret) {
      throw new Error('STRIPE_WEBHOOK_SECRET environment variable is not set')
    }

    event = stripe.webhooks.constructEvent(
      body,
      signature,
      webhookSecret
    )
  } catch (error: any) {
    console.error('Webhook signature verification failed:', error)
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  const supabase = await createClient()

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        // Remove the type assertion - TypeScript can infer the type
        const session = event.data.object
        const { orgId, userId } = session.metadata || {}

        if (!orgId) {
          console.error('Missing orgId in session metadata')
          break
        }

        // Update the order status to paid
        const { error: updateError } = await supabase
          .from('orders')
          .update({
            status: 'paid',
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_session_id', session.id)

        if (updateError) {
          console.error('Error updating order status:', updateError)
        }

        // Here you might also create an enrollment, grant access, etc.
        console.log(`Checkout completed for org ${orgId}, user ${userId}`)
        break
      }

      case 'checkout.session.expired': {
        // Remove the type assertion - TypeScript can infer the type
        const session = event.data.object
        
        const { error: updateError } = await supabase
          .from('orders')
          .update({
            status: 'failed',
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_session_id', session.id)

        if (updateError) {
          console.error('Error updating expired order status:', updateError)
        }
        break
      }

      // Handle other event types as needed
      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error('Webhook processing error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}