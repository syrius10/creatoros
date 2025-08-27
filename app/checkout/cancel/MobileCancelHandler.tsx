// app/checkout/cancel/MobileCancelHandler.tsx
'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

interface MobileCancelHandlerProps {
  readonly course_id?: string;
}

export default function MobileCancelHandler({ course_id }: Readonly<MobileCancelHandlerProps>) {
  const [redirectAttempted, setRedirectAttempted] = useState(false);
  const searchParams = useSearchParams();

  // Additional client-side check for mobile source
  const clientSource = searchParams?.get('source');
  const clientCourseId = searchParams?.get('course_id');

  useEffect(() => {
    // Try to deep link back to the mobile app
    if (!redirectAttempted && clientSource === 'mobile') {
      setRedirectAttempted(true);
      const effectiveCourseId = course_id || clientCourseId;
      const deepLinkUrl = `creatoros://purchase-cancel?course_id=${effectiveCourseId || ''}`;
      
      // Attempt to redirect to mobile app
      window.location.href = deepLinkUrl;
    }
  }, [course_id, clientCourseId, clientSource, redirectAttempted]);

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md text-center">
        <h1 className="text-2xl font-bold text-gray-900">Payment Canceled</h1>
        <p className="mt-4 text-gray-600">Your payment was not completed.</p>
        <p className="mt-2 text-sm text-gray-500">
          You can try again from the mobile app.
        </p>
        <button 
          onClick={() => window.location.href = 'creatoros://courses'}
          className="mt-4 px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
        >
          Return to App
        </button>
      </div>
    </div>
  );
}