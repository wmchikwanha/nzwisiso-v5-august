import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { screeningData, mseFindings, patientContext } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const clinicalContext = buildClinicalContext(screeningData, mseFindings, patientContext);

    const systemPrompt = `You are a psychiatric clinical decision support system providing evidence-based treatment recommendations for Southern African mental health contexts. You support clinicians in Zimbabwe, South Africa, Botswana, and Zambia.

CRITICAL CONSTRAINTS:
- "AI suggests, clinician decides" — all recommendations require professional clinical review
- Never suggest specific medication dosages — only medication classes and general principles
- Never make a definitive treatment decision — support clinical reasoning only
- Flag high-risk presentations for immediate escalation
- All outputs are prefixed: "AI-generated suggestion requiring clinical review"

BREVITY REQUIREMENT:
- Maximum 3 items per array field
- Each text field: 1–2 sentences only
- Omit fields that do not apply to this specific presentation

CLINICAL FRAMEWORK:
1. WHO mhGAP guidelines — primary reference for all recommendations
2. NICE guidelines — secondary reference
3. Stepped-care model — least intensive effective intervention first
4. Resource-aware — consider medication availability and specialist access in Southern African settings
5. Culturally sensitive — acknowledge traditional healing contexts and family/community systems

CULTURAL CONTEXT:
- Traditional healers (n'anga, sangoma) play important roles — acknowledge, do not dismiss
- Family and community involvement in care decisions is often appropriate and expected
- Stigma around mental health is significant — psychoeducation framing matters
- kufungisisa (Shona): "thinking too much" — depression/anxiety, commonly reported
- moyo unorwadza (Shona): "the heart is painful" — somatic expression of grief
- amafufunyana (Zulu/Xhosa): spirit possession — ICD-11 6B63, culturally appropriate explanation

STRUCTURE: Provide primary interventions, psychosocial interventions, pharmacological considerations (class only, no dosages), monitoring plan, and referral criteria.`;

    const toolSchema = {
      type: 'object',
      properties: {
        primary_interventions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              intervention: { type: 'string' },
              rationale: { type: 'string' },
              evidence_base: { type: 'string' },
              priority: { type: 'string', enum: ['urgent', 'high', 'moderate', 'low'] }
            },
            required: ['intervention', 'rationale', 'evidence_base', 'priority']
          }
        },
        psychosocial_interventions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              therapy_type: { type: 'string' },
              description: { type: 'string' },
              target_symptoms: { type: 'array', items: { type: 'string' } },
              session_frequency: { type: 'string' },
              evidence_level: { type: 'string' }
            },
            required: ['therapy_type', 'description', 'target_symptoms']
          }
        },
        pharmacological_considerations: {
          type: 'object',
          properties: {
            indicated: { type: 'boolean' },
            medication_classes: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  class: { type: 'string' },
                  rationale: { type: 'string' },
                  monitoring_requirements: { type: 'string' },
                  cultural_considerations: { type: 'string' }
                }
              }
            },
            contraindications_to_assess: { type: 'array', items: { type: 'string' } }
          }
        },
        monitoring_plan: {
          type: 'object',
          properties: {
            follow_up_frequency: { type: 'string' },
            outcome_measures: { type: 'array', items: { type: 'string' } },
            red_flags: { type: 'array', items: { type: 'string' } },
            review_timeline: { type: 'string' }
          }
        },
        referral_criteria: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              trigger: { type: 'string' },
              specialist_type: { type: 'string' },
              urgency: { type: 'string', enum: ['immediate', 'urgent', 'routine'] }
            }
          }
        },
        cultural_adaptations: { type: 'array', items: { type: 'string' } },
        patient_education_points: { type: 'array', items: { type: 'string' } }
      },
      required: ['primary_interventions', 'psychosocial_interventions', 'monitoring_plan', 'referral_criteria']
    };

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: clinicalContext },
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'generate_treatment_plan',
              description: 'Generate structured evidence-based treatment recommendations',
              parameters: toolSchema,
            },
          },
        ],
        tool_choice: { type: 'function', function: { name: 'generate_treatment_plan' } },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Lovable AI error:', response.status, errorText);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'AI credits exhausted. Please add credits to your Lovable workspace.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const toolCall = data?.choices?.[0]?.message?.tool_calls?.[0];
    const argsStr = toolCall?.function?.arguments;
    if (!argsStr) {
      console.error('No tool call in AI response:', JSON.stringify(data).slice(0, 500));
      throw new Error('No treatment plan generated — invalid response format');
    }
    const treatmentPlan = typeof argsStr === 'string' ? JSON.parse(argsStr) : argsStr;

    console.log('Treatment plan generated successfully');

    return new Response(
      JSON.stringify({ treatmentPlan }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error generating treatment plan:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Failed to generate treatment plan' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function buildClinicalContext(screeningData: any[], mseFindings: any, patientContext: any): string {
  let context = 'CLINICAL ASSESSMENT SUMMARY — please generate evidence-based treatment recommendations:\n\n';

  if (patientContext) {
    context += '## Patient Context\n';
    context += `- Age band: ${patientContext.age_band || patientContext.age || 'Not specified'}\n`;
    context += `- Gender: ${patientContext.gender || 'Not specified'}\n`;
    context += `- Cultural background: ${patientContext.cultural_background || 'Not specified'}\n`;
    context += `- Language preference: ${patientContext.language_preference || 'Not specified'}\n\n`;
  }

  if (screeningData && screeningData.length > 0) {
    context += '## Screening Assessment Results\n';
    screeningData.forEach(screening => {
      context += `- ${screening.tool_type}: Score ${screening.total_score} — ${screening.severity_level} (${screening.interpretation})\n`;
    });
    context += '\n';
  }

  if (mseFindings) {
    context += '## Mental State Examination Findings\n';
    if (mseFindings.appearance) context += `- Appearance/Behaviour: ${mseFindings.appearance}\n`;
    if (mseFindings.speech) context += `- Speech/Thought: ${mseFindings.speech}\n`;
    if (mseFindings.mood) context += `- Mood/Affect: ${mseFindings.mood}\n`;
    if (mseFindings.perception) context += `- Perception: ${mseFindings.perception}\n`;
    if (mseFindings.risk) context += `- Risk: ${mseFindings.risk}\n`;
    if (mseFindings.clinical_impressions) context += `- Clinical Impressions: ${mseFindings.clinical_impressions}\n`;
    context += '\n';
  }

  context += 'Generate WHO mhGAP-aligned treatment recommendations for this presentation.';
  return context;
}
