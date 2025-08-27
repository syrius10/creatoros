// app/checkout/cancel/page.tsx
import MobileCancelHandler from './MobileCancelHandler'

// Define the props interface with Promise searchParams
interface CancelPageProps {
  readonly searchParams: Promise<{ 
    course_id?: string;
    source?: string;
  }>
}

export default async function CancelPage(props: Readonly<CancelPageProps>) {
  const searchParams = await props.searchParams;
  const course_id = searchParams.course_id;
  const source = searchParams.source;

  // If coming from mobile, render the mobile handler
  if (source === 'mobile') {
    return <MobileCancelHandler course_id={course_id} />;
  }

  // Regular web cancel page
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-gray-900">Payment Canceled</h1>
        <p className="mt-4 text-gray-600">Your payment was canceled. You can try again anytime.</p>
      </div>
    </div>
  );
}