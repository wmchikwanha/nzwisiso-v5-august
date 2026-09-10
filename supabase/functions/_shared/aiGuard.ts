/**
 * Batch 3 — prompt-injection hardening, output validation and rate limiting.
 *
 * Every AI edge function routes untrusted text through `guardInput`, validates
 * structured model output with `validateStructuredOutput`, and records the call
 * in `ai_inference_events`.
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

/** Loose client type: functions in this repo pin different supabase-js versions. */
// deno-lint-ignore no-explicit-any
type AnyClient = any;

export const MAX_INPUT_CHARS = 24_000;

/** Instruction-like patterns in English, Shona and Ndebele. */
const INJECTION_PATTERNS: Array<{ name: string; re: RegExp }> = [
  { name: "ignore_previous", re: /\b(ignore|disregard|forget)\s+(all\s+)?(the\s+)?(previous|prior|above|earlier)\s+(instructions?|prompts?|rules?)\b/i },
  { name: "system_role_token", re: /(^|\n)\s*(system|assistant|developer)\s*:/i },
  { name: "you_are_now", re: /\byou\s+are\s+now\b|\bact\s+as\s+(a|an)\b|\bpretend\s+to\s+be\b/i },
  { name: "reveal_prompt", re: /\b(reveal|print|show|repeat)\s+(your|the)\s+(system\s+)?(prompt|instructions?|rules?)\b/i },
  { name: "override_safety", re: /\b(override|bypass|disable)\s+(your\s+)?(safety|guardrails?|restrictions?|filters?)\b/i },
  { name: "chat_markup", re: /<\|?(im_start|im_end|endoftext)\|?>/i },
  { name: "user_content_spoof", re: /<\/?\s*user_content\s*>/i },
  { name: "shona_ignore", re: /\b(regedza|siyana\s+na|kanganwa)\s+(mirairo|zvawaudzwa)\b/i },
  { name: "shona_act_as", re: /\biwe\s+(zvino\s+)?u(ri|va)\b.*\b(dhokotera|mushandi|sisitimu)\b/i },
  { name: "ndebele_ignore", re: /\b(khohlwa|yekela|dela)\s+(imiyalo|okutshiwo)\b/i },
  { name: "ndebele_act_as", re: /\bwena\s+usu\b|\benza\s+angathi\b/i },
];

/** Medication dosage strings must never appear in AI output. */
const DOSAGE_PATTERNS: RegExp[] = [
  /\b\d+(\.\d+)?\s?(mg|mcg|µg|g|ml|mls|iu)\b/i,
  /\b\d+(\.\d+)?\s?(mg|ml)\s?\/\s?(kg|day|dose|d)\b/i,
  /\b\d+\s?(tablets?|tabs?|capsules?|caps?|drops?|ampoules?|vials?)\b/i,
  /\b(bd|tds|qid|nocte|mane|prn|od)\b\s*(dose|dosing)?/i,
  /\b(titrate|increase|start)\b[^.]{0,40}\b\d+(\.\d+)?\s?(mg|ml)\b/i,
];

export interface GuardResult {
  /** Sanitised text, safe to embed in <user_content>. */
  text: string;
  patterns: string[];
  detected: boolean;
  truncated: boolean;
  /** True when input exceeded the hard cap and should be refused. */
  rejected: boolean;
  originalChars: number;
}

export function guardInput(raw: string | null | undefined, maxChars = MAX_INPUT_CHARS): GuardResult {
  const input = (raw ?? "").toString();
  const patterns: string[] = [];

  let text = input;
  for (const { name, re } of INJECTION_PATTERNS) {
    if (re.test(text)) {
      patterns.push(name);
      text = text.replace(new RegExp(re.source, re.flags.includes("g") ? re.flags : re.flags + "g"), "[removed: instruction-like text]");
    }
  }

  // Neutralise any attempt to close the delimiter or inject system markers.
  text = text.replace(/[<]\s*\/?\s*(user_content|system|assistant)\s*[>]/gi, "[removed]");

  const truncated = text.length > maxChars;
  if (truncated) text = text.slice(0, maxChars);

  return {
    text,
    patterns,
    detected: patterns.length > 0,
    truncated,
    rejected: input.length > maxChars * 2,
    originalChars: input.length,
  };
}

export function containsDosage(text: string): boolean {
  return DOSAGE_PATTERNS.some((re) => re.test(text));
}

/** Remove dosage strings from free text rather than leaking them. */
export function scrubDosages(text: string): string {
  let out = text;
  for (const re of DOSAGE_PATTERNS) {
    out = out.replace(new RegExp(re.source, re.flags.includes("g") ? re.flags : re.flags + "g"), "[dosage removed — prescribing is out of scope]");
  }
  return out;
}

export interface ValidationOutcome<T = unknown> {
  valid: boolean;
  data: T | null;
  errors: string[];
}

