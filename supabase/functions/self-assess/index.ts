import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { resolveAIConfig, NoActiveModelError, asUserContent } from "../_shared/aiRegistry.ts";
import {
  guardInput,
  validateStructuredOutput,
  logInference,
  logAudit,
  raiseValidationIncident,
  checkRateLimit,
  UNIFORM_PUBLIC_ERROR,
} from "../_shared/aiGuard.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

function ok(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
function bad(message: string, status = 400) {
  return ok({ error: message }, status);
}

async function hashIp(ip: string | null): Promise<string | null> {
  if (!ip) return null;
  const data = new TextEncoder().encode(ip + "|nzwisiso-salt");
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

async function generateAiSuggestions(opts: {
  phq9Score: number;
  severity: string;
  q9Flag: boolean;
  ageBand?: string;
  gender?: string;
  region?: string;
  language?: string;
  narrative?: string;
}) {
  if (!LOVABLE_API_KEY) return null;

  const system = `You are a psychiatric diagnostic consultant. The data below comes from a public self-assessment. Provide preliminary diagnostic considerations strictly for the receiving clinician — never to be shown to the self-assessor. Use ICD-11. Cultural context: Southern African (Zimbabwe/SA). Be cautious; this is a screening signal only. Always include the disclaimer that the data is self-reported and unverified.`;

  const user = `Self-assessment data:
- PHQ-9 score: ${opts.phq9Score}/27 (${opts.severity})
- Item-9 (suicidal ideation) flagged: ${opts.q9Flag ? "YES — urgent" : "no"}
- Age band: ${opts.ageBand ?? "unknown"}
- Gender: ${opts.gender ?? "unknown"}
- Region: ${opts.region ?? "unknown"}
- Preferred language: ${opts.language ?? "en"}

Self-reported narrative:
${opts.narrative?.trim() || "(none provided)"}

Provide JSON with shape:
{
  "primary_consideration": { "code": "ICD-11 code", "name": "string", "confidence": 0-100, "reasoning": "string" },
  "differential": [ { "code": "string", "name": "string", "confidence": 0-100, "reasoning": "string" } ],
  "cultural_formulation": "string",
  "clinical_alerts": ["string"],
  "recommended_next_steps": ["string"]
}
Output JSON only, no prose.`;

  try {
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
    });
    if (!res.ok) {
      console.error("Lovable AI error", res.status, await res.text());
      return null;
    }
    const data = await res.json();
    const text = data?.choices?.[0]?.message?.content ?? "";
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return { raw: text };
    try {
      return JSON.parse(match[0]);
    } catch {
      return { raw: text };
    }
  } catch (e) {
    console.error("AI suggestion error", e);
    return null;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return bad("Method not allowed", 405);

  let payload: any;
  try {
    payload = await req.json();
  } catch {
    return bad("Invalid JSON");
  }

  const action = payload?.action as string;
  const token = payload?.session_token as string | undefined;
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;

  try {
    // ── start ─────────────────────────────────────────
    if (action === "start") {
      const language = (payload.language_code ?? "en") as string;
      const { data, error } = await supabase
        .from("self_assessment_sessions")
        .insert({ language_code: language })
        .select("id, session_token")
        .single();
      if (error) throw error;
      return ok({ session: data });
    }

    if (!token) return bad("session_token required");
    const { data: session, error: sErr } = await supabase
      .from("self_assessment_sessions")
      .select("*")
      .eq("session_token", token)
      .single();
    if (sErr || !session) return bad("Invalid session", 404);

    // ── save_consents ─────────────────────────────────
    if (action === "save_consents") {
      const consents = (payload.consents ?? []) as Array<any>;
      const ipHash = await hashIp(ip);
      const rows = consents.map((c) => ({
        session_id: session.id,
        consent_type: String(c.consent_type),
        granted: !!c.granted,
        consent_text_version: c.consent_text_version ?? "1.0",
        language_code: session.language_code,
        ip_hash: ipHash,
      }));
      if (rows.length) {
        const { error } = await supabase.from("self_assessment_consents").insert(rows);
        if (error) throw error;
      }
      return ok({ ok: true });
    }

    // ── save_demographics ─────────────────────────────
    if (action === "save_demographics") {
      const { error } = await supabase
        .from("self_assessment_sessions")
        .update({
          demographics: payload.demographics ?? {},
          location_region: payload.location_region ?? null,
          latitude: typeof payload.latitude === "number" ? payload.latitude : null,
          longitude: typeof payload.longitude === "number" ? payload.longitude : null,
        })
        .eq("id", session.id);
      if (error) throw error;
      return ok({ ok: true });
    }

    // ── save_screening ────────────────────────────────
    if (action === "save_screening") {
      const totalScore = Number(payload.total_score) || 0;
      const itemFlags = payload.item_flags ?? {};
      const isCrisis = !!itemFlags.suicidal_ideation;
      const { error } = await supabase.from("self_assessment_responses").insert({
        session_id: session.id,
        tool_type: String(payload.tool_type ?? "PHQ-9"),
        responses: payload.responses ?? {},
        total_score: totalScore,
        severity_level: payload.severity_level ?? null,
        interpretation: payload.interpretation ?? null,
        item_flags: itemFlags,
      });
      if (error) throw error;
      if (isCrisis) {
        await supabase
          .from("self_assessment_sessions")
          .update({ risk_level: "crisis" })
          .eq("id", session.id);
      }
      return ok({ ok: true, crisis: isCrisis });
    }

    // ── save_narrative ────────────────────────────────
    if (action === "save_narrative") {
      const { error } = await supabase
        .from("self_assessment_sessions")
        .update({ narrative_text: String(payload.narrative_text ?? "") })
        .eq("id", session.id);
      if (error) throw error;
      return ok({ ok: true });
    }

    // ── list_facilities (for recipient picker) ────────
    if (action === "list_facilities") {
      const { data: facs } = await supabase
        .from("facilities")
        .select(
          "id, facility_name, facility_type, region, province, city, latitude, longitude, contact_phone, contact_email, website, services_offered, specialisations, emergency_capable"
        )
        .eq("is_active", true)
        .eq("accepts_referrals", true);
      const list = (facs ?? []).map((f) => {
        let distance_km: number | null = null;
        if (
          typeof session.latitude === "number" &&
          typeof session.longitude === "number" &&
          f.latitude !== null &&
          f.longitude !== null
        ) {
          distance_km = haversineKm(
            { lat: Number(session.latitude), lng: Number(session.longitude) },
            { lat: Number(f.latitude), lng: Number(f.longitude) }
          );
        }
        return { ...f, distance_km };
      });
      list.sort((a, b) => {
        const ar = a.region === session.location_region ? 0 : 1;
        const br = b.region === session.location_region ? 0 : 1;
        if (ar !== br) return ar - br;
        const ad = a.distance_km ?? Number.POSITIVE_INFINITY;
        const bd = b.distance_km ?? Number.POSITIVE_INFINITY;
        return ad - bd;
      });
      return ok({ facilities: list });
    }

    // ── submit (patient picks recipient(s)) ───────────
    if (action === "submit") {
      const facilityIds = (payload.facility_ids ?? []) as string[];
      if (!Array.isArray(facilityIds) || facilityIds.length === 0)
        return bad("Pick at least one facility");

      // Fetch latest screening for context
      const { data: latestScreen } = await supabase
        .from("self_assessment_responses")
        .select("*")
        .eq("session_id", session.id)
        .order("completed_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      const phq9 = latestScreen?.tool_type === "PHQ-9" ? latestScreen : null;
      const ai = await generateAiSuggestions({
        phq9Score: phq9?.total_score ?? 0,
        severity: phq9?.severity_level ?? "minimal",
        q9Flag: !!phq9?.item_flags?.suicidal_ideation,
        ageBand: session.demographics?.age_band,
        gender: session.demographics?.gender,
        region: session.location_region ?? undefined,
        language: session.language_code,
        narrative: session.narrative_text ?? undefined,
      });

      // Persist AI suggestions on the session (recipient-only via RLS)
      await supabase
        .from("self_assessment_sessions")
        .update({
          ai_diagnostic_suggestions: ai,
          status: "submitted",
          completed_at: new Date().toISOString(),
        })
        .eq("id", session.id);

      // Create one referral per picked facility
      const referrals = facilityIds.map((fid) => ({
        session_id: session.id,
        facility_id: fid,
      }));
      const { error: rErr } = await supabase.from("facility_referrals").insert(referrals);
      if (rErr) throw rErr;

      // Return public-safe payload (NO ai suggestions)
      const { data: chosen } = await supabase
        .from("facilities")
        .select(
          "id, facility_name, facility_type, region, city, contact_phone, contact_email, website, services_offered, emergency_capable"
        )
        .in("id", facilityIds);

      return ok({
        ok: true,
        is_crisis: session.risk_level === "crisis",
        facilities: (chosen ?? []).map((f) => ({
          name: f.facility_name,
          type: f.facility_type,
          city: f.city,
          phone: f.contact_phone,
          email: f.contact_email,
          website: f.website,
          services: f.services_offered,
          emergency: f.emergency_capable,
        })),
      });
    }

    return bad(`Unknown action: ${action}`);
  } catch (e) {
    console.error("self-assess error", e);
    return bad(e instanceof Error ? e.message : "Internal error", 500);
  }
});
