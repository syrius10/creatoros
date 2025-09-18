import { createClient } from './supabaseServer';

export async function trackAffiliatePurchase(purchaseId: string, amount: number) {
  const supabase = await createClient();
  
  // Get affiliate code from cookie
  const affiliateCode = getCookie('affiliate_code');
  
  if (!affiliateCode) return null;

  // Get affiliate details
  const { data: affiliate, error: affiliateError } = await supabase
    .from('affiliates')
    .select('id, program_id')
    .eq('code', affiliateCode)
    .eq('status', 'approved')
    .single();

  if (affiliateError || !affiliate) return null;

  // Get program commission rate
  const { data: program, error: programError } = await supabase
    .from('affiliate_programs')
    .select('commission_rate')
    .eq('id', affiliate.program_id)
    .single();

  if (programError || !program) return null;

  // Calculate commission
  const commissionAmount = (amount * program.commission_rate) / 100;

  // Create commission record
  const { data: commission, error } = await supabase
    .from('affiliate_commissions')
    .insert([{
      affiliate_id: affiliate.id,
      referral_id: 'needs-implementation', // You'd need to track the referral ID
      purchase_id: purchaseId,
      amount: commissionAmount,
      commission_rate: program.commission_rate,
      status: 'pending'
    }])
    .select()
    .single();

  if (error) {
    console.error('Error creating commission:', error);
    return null;
  }

  return commission;
}

// Helper function to get cookie (simplified)
function getCookie(name: string): string | null {
  if (typeof document !== 'undefined') {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
  }
  return null;
}