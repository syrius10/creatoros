// app/pricing/page.tsx
import { createClient } from '@/lib/supabaseServer'
import { redirect } from 'next/navigation'
import CheckoutButton from './checkout-button'

export default async function Pricing() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    redirect('/signin')
  }

  // Fetch products with prices using the new syntax
  const { data: products } = await supabase
    .from('products')
    .select(`
      id,
      name,
      description,
      image,
      prices (
        id,
        active,
        currency,
        type,
        unit_amount,
        interval,
        interval_count,
        trial_period_days
      )
    `)
    .eq('active', true)
    .eq('prices.active', true)
    // Remove the deprecated foreignTable option and use a different approach
    .order('unit_amount', { referencedTable: 'prices', ascending: true })

  // Alternative approach if the above still doesn't work:
  // Sort the products manually after fetching
  const sortedProducts = products?.sort((a, b) => {
    const priceA = a.prices?.[0]?.unit_amount || 0
    const priceB = b.prices?.[0]?.unit_amount || 0
    return priceA - priceB
  })

  return (
    <div className="min-h-screen bg-gray-100 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Pricing
          </h1>
          <p className="mt-4 text-lg text-gray-600">
            Choose the plan that's right for you
          </p>
        </div>

        <div className="mt-16 space-y-12 lg:space-y-0 lg:grid lg:grid-cols-3 lg:gap-x-8">
          {sortedProducts?.map((product) => (
            <div key={product.id} className="relative p-8 bg-white border border-gray-200 rounded-2xl shadow-sm flex flex-col">
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-gray-900">{product.name}</h3>
                <p className="mt-4 flex items-baseline text-gray-900">
                  <span className="text-5xl font-extrabold tracking-tight">
                    ${product.prices?.[0]?.unit_amount ? product.prices[0].unit_amount / 100 : 0}
                  </span>
                  {product.prices?.[0]?.interval && (
                    <span className="ml-1 text-xl font-semibold text-gray-500">
                      /{product.prices[0].interval}
                    </span>
                  )}
                </p>
                <p className="mt-6 text-gray-600">{product.description}</p>
              </div>

              <CheckoutButton priceId={product.prices?.[0]?.id} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}