/** Parse and shape-check a model response that is meant to be JSON. */
export function validateStructuredOutput<T = Record<string, unknown>>(
  raw: string,
  requiredKeys: string[],
): ValidationOutcome<T> {
  const errors: string[] = [];
  const match = raw?.match(/\{[\s\S]*\}/);
  if (!match) return { valid: false, data: null, errors: ["Response contained no JSON object"] };

  let parsed: any;
  try {
    parsed = JSON.parse(match[0]);
  } catch (e) {
    return { valid: false, data: null, errors: [`JSON parse failed: ${(e as Error).message}`] };
  }

  for (const key of requiredKeys) {
    if (parsed[key] === undefined || parsed[key] === null) errors.push(`Missing required field: ${key}`);
  }
  if (containsDosage(JSON.stringify(parsed))) errors.push("Output contained a medication dosage");

  return { valid: errors.length === 0, data: errors.length === 0 ? (parsed as T) : null, errors };
}

export const FAIL_SAFE_MESSAGE =
  "AI suggestion unavailable, clinical review required.";

export function serviceClient(): AnyClient {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );
}

export interface InferenceLogInput {
  function_name: string;
  actor_id?: string | null;
  actor_role?: string | null;
  patient_id?: string | null;
  model_id?: string | null;
  model_version?: string | null;
  prompt_template_id?: string | null;
  input_chars?: number;
  injection_detected?: boolean;
  injection_patterns?: string[];
  input_rejected?: boolean;
  schema_valid?: boolean | null;
  validation_errors?: string[] | null;
  retried?: boolean;
  dosage_blocked?: boolean;
  latency_ms?: number | null;
}

export async function logInference(db: AnyClient, input: InferenceLogInput): Promise<string | null> {
  try {
    const { data } = await db
      .from("ai_inference_events")
      .insert({
        ...input,
        injection_patterns: input.injection_patterns ?? [],
        validation_errors: input.validation_errors ?? null,
      })
      .select("id")
      .maybeSingle();
    return (data?.id as string) ?? null;
  } catch (e) {
    console.error("logInference failed", e);
    return null;
  }
}

export async function logAudit(
  db: AnyClient,
  event: {
    actor_id?: string | null;
    actor_role?: string | null;
    action: string;
    resource_type: string;
    resource_id?: string | null;
    outcome?: string;
    description?: string;
  },
) {
  try {
    await db.from("audit_events").insert({
      actor_id: event.actor_id ?? null,
      actor_role: event.actor_role ?? "system",
      action: event.action,
      resource_type: event.resource_type,
      resource_id: event.resource_id ?? null,
      outcome: event.outcome ?? "success",
      description: event.description ?? null,
    });
  } catch (e) {
    console.error("logAudit failed", e);
  }
}

/** Auto-create an incident when an AI output fails validation. */
export async function raiseValidationIncident(
  db: AnyClient,
  opts: { function_name: string; errors: string[]; actor_id?: string | null; patient_id?: string | null; dosage?: boolean },
) {
  try {
    await db.from("ai_incidents").insert({
      reported_by: opts.actor_id ?? null,
      reporter_role: "system",
      incident_type: opts.dosage ? "unsafe_content" : "output_validation_failure",
      severity: opts.dosage ? "high" : "medium",
      description: `Automatic: ${opts.function_name} output failed validation — ${opts.errors.join("; ")}`,
      source_function: opts.function_name,
      linked_patient_id: opts.patient_id ?? null,
    });
  } catch (e) {
    console.error("raiseValidationIncident failed", e);
  }
}

export async function sha256Hex(text: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Sliding-window rate limit driven by rate_limit_policies. Returns true when the
 * caller is allowed. Fails open on infrastructure errors so care is never blocked.
 */
export async function checkRateLimit(
  db: AnyClient,
  endpoint: string,
  subject: string | null,
): Promise<{ allowed: boolean; retryAfterSeconds: number }> {
  try {
    const { data: policy } = await db
      .from("rate_limit_policies")
      .select("max_requests, window_seconds, is_active")
      .eq("endpoint", endpoint)
      .maybeSingle();

    if (!policy || policy.is_active === false) return { allowed: true, retryAfterSeconds: 0 };

    const windowSeconds = policy.window_seconds as number;
    const subjectHash = await sha256Hex(`${endpoint}|${subject ?? "anonymous"}|nzwisiso-rl`);
    const bucket = Math.floor(Date.now() / 1000 / windowSeconds) * windowSeconds;
    const windowStart = new Date(bucket * 1000).toISOString();

    const { data: existing } = await db
      .from("rate_limit_counters")
      .select("id, request_count")
      .eq("endpoint", endpoint)
      .eq("subject_hash", subjectHash)
      .eq("window_start", windowStart)
      .maybeSingle();

    if (!existing) {
      await db.from("rate_limit_counters").insert({ endpoint, subject_hash: subjectHash, window_start: windowStart, request_count: 1 });
      return { allowed: true, retryAfterSeconds: 0 };
    }

    if ((existing.request_count as number) >= (policy.max_requests as number)) {
      return { allowed: false, retryAfterSeconds: bucket + windowSeconds - Math.floor(Date.now() / 1000) };
    }

    await db
      .from("rate_limit_counters")
      .update({ request_count: (existing.request_count as number) + 1 })
      .eq("id", existing.id);

    return { allowed: true, retryAfterSeconds: 0 };
  } catch (e) {
    console.error("checkRateLimit failed", e);
    return { allowed: true, retryAfterSeconds: 0 };
  }
}

/** Uniform error body for public endpoints — no enumeration signal. */
export const UNIFORM_PUBLIC_ERROR = { error: "Request could not be completed." };
