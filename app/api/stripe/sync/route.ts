// app/api/stripe/sync/route.ts
import { createClient } from '@/lib/supabaseServer'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'

// Initialize Stripe with proper error handling
const stripeSecretKey = process.env.STRIPE_SECRET_KEY

if (!stripeSecretKey) {
  throw new Error('STRIPE_SECRET_KEY environment variable is not set')
}

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2025-07-30.basil', // Use a stable API version
})

export async function POST() {
  const supabase = await createClient()
  
  const { data: { session }, error: sessionError } = await supabase.auth.getSession()

  if (sessionError || !session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Fetch products and prices from Stripe
    const products = await stripe.products.list({ active: true, expand: ['data.default_price'] })
    const prices = await stripe.prices.list({ active: true })

    // Upsert products
    for (const product of products.data) {
      const { error: upsertError } = await supabase
        .from('products')
        .upsert({
          id: product.id,
          active: product.active,
          name: product.name,
          description: product.description,
          image: product.images?.[0] || null,
          metadata: product.metadata,
          updated_at: new Date().toISOString(),
        })

      if (upsertError) {
        console.error('Error upserting product:', upsertError)
      }
    }

    // Upsert prices
    for (const price of prices.data) {
      const { error: upsertError } = await supabase
        .from('prices')
        .upsert({
          id: price.id,
          product_id: price.product as string,
          active: price.active,
          currency: price.currency,
          type: price.type,
          unit_amount: price.unit_amount,
          interval: price.recurring?.interval || null,
          interval_count: price.recurring?.interval_count || null,
          trial_period_days: price.recurring?.trial_period_days || null,
          metadata: price.metadata,
          updated_at: new Date().toISOString(),
        })

      if (upsertError) {
        console.error('Error upserting price:', upsertError)
      }
    }

    return NextResponse.json({ message: 'Synced successfully' })
  } catch (error: any) {
    console.error('Stripe sync error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}