import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { AI_LAYER_LABEL, RULES_ENGINE_VERSION, scrubDosages } from "../_shared/rulesEngine.ts";
import { NoActiveModelError, provenanceOf, resolveAIConfig, asUserContent } from "../_shared/aiRegistry.ts";

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
  SSQ14?: { score: number; severity: string };
}

/** Entities extracted by the NLP layer — never scored by it. */
interface ExtractedEntities {
  presentingComplaints?: string[];
  symptomDuration?: string;
  culturalIdioms?: { term: string; language: string; interpretedMeaning: string }[];
  riskStatements?: { type: string; verbatim: string }[];
  moodDescriptors?: string[];
  sleepDisturbance?: boolean;
  appetiteChange?: boolean;
  psychomotorChanges?: string;
  psychoticFeatures?: { hallucinations?: boolean; delusions?: boolean; disorganisation?: boolean };
  substanceUse?: { substance: string; frequency: string }[];
  functionalImpairment?: string;
  socialContext?: string;
}

/** mhGAP module pre-selected by the deterministic rules engine. */
interface MHGAPModule {
  moduleCode: string;
  moduleName: string;
  interventions: string[];
  mhgapVersion: string;
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
  extractedEntities?: ExtractedEntities;
  crisisPathway?: { pathwayType: string; urgency: string };
  mhgapModule?: MHGAPModule;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const { screeningData, mseFindings, patientContext, framework, extractedEntities, crisisPathway, mhgapModule }: DiagnosticRequest = await req.json();

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
- You receive PRE-CALCULATED screening scores and a PRE-SELECTED mhGAP module produced by a
  deterministic rules engine. NEVER recompute, re-band, contradict or second-guess a score.
- You receive PRE-EXTRACTED clinical entities, not raw narrative. Reason only from what is given.
- Your diagnostic suggestions must be consistent with the supplied mhGAP module category.
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

    const clinicalSummary = buildClinicalSummary(screeningData, mseFindings, patientContext, extractedEntities, crisisPathway, mhgapModule);

    // Model, safety preamble and prompt all come from the governance registry.
    const aiConfig = await resolveAIConfig("suggest-diagnosis", systemPrompt);

    const toolSchema = {
      type: 'object',
      properties: {
        primaryDiagnosis: {
          type: 'object',
          properties: {
            code: { type: 'string', description: `${framework} diagnostic code` },
            name: { type: 'string', description: 'Full diagnosis name' },
            confidence: { type: 'number', description: 'Confidence percentage (0-100)' },
            supportingEvidence: { type: 'array', items: { type: 'string' } },
            reasoning: { type: 'string' }
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
          }
        },
        culturalFormulation: { type: 'string' },
        clinicalAlerts: { type: 'array', items: { type: 'string' } },
        additionalAssessments: { type: 'array', items: { type: 'string' } }
      },
      required: ['primaryDiagnosis', 'differentialDiagnoses', 'culturalFormulation', 'clinicalAlerts']
    };

    const guard = guardInput(clinicalSummary);
    const startedAt = Date.now();
    const db = guardClient();

    const callModel = (correction?: string) => fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
      },
      body: JSON.stringify({
        model: aiConfig.modelId,
        messages: [
          { role: 'system', content: aiConfig.systemPrompt },
          { role: 'user', content: asUserContent(guard.text) },
          ...(correction ? [{ role: 'user', content: correction }] : []),
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'suggest_diagnoses',
              description: 'Provide structured diagnostic suggestions based on clinical evidence',
              parameters: toolSchema,
            },
          },
        ],
        tool_choice: { type: 'function', function: { name: 'suggest_diagnoses' } },
      }),
    });

    const aiResponse = await callModel();

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('Lovable AI error:', aiResponse.status, errorText);
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: 'AI credits exhausted. Please add credits to your Lovable workspace.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      return new Response(
        JSON.stringify({ error: `AI gateway error: ${aiResponse.status}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const extractArgs = async (res: Response) => {
      const data = await res.json();
      const args = data?.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
      if (!args) return '';
      return typeof args === 'string' ? args : JSON.stringify(args);
    };

    const REQUIRED = ['primaryDiagnosis', 'differentialDiagnoses', 'culturalFormulation'];
    let outcome = validateStructuredOutput<Record<string, unknown>>(await extractArgs(aiResponse), REQUIRED);
    let retried = false;

    if (!outcome.valid) {
      // One retry, then fail safe — never surface a partial diagnostic result.
      retried = true;
      const retryRes = await callModel(
        `Your previous response was rejected: ${outcome.errors.join('; ')}. Return the complete structured result with no medication dosages.`,
      );
      outcome = retryRes.ok
        ? validateStructuredOutput<Record<string, unknown>>(await extractArgs(retryRes), REQUIRED)
        : outcome;
    }

    const dosageBlocked = outcome.errors.some((e) => e.includes('dosage'));

    await logInference(db, {
      function_name: 'suggest-diagnosis',
      model_id: aiConfig.modelId,
      model_version: aiConfig.modelVersionLabel,
      prompt_template_id: aiConfig.promptTemplateId,
      input_chars: guard.originalChars,
      injection_detected: guard.detected,
      injection_patterns: guard.patterns,
      schema_valid: outcome.valid,
      validation_errors: outcome.valid ? null : outcome.errors,
      retried,
      dosage_blocked: dosageBlocked,
      latency_ms: Date.now() - startedAt,
    });

    if (guard.detected) {
      await logAudit(db, {
        action: 'injection_pattern_detected',
        resource_type: 'DiagnosticReport',
        outcome: 'flagged',
        description: `suggest-diagnosis: ${guard.patterns.join(', ')}`,
      });
    }

    if (!outcome.valid) {
      await logAudit(db, {
        action: dosageBlocked ? 'dosage_pattern_blocked' : 'output_validation_failed',
        resource_type: 'DiagnosticReport',
        outcome: 'failure',
        description: `suggest-diagnosis: ${outcome.errors.join('; ')}`,
      });
      await raiseValidationIncident(db, {
        function_name: 'suggest-diagnosis',
        errors: outcome.errors,
        dosage: dosageBlocked,
      });
      return new Response(
        JSON.stringify({ error: FAIL_SAFE_MESSAGE, validation_failed: true }),
        { status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const suggestions = outcome.data as Record<string, any>;


    const result = {
      ...scrubDosages(suggestions),
      framework,
      mhgapModule: mhgapModule ?? null,
      rulesEngineVersion: RULES_ENGINE_VERSION,
      aiLayerLabel: AI_LAYER_LABEL,
      modelId: aiConfig.modelId,
      modelVersion: aiConfig.modelVersionLabel,
      promptTemplateId: aiConfig.promptTemplateId,
      promptTemplateVersion: aiConfig.promptTemplateVersion,
      provenance: provenanceOf(aiConfig).provenance,
      generatedAt: new Date().toISOString(),
      disclaimer: 'AI-generated suggestion requiring clinical review. The final diagnosis is the responsibility of the treating clinician.',
    };

    // Emit as SSE to preserve the existing frontend contract
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    const encoder = new TextEncoder();
    (async () => {
      try {
        await writer.write(encoder.encode(`data: ${JSON.stringify({ result })}\n\n`));
        await writer.write(encoder.encode('data: [DONE]\n\n'));
      } finally {
        writer.close();
      }
    })();

    console.log('Diagnostic suggestions generated successfully');
    return new Response(readable, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    if (error instanceof NoActiveModelError) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 503,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
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
  patientContext?: DiagnosticRequest['patientContext'],
  extractedEntities?: ExtractedEntities,
  crisisPathway?: { pathwayType: string; urgency: string },
  mhgapModule?: MHGAPModule,
): string {
  let summary = 'Please analyse the following STRUCTURED clinical data and provide diagnostic suggestions.\n';
  summary += 'All scores below were calculated deterministically. Do not recalculate them.\n\n';

  if (mhgapModule) {
    summary += `## mhGAP Module (pre-selected by the deterministic rules engine — ${mhgapModule.mhgapVersion})\n`;
    summary += `- ${mhgapModule.moduleCode} — ${mhgapModule.moduleName}\n`;
    summary += `- Interventions in scope: ${mhgapModule.interventions.join('; ')}\n\n`;
  }

  if (crisisPathway && crisisPathway.pathwayType !== 'none') {
    summary += `## Crisis pathway (deterministic)\n- ${crisisPathway.pathwayType} — urgency: ${crisisPathway.urgency}\n\n`;
  }

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
  if (screeningData.PRIMER5) summary += `- PRIME-R-5 (Prodromal Psychosis): Score ${screeningData.PRIMER5.score}/25 — ${screeningData.PRIMER5.riskLevel}\n`;
  if (screeningData.SSQ14) summary += `- SSQ-14 (Shona Symptom Questionnaire): Score ${screeningData.SSQ14.score}/14 — ${screeningData.SSQ14.severity}\n`;

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

  if (extractedEntities) {
    summary += '\n## Extracted Clinical Entities (NLP layer output — not scored)\n';
    const e = extractedEntities;
    if (e.presentingComplaints?.length) summary += `- Presenting complaints: ${e.presentingComplaints.join('; ')}\n`;
    if (e.symptomDuration) summary += `- Symptom duration: ${e.symptomDuration}\n`;
    if (e.moodDescriptors?.length) summary += `- Mood descriptors: ${e.moodDescriptors.join('; ')}\n`;
    if (e.sleepDisturbance !== undefined) summary += `- Sleep disturbance: ${e.sleepDisturbance}\n`;
    if (e.appetiteChange !== undefined) summary += `- Appetite change: ${e.appetiteChange}\n`;
    if (e.psychomotorChanges) summary += `- Psychomotor changes: ${e.psychomotorChanges}\n`;
    if (e.psychoticFeatures) summary += `- Psychotic features: ${JSON.stringify(e.psychoticFeatures)}\n`;
    if (e.substanceUse?.length) summary += `- Substance use: ${e.substanceUse.map(s2 => `${s2.substance} (${s2.frequency})`).join('; ')}\n`;
    if (e.culturalIdioms?.length) summary += `- Cultural idioms: ${e.culturalIdioms.map(i => `${i.term} [${i.language}] = ${i.interpretedMeaning}`).join('; ')}\n`;
    if (e.riskStatements?.length) summary += `- Risk statements: ${e.riskStatements.map(r => `${r.type}: "${r.verbatim}"`).join('; ')}\n`;
    if (e.functionalImpairment) summary += `- Functional impairment: ${e.functionalImpairment}\n`;
    if (e.socialContext) summary += `- Social context: ${e.socialContext}\n`;
  }

  summary += '\nProvide structured diagnostic suggestions based on this structured clinical information.';

  return summary;
}
