// app/api/checkout/route.ts
import { createClient } from '@/lib/supabaseServer'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-07-30.basil',
})

export async function POST(request: Request) {
  const supabase = await createClient()
  
  const { data: { session: authSession }, error: sessionError } = await supabase.auth.getSession()

  if (sessionError || !authSession) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { priceId, orgId } = await request.json()

    if (!priceId || !orgId) {
      return NextResponse.json({ error: 'Missing priceId or orgId' }, { status: 400 })
    }

    // Get the price details
    const { data: price, error: priceError } = await supabase
      .from('prices')
      .select('*')
      .eq('id', priceId)
      .single()

    if (priceError || !price) {
      return NextResponse.json({ error: 'Price not found' }, { status: 404 })
    }

    // Create a checkout session
    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: price.type === 'recurring' ? 'subscription' : 'payment',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/cancel`,
      customer_email: authSession.user.email,
      metadata: {
        orgId,
        userId: authSession.user.id,
      },
    })

    // Create an order record
    const { error: orderError } = await supabase
      .from('orders')
      .insert({
        org_id: orgId,
        price_id: priceId,
        stripe_session_id: session.id,
        amount_total: price.unit_amount,
        currency: price.currency,
        customer_email: authSession.user.email,
        status: 'pending',
      })

    if (orderError) {
      console.error('Order creation error:', orderError)
      return NextResponse.json({ error: orderError.message }, { status: 500 })
    }

    return NextResponse.json({ url: session.url })
  } catch (error: any) {
    console.error('Checkout error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}