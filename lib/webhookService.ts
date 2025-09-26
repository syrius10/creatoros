import { createClient } from '@/lib/client'; // Use client-side client, not server
import { signWebhookPayload, verifyWebhookSignature, validateWebhookUrl } from './webhookUtils';

export class WebhookService {
  private readonly supabase;

  constructor() {
    this.supabase = createClient(); // This should be synchronous
  }

  async triggerWebhook(eventType: string, payload: any, orgId: string) {
    // Find active webhooks for this event type and org
    const { data: webhooks, error } = await this.supabase
      .from('webhooks')
      .select('*')
      .eq('org_id', orgId)
      .eq('is_active', true)
      .contains('event_types', [eventType]);

    if (error) {
      console.error('Error fetching webhooks:', error);
      return;
    }

    for (const webhook of webhooks || []) {
      // Validate webhook URL before attempting delivery
      if (!validateWebhookUrl(webhook.url)) {
        console.error(`Invalid webhook URL for webhook ${webhook.id}`);
        continue;
      }
      
      await this.deliverWebhook(webhook, eventType, payload);
    }
  }

  private async deliverWebhook(webhook: any, eventType: string, payload: any) {
    const deliveryRecord = await this.createDeliveryRecord(webhook.id, eventType, payload);

    try {
      const payloadString = JSON.stringify(payload);
      const signature = signWebhookPayload(payloadString, webhook.secret);
      
      // Use AbortController for timeout instead of the timeout property
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), webhook.timeout_ms || 5000);

      const response = await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': signature,
          'X-Webhook-Event': eventType,
          'User-Agent': 'CreatorOS/1.0'
        },
        body: JSON.stringify({
          event: eventType,
          data: payload,
          webhook_id: webhook.id,
          delivery_id: deliveryRecord.id,
          timestamp: new Date().toISOString()
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      const responseBody = await response.text();

      await this.updateDeliveryRecord(deliveryRecord.id, {
        response_status: response.status,
        response_body: responseBody,
        status: response.status >= 200 && response.status < 300 ? 'delivered' : 'failed'
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${responseBody}`);
      }

    } catch (error) {
      console.error('Webhook delivery failed:', error);
      await this.handleDeliveryFailure(deliveryRecord.id, webhook, error);
    }
  }

  // Static method to verify incoming webhook signatures
  static async verifyIncomingWebhook(request: Request, secret: string): Promise<boolean> {
    const signature = request.headers.get('X-Webhook-Signature');
    if (!signature) return false;

    try {
      // Clone request to read body without consuming it
      const body = await request.text();
      return verifyWebhookSignature(body, signature, secret);
    } catch {
      return false;
    }
  }

  private async createDeliveryRecord(webhookId: string, eventType: string, payload: any) {
    const { data, error } = await this.supabase
      .from('webhook_deliveries')
      .insert([{
        webhook_id: webhookId,
        event_type: eventType,
        payload,
        status: 'processing'
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  private async updateDeliveryRecord(deliveryId: string, updates: any) {
    await this.supabase
      .from('webhook_deliveries')
      .update({
        ...updates,
        last_attempt_at: new Date().toISOString()
      })
      .eq('id', deliveryId);
  }

  private async handleDeliveryFailure(deliveryId: string, webhook: any, error: any) {
    const { data: delivery, error: fetchError } = await this.supabase
      .from('webhook_deliveries')
      .select('*')
      .eq('id', deliveryId)
      .single();

    if (fetchError) {
      console.error('Error fetching delivery record:', fetchError);
      return;
    }

    const attemptCount = (delivery?.attempt_count || 0) + 1;

    if (attemptCount >= (webhook.retry_count || 3)) {
      // Max retries reached
      await this.updateDeliveryRecord(deliveryId, {
        status: 'failed',
        error_message: error.message,
        attempt_count: attemptCount
      });
    } else {
      // Schedule retry with exponential backoff
      const retryDelay = Math.min(1000 * Math.pow(2, attemptCount), 300000); // Max 5 minutes
      const nextRetry = new Date(Date.now() + retryDelay);

      await this.updateDeliveryRecord(deliveryId, {
        status: 'pending',
        error_message: error.message,
        attempt_count: attemptCount,
        next_retry_at: nextRetry.toISOString()
      });
    }
  }

  // Add method to retry failed deliveries
  async retryFailedDeliveries() {
    const { data: failedDeliveries, error } = await this.supabase
      .from('webhook_deliveries')
      .select(`
        *,
        webhooks (*)
      `)
      .eq('status', 'pending')
      .lt('next_retry_at', new Date().toISOString());

    if (error) {
      console.error('Error fetching failed deliveries:', error);
      return;
    }

    for (const delivery of failedDeliveries || []) {
      if (delivery.webhooks) {
        await this.deliverWebhook(delivery.webhooks, delivery.event_type, delivery.payload);
      }
    }
  }
}

// Create singleton instance
export const webhookService = new WebhookService();