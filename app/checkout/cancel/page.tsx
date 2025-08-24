// app/checkout/cancel/page.tsx
export default function CancelPage() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-gray-900">Payment Canceled</h1>
        <p className="mt-4 text-gray-600">Your payment was canceled. You can try again anytime.</p>
      </div>
    </div>
  )
}