import { NextRequest } from 'next/server';
import { createClient } from './supabaseServer';
import { hashApiKey, validateScopes } from './apiKeyUtils';

export async function authenticateApiKey(request: NextRequest, requiredScopes: string[] = []) {
  const authHeader = request.headers.get('Authorization');
  
  if (!authHeader?.startsWith('Bearer ')) {
    return { error: 'Missing or invalid Authorization header' };
  }

  const apiKey = authHeader.slice(7);
  const keyHash = hashApiKey(apiKey);

  const supabase = await createClient();
  const { data: apiKeyRecord, error } = await supabase
    .from('api_keys')
    .select('*')
    .eq('key_hash', keyHash)
    .eq('is_active', true)
    .single();

  if (error || !apiKeyRecord) {
    return { error: 'Invalid API key' };
  }

  // Check expiration
  if (apiKeyRecord.expires_at && new Date(apiKeyRecord.expires_at) < new Date()) {
    return { error: 'API key has expired' };
  }

  // Check scopes
  if (requiredScopes.length > 0 && !validateScopes(requiredScopes, apiKeyRecord.scopes)) {
    return { error: 'Insufficient permissions' };
  }

  // Update last used timestamp
  await supabase
    .from('api_keys')
    .update({ last_used_at: new Date().toISOString() })
    .eq('id', apiKeyRecord.id);

  return { apiKey: apiKeyRecord };
}

export function rateLimit(apiKey: any, cost: number = 1) {
  // Simple rate limiting based on requests per minute

  // This would be enhanced with Redis in production
  if (apiKey.rate_limit_per_minute && cost > apiKey.rate_limit_per_minute) {
    return { allowed: false, remaining: 0 };
  }

  // Implement more sophisticated rate limiting here
  return { allowed: true, remaining: apiKey.rate_limit_per_minute - cost };
}