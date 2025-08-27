// app/checkout/success/MobileSuccessHandler.tsx
'use client';

import { useEffect, useState } from 'react';

interface MobileSuccessHandlerProps {
  readonly session_id: string;
  readonly course_id?: string;
  readonly order: any;
}

export default function MobileSuccessHandler({ 
  session_id, 
  course_id, 
  order 
}: Readonly<MobileSuccessHandlerProps>) {
  const [redirectAttempted, setRedirectAttempted] = useState(false);

  useEffect(() => {
    // Try to deep link back to the mobile app
    if (!redirectAttempted) {
      setRedirectAttempted(true);
      const deepLinkUrl = `creatoros://purchase-success?session_id=${session_id}&course_id=${course_id || ''}`;
      
      // Attempt to redirect to mobile app
      window.location.href = deepLinkUrl;
      
      // Fallback: if still on page after 2 seconds, show instructions
      const timeout = setTimeout(() => {
        console.log('Mobile deep link may not have worked');
      }, 2000);
      
      return () => clearTimeout(timeout);
    }
  }, [session_id, course_id, redirectAttempted]);

  if (!order || order.status !== 'paid') {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md">
          <h1 className="text-2xl font-bold text-gray-900">Processing your payment...</h1>
          <p className="mt-4 text-gray-600">Please wait while we confirm your payment.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md text-center">
        <h1 className="text-2xl font-bold text-gray-900">Payment Successful! 🎉</h1>
        <p className="mt-4 text-gray-600">Redirecting you back to the mobile app...</p>
        <p className="mt-2 text-sm text-gray-500">
          If you're not redirected automatically, please return to the CreatorOS app.
        </p>
        <button 
          onClick={() => window.location.href = `creatoros://courses`}
          className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Open App
        </button>
      </div>
    </div>
  );
}