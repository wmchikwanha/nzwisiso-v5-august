import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ScreeningData {
  PHQ9?: { score: number; severity: string };
  GAD7?: { score: number; severity: string };
  PCL5?: { score: number; severity: string };
  MMSE?: { score: number; interpretation: string };
  PSQ?: { score: number; positiveScreens: string[] };
  PRIMER5?: { score: number; riskLevel: string };
}

interface MSEFindings {
  appearance?: string;
  behavior?: string;
  speech?: string;
  mood?: string;
  affect?: string;
  thought_process?: string;
  thought_content?: string;
  perceptions?: string;
  cognition?: string;
  insight?: string;
  judgment?: string;
  risk_assessment?: string;
}

interface DiagnosticRequest {
  screeningData: ScreeningData;
  mseFindings: MSEFindings;
  patientContext?: {
    age?: number;
    gender?: string;
    culturalBackground?: string;
    presentingComplaint?: string;
  };
  framework: 'ICD-11' | 'DSM-5';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');
    if (!ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY is not configured');
    }

    const { screeningData, mseFindings, patientContext, framework }: DiagnosticRequest = await req.json();

    console.log('Generating diagnostic suggestions for framework:', framework);

    const frameworkInstructions = framework === 'ICD-11'
      ? `Use ICD-11 diagnostic codes exclusively (e.g., 6A80 for Major Depressive Disorder, 6B00 for PTSD, 6A20 for Schizophrenia).
Use the ICD-11 alphanumeric coding system. Do NOT use DSM-5 codes.
Reference ICD-11-specific features: dimensional personality disorders, Complex PTSD (6B41), Prolonged Grief Disorder (6B42), ICD-11 6B63 for possession trance disorder.
Follow WHO classification naming conventions.`
      : `Use DSM-5 diagnostic codes exclusively (e.g., 300.02 for GAD, 296.xx for MDD, 309.81 for PTSD).
Use DSM-5 numeric coding and specifiers. Do NOT use ICD-11 codes.
Reference DSM-5-specific features: severity specifiers, course specifiers, categorical personality disorders.
Follow APA classification naming conventions.`;

    const systemPrompt = `You are an expert psychiatric diagnostic consultant for the Nzwisiso clinical decision support system, assisting psychiatrists and mental health clinicians in Southern Africa.

You use ${framework} diagnostic criteria exclusively.
${frameworkInstructions}

CRITICAL CONSTRAINTS:
- "AI suggests, clinician decides" — all suggestions require professional clinical review
- Never provide a definitive diagnosis — support clinical reasoning only
- Never suggest specific medication dosages
- Flag high-risk presentations immediately (suicidal ideation, psychosis, self-harm)
- Confidence percentages reflect evidence match to ${framework} criteria only

CULTURAL CONTEXT — Southern African idioms of distress to recognise:
- kufungisisa (Shona): "thinking too much" — depression/anxiety
- kunzwisa tsitsi (Shona): "to evoke pity/compassion" — may reflect passive suicidal ideation via burden narrative; screen carefully
- moyo unorwadza (Shona): "the heart is painful" — somatic expression of grief/depression
- amafufunyana (isiZulu/Xhosa): spirit possession — ICD-11 6B63 possession trance; do NOT pathologise as psychosis without careful assessment
- ukuthwasa (Zulu/Xhosa): ancestral calling — do NOT pathologise; normal cultural process
- ukufa kwabantu (Zulu/Xhosa): illness from ancestors — important in formulation
- moeg vir die lewe (Afrikaans): "tired of life" — HIGH RISK passive suicidal ideation
- kufikiria sana (Swahili): "thinking too much" — depression/anxiety
- moyo unauma (Swahili): "painful heart" — depression

All AI outputs are suggestions prefixed: "AI-generated suggestion requiring clinical review."`;

    const clinicalSummary = buildClinicalSummary(screeningData, mseFindings, patientContext);

    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 4096,
        stream: true,
        system: systemPrompt,
        messages: [{ role: 'user', content: clinicalSummary }],
        tools: [
          {
            name: 'suggest_diagnoses',
            description: 'Provide structured diagnostic suggestions based on clinical evidence',
            input_schema: {
              type: 'object',
              properties: {
                primaryDiagnosis: {
                  type: 'object',
                  properties: {
                    code: { type: 'string', description: `${framework} diagnostic code` },
                    name: { type: 'string', description: 'Full diagnosis name' },
                    confidence: { type: 'number', description: 'Confidence percentage (0-100)' },
                    supportingEvidence: {
                      type: 'array',
                      items: { type: 'string' },
                      description: 'Clinical findings supporting this diagnosis'
                    },
                    reasoning: { type: 'string', description: 'Brief clinical reasoning' }
                  },
                  required: ['code', 'name', 'confidence', 'supportingEvidence', 'reasoning']
                },
                differentialDiagnoses: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      code: { type: 'string' },
                      name: { type: 'string' },
                      confidence: { type: 'number' },
                      supportingEvidence: { type: 'array', items: { type: 'string' } },
                      reasoning: { type: 'string' }
                    },
                    required: ['code', 'name', 'confidence', 'supportingEvidence', 'reasoning']
                  },
                  description: 'Alternative diagnoses to consider'
                },
                culturalFormulation: {
                  type: 'string',
                  description: 'Cultural considerations relevant to diagnosis in Southern African context'
                },
                clinicalAlerts: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Important clinical alerts (risk factors, urgent considerations)'
                },
                additionalAssessments: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Recommended additional assessments or investigations'
                }
              },
              required: ['primaryDiagnosis', 'differentialDiagnoses', 'culturalFormulation', 'clinicalAlerts']
            }
          }
        ],
        tool_choice: { type: 'tool', name: 'suggest_diagnoses' }
      }),
    });

    if (!claudeResponse.ok) {
      const errorText = await claudeResponse.text();
      console.error('Claude API error:', claudeResponse.status, errorText);
      return new Response(
        JSON.stringify({ error: `Claude API error: ${claudeResponse.status}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Commit to streaming
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    const encoder = new TextEncoder();

    (async () => {
      const reader = claudeResponse.body!.getReader();
      const decoder = new TextDecoder();
      let evtBuffer = '';
      let jsonBuffer = '';  // accumulates input_json_delta fragments for tool use
      let tokenCount = 0;
      let stopReason = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          evtBuffer += decoder.decode(value, { stream: true });
          const lines = evtBuffer.split('\n');
          evtBuffer = lines.pop() ?? '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith('data: ')) continue;

            const jsonStr = trimmed.slice(6);
            if (jsonStr === '[DONE]') continue;

            try {
              const event = JSON.parse(jsonStr);

              if (
                event.type === 'content_block_delta' &&
                event.delta?.type === 'input_json_delta' &&
                event.delta?.partial_json
              ) {
                jsonBuffer += event.delta.partial_json;
                tokenCount++;
                if (tokenCount % 15 === 0) {
                  await writer.write(encoder.encode(
                    `data: ${JSON.stringify({ tokens: tokenCount })}\n\n`
                  ));
                }
              } else if (event.type === 'message_delta' && event.delta?.stop_reason) {
                stopReason = event.delta.stop_reason;
              }
            } catch { /* skip malformed SSE events */ }
          }
        }

        // All tool input received — parse and validate
        if (stopReason === 'max_tokens') {
          throw new Error('AI response was truncated (max_tokens reached). Please try again.');
        }
        const suggestions = JSON.parse(jsonBuffer);
        if (!suggestions.primaryDiagnosis || !suggestions.differentialDiagnoses) {
          throw new Error('Invalid AI response format — missing required diagnostic fields');
        }

        const result = {
          ...suggestions,
          framework,
          generatedAt: new Date().toISOString(),
          disclaimer: 'AI-generated suggestion requiring clinical review. The final diagnosis is the responsibility of the treating clinician.',
        };

        console.log('Diagnostic suggestions generated successfully, tokens:', tokenCount);
        await writer.write(encoder.encode(`data: ${JSON.stringify({ result })}\n\n`));
        await writer.write(encoder.encode('data: [DONE]\n\n'));
      } catch (error) {
        console.error('Streaming error in suggest-diagnosis:', error);
        const msg = error instanceof Error ? error.message : 'Unknown error';
        await writer.write(encoder.encode(`data: ${JSON.stringify({ error: msg })}\n\n`));
        await writer.write(encoder.encode('data: [DONE]\n\n'));
      } finally {
        writer.close();
      }
    })();

    return new Response(readable, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('Error in suggest-diagnosis:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function buildClinicalSummary(
  screeningData: ScreeningData,
  mseFindings: MSEFindings,
  patientContext?: DiagnosticRequest['patientContext']
): string {
  let summary = 'Please analyse the following clinical data and provide diagnostic suggestions:\n\n';

  if (patientContext) {
    summary += '## Patient Context\n';
    if (patientContext.age) summary += `- Age: ${patientContext.age}\n`;
    if (patientContext.gender) summary += `- Gender: ${patientContext.gender}\n`;
    if (patientContext.culturalBackground) summary += `- Cultural Background: ${patientContext.culturalBackground}\n`;
    if (patientContext.presentingComplaint) summary += `- Presenting Complaint: ${patientContext.presentingComplaint}\n`;
    summary += '\n';
  }

  summary += '## Screening Tool Results\n';
  if (screeningData.PHQ9) summary += `- PHQ-9 (Depression): Score ${screeningData.PHQ9.score}/27 — ${screeningData.PHQ9.severity}\n`;
  if (screeningData.GAD7) summary += `- GAD-7 (Anxiety): Score ${screeningData.GAD7.score}/21 — ${screeningData.GAD7.severity}\n`;
  if (screeningData.PCL5) summary += `- PCL-5 (PTSD): Score ${screeningData.PCL5.score}/80 — ${screeningData.PCL5.severity}\n`;
  if (screeningData.MMSE) summary += `- MMSE (Cognitive): Score ${screeningData.MMSE.score}/30 — ${screeningData.MMSE.interpretation}\n`;
  if (screeningData.PSQ) summary += `- PSQ (Psychosis): Score ${screeningData.PSQ.score}/5 — Positive screens: ${screeningData.PSQ.positiveScreens.join(', ') || 'None'}\n`;
  if (screeningData.PRIMER5) summary += `- PRIME-R-5 (Prodromal Psychosis): Score ${screeningData.PRIMER5.score}/30 — ${screeningData.PRIMER5.riskLevel}\n`;

  summary += '\n## Mental State Examination Findings\n';
  if (mseFindings.appearance) summary += `- Appearance: ${mseFindings.appearance}\n`;
  if (mseFindings.behavior) summary += `- Behaviour: ${mseFindings.behavior}\n`;
  if (mseFindings.speech) summary += `- Speech: ${mseFindings.speech}\n`;
  if (mseFindings.mood) summary += `- Mood: ${mseFindings.mood}\n`;
  if (mseFindings.affect) summary += `- Affect: ${mseFindings.affect}\n`;
  if (mseFindings.thought_process) summary += `- Thought Process: ${mseFindings.thought_process}\n`;
  if (mseFindings.thought_content) summary += `- Thought Content: ${mseFindings.thought_content}\n`;
  if (mseFindings.perceptions) summary += `- Perceptions: ${mseFindings.perceptions}\n`;
  if (mseFindings.cognition) summary += `- Cognition: ${mseFindings.cognition}\n`;
  if (mseFindings.insight) summary += `- Insight: ${mseFindings.insight}\n`;
  if (mseFindings.judgment) summary += `- Judgment: ${mseFindings.judgment}\n`;
  if (mseFindings.risk_assessment) summary += `- Risk Assessment: ${mseFindings.risk_assessment}\n`;

  summary += '\nProvide structured diagnostic suggestions based on this clinical information.';

  return summary;
}
