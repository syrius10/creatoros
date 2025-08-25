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

// Helper function to verify webhook signature
async function verifyWebhookSignature(request: Request): Promise<Stripe.Event> {
  const body = await request.text()
  const headersList = await headers()
  const signature = headersList.get('stripe-signature')

  if (!signature) {
    throw new Error('Missing stripe-signature header')
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    throw new Error('STRIPE_WEBHOOK_SECRET environment variable is not set')
  }

  return stripe.webhooks.constructEvent(body, signature, webhookSecret)
}

// Helper function to handle checkout.session.completed event
async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session, supabase: any) {
  const orgId = session.metadata?.orgId

  if (!orgId) {
    console.error('Missing orgId in session metadata')
    return
  }

  // Update the order status to paid
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .update({
      status: 'paid',
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_session_id', session.id)
    .select()
    .single()

  if (orderError) {
    console.error('Error updating order:', orderError)
    return
  }

  if (!order?.customer_email) {
    return
  }

  // Get user by email from profiles table
  const { data: userProfile, error: profileError } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', order.customer_email)
    .single()

  if (profileError) {
    console.error('Error finding user profile:', profileError)
    return
  }

  if (!userProfile) {
    return
  }

  // Create enrollment
  const { error: enrollmentError } = await supabase
    .from('enrollments')
    .insert({
      org_id: orgId,
      course_id: order.price_id,
      profile_id: userProfile.id,
      order_id: order.id,
    })

  if (enrollmentError) {
    console.error('Error creating enrollment:', enrollmentError)
  }
}

// Helper function to handle checkout.session.expired event
async function handleCheckoutSessionExpired(session: Stripe.Checkout.Session, supabase: any) {
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
}

export async function POST(request: Request) {
  try {
    const event = await verifyWebhookSignature(request)
    const supabase = await createClient()

    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object, supabase)
        break

      case 'checkout.session.expired':
        await handleCheckoutSessionExpired(event.data.object, supabase)
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error('Webhook processing error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}