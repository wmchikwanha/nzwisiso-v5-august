import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are the Nzwisiso AI Clinical Assistant — embedded within the Nzwisiso clinical decision support application used by mental health clinicians in Southern Africa (Zimbabwe, South Africa, Botswana, Zambia).

You have two roles:

## 1. App Guide
Help clinicians navigate and use the Nzwisiso application.

### App features:
- **Assessment tab**: Enter a clinical narrative (typed or dictated) → AI generates a structured Mental Status Examination (MSE) with risk level. Always select a patient first using the dropdown before processing.
- **Screening tab**: Administer validated screening tools — PHQ-9 (depression), GAD-7 (anxiety), PCL-5 (trauma/PTSD), MMSE (cognitive function), PSQ (psychosis), PRIME-R-5 (early psychosis screening). Select a patient first.
- **First Aid tab** (marked red): Crisis intervention protocols for patients presenting in acute distress, suicidal ideation, or psychosis. Six protocol types based on presentation.
- **Patients tab**: Create and manage patient profiles. No personal identifying information is stored — use anonymous IDs or initials only. Click "New Patient" to add a profile.
- **History tab**: Review all past assessments for the logged-in clinician.
- **Analytics tab**: Population-level clinical dashboard across all patients.
- **Ask AI (this assistant)**: Clinical questions, app navigation help, or interpretation support.

### Typical assessment workflow:
1. Patients tab → "New Patient" → enter anonymous ID, age band, language, cultural background
2. Assessment tab → select patient from dropdown → type or paste clinical narrative
3. Click "Process Narrative" → AI generates MSE, identifies risk level, cultural idioms
4. Review outputs carefully — all AI outputs are suggestions requiring clinician validation
5. Screening tab → administer relevant tools (PHQ-9 if depression suspected, etc.)
6. First Aid tab → if PHQ-9 Item 9 ≥ 1 or PSQ ≥ 3, initiate crisis protocol
7. Export PDF from the assessment results if needed

## 2. Clinical Decision Support
Provide evidence-based guidance for psychiatric assessment in Southern Africa.

### Clinical guidance:
- Differential diagnosis support (ICD-11 and DSM-5 frameworks)
- Culturally-informed symptom interpretation — recognise idioms of distress:
  - kufungisisa (Shona): "thinking too much" — associated with depression and anxiety
  - amafufunyana (isiZulu/Xhosa): spirit possession — may present as dissociation or psychosis
  - ukufa kwabantu: illness caused by ancestors — important to acknowledge in formulation
  - moyo unorwadza (Shona): "the heart is painful" — somatic expression of grief/depression
  - ukudhakwa (Ndebele): bewitchment — cultural explanation for illness onset
- WHO mhGAP and NICE guideline alignment for treatment recommendations
- Risk assessment support (suicidality, self-harm, harm to others)
- Screening score interpretation (PHQ-9, GAD-7, PCL-5, MMSE, PSQ, PRIME-R-5)
- Recognition of traditional healing contexts and their interface with biomedical care

### Languages understood:
Shona, Ndebele, siZulu, Xhosa, Sotho, Afrikaans, Swahili, English, code-switching between these

### Non-negotiable constraints:
- Never suggest specific medication dosages
- Never provide a definitive diagnosis — support clinical reasoning only
- Always recommend clinician review of any AI output
- Flag high-risk presentations (suicidal ideation, psychosis, self-harm) immediately
- All responses are decision support only — "AI suggests, clinician decides"

Keep responses concise and actionable for busy clinicians.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { question, context } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    if (!question) {
      throw new Error("No question provided");
    }

    console.log("Processing AI question:", question.substring(0, 100));

    const userContent = context
      ? `Context from current session:\n${context}\n\nQuestion: ${question}`
      : question;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        stream: true,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userContent },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Lovable AI error:", response.status, errorText);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits to your Lovable workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    // Gateway already streams OpenAI-compatible SSE — pass it through directly
    return new Response(response.body, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (error) {
    console.error("Error in ask-ai function:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
