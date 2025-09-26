import crypto from 'crypto';

export function generateApiKey(prefix: string = 'sk_'): string {
  const randomBytes = crypto.randomBytes(32);
  const base64Key = randomBytes.toString('base64');
  const key = prefix + base64Key.replace(/\//g, '_').replace(/\+/g, '-');
  return key.slice(0, 64); // Ensure consistent length
}

export function hashApiKey(apiKey: string): string {
  return crypto.createHash('sha256').update(apiKey).digest('hex');
}

export function validateApiKeyFormat(apiKey: string): boolean {
  return apiKey.startsWith('sk_') && apiKey.length === 64;
}

export function validateScopes(requestedScopes: string[], allowedScopes: string[]): boolean {
  return requestedScopes.every(scope => allowedScopes.includes(scope));
}

export const API_SCOPES = {
  READ_COURSES: 'courses:read',
  WRITE_COURSES: 'courses:write',
  READ_USERS: 'users:read',
  WRITE_USERS: 'users:write',
  READ_ANALYTICS: 'analytics:read',
  WEBHOOKS: 'webhooks:manage'
} as const;