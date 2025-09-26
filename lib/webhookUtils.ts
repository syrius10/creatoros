import crypto from 'crypto';

export function generateWebhookSecret(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  
  // Use timingSafeEqual to prevent timing attacks
  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  } catch {
    return false;
  }
}

export function signWebhookPayload(payload: string, secret: string): string {
  return crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
}

export function validateWebhookUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.protocol === 'https:'; // Require HTTPS for security
  } catch {
    return false;
  }
}

// Helper function to validate event types
export function validateEventTypes(eventTypes: string[]): boolean {
  const validEvents = [
    'user.signup',
    'course.enrollment',
    'course.completion',
    'payment.completed',
    'content.accessed'
  ];
  
  return eventTypes.every(event => validEvents.includes(event));
}