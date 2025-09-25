import { createClient } from './supabaseServer';

export async function evaluateTriggers(event: {
  userId: string;
  eventType: string;
  entityType?: string;
  entityId?: string;
  metadata?: any;
}) {
  const supabase = await createClient();
  
  // Get active triggers that match the event type
  const { data: triggers, error } = await supabase
    .from('automation_triggers')
    .select('*')
    .eq('is_active', true)
    .eq('trigger_type', event.eventType);

  if (error) {
    console.error('Error fetching triggers:', error);
    return;
  }

  for (const trigger of triggers) {
    if (await matchesTriggerConditions(trigger, event)) {
      await startUserJourney(trigger, event.userId, event.metadata);
    }
  }
}

async function matchesTriggerConditions(trigger: any, event: any): Promise<boolean> {
  // Basic condition matching - extend based on your needs
  const conditions = trigger.conditions || {};
  
  // Example: Check if entity matches
  if (conditions.entity_id && conditions.entity_id !== event.entityId) {
    return false;
  }
  
  // Add more condition checks as needed
  return true;
}

async function startUserJourney(trigger: any, userId: string, metadata?: any) {
  const supabase = await createClient();
  
  // Get sequences associated with this trigger
  const { data: sequences } = await supabase
    .from('sequences')
    .select('*')
    .eq('id', trigger.sequence_id) // Assuming trigger has sequence_id
    .eq('is_active', true);

  if (!sequences || sequences.length === 0) return;

  const sequence = sequences[0];
  
  // Get first step
  const { data: steps } = await supabase
    .from('sequence_steps')
    .select('*')
    .eq('sequence_id', sequence.id)
    .order('step_order', { ascending: true })
    .limit(1);

  if (!steps || steps.length === 0) return;

  const firstStep = steps[0];

  // Create user journey
  const { data: journey, error } = await supabase
    .from('user_journeys')
    .insert([{
      user_id: userId,
      sequence_id: sequence.id,
      trigger_id: trigger.id,
      current_step_id: firstStep.id,
      status: 'active',
      metadata
    }])
    .select()
    .single();

  if (error) {
    console.error('Error creating user journey:', error);
    return;
  }

  // Execute first step
  await executeStep(journey, firstStep);
}

export async function executeStep(journey: any, step: any) {
  const supabase = await createClient();
  
  // Record step start
  await supabase
    .from('journey_events')
    .insert([{
      journey_id: journey.id,
      step_id: step.id,
      event_type: 'step_started',
      metadata: { step_order: step.step_order }
    }]);

  if (step.action_type === 'email') {
    await sendAutomationEmail(journey.user_id, step);
  } else if (step.action_type === 'delay') {
    // Schedule next step after delay
    setTimeout(async () => {
      await proceedToNextStep(journey, step);
    }, (step.delay_days || 1) * 24 * 60 * 60 * 1000);
  }
}

async function sendAutomationEmail(userId: string, step: any) {
  const supabase = await createClient();
  
  // Get user email
  const { data: user } = await supabase
    .from('profiles')
    .select('email')
    .eq('id', userId)
    .single();

  if (!user) return;

  // Send email using your email service
  // This is a placeholder - integrate with your actual email system
  console.log(`Sending automation email to ${user.email} with template ${step.email_template_id}`);
  
  // Record email sent event
  // await supabase.from('journey_events').insert(...);
}

async function proceedToNextStep(journey: any, currentStep: any) {
  const supabase = await createClient();
  
  // Get next step
  const { data: nextSteps } = await supabase
    .from('sequence_steps')
    .select('*')
    .eq('sequence_id', journey.sequence_id)
    .gt('step_order', currentStep.step_order)
    .order('step_order', { ascending: true })
    .limit(1);

  if (!nextSteps || nextSteps.length === 0) {
    // No more steps - complete journey
    await supabase
      .from('user_journeys')
      .update({ 
        status: 'completed', 
        completed_at: new Date().toISOString(),
        current_step_id: null
      })
      .eq('id', journey.id);
    return;
  }

  const nextStep = nextSteps[0];
  
  // Update journey to next step
  await supabase
    .from('user_journeys')
    .update({ current_step_id: nextStep.id })
    .eq('id', journey.id);

  // Execute next step
  await executeStep(journey, nextStep);
}