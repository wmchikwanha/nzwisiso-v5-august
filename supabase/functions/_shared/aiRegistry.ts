/**
 * AI model lifecycle registry accessor.
 *
 * Every clinical AI function resolves its model, safety preamble and prompt
 * template from the database at call time. Nothing is hardcoded, and a function
 * refuses to run when no active model version is configured.
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

export type ClinicalFunctionName =
  | "process-narrative"
  | "transcribe-audio"
  | "process-document"
  | "suggest-diagnosis"
  | "generate-treatment-plan"
  | "ask-ai"
  | "self-assess";

export interface ActiveModel {
  id: string;
  provider: string;
  model_id: string;
  model_version_label: string;
}

export interface ResolvedPrompt {
  modelVersionId: string;
  modelId: string;
  modelVersionLabel: string;
  promptTemplateId: string;
  promptTemplateVersion: number;
  safetyPreambleId: string | null;
  safetyPreambleVersion: number | null;
  safetyPreambleHash: string | null;
  /** Safety preamble + task prompt, in that order. Send as the system message. */
  systemPrompt: string;
}

export class NoActiveModelError extends Error {
  constructor() {
    super(
      "No active AI model version is configured. An administrator must activate one in the Model Registry before this feature can run.",
    );
    this.name = "NoActiveModelError";
  }
}

export function serviceClient() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );
}

async function sha256(text: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 32);
}

/**
 * Resolve everything this invocation needs. `defaultTaskPrompt` is the
 * bootstrap value: it is written into prompt_templates as version 1 the first
 * time a function runs, after which the database row is the source of truth.
 */
export async function resolveAIConfig(
  functionName: ClinicalFunctionName,
  defaultTaskPrompt: string,
): Promise<ResolvedPrompt> {
  const db = serviceClient();

  const { data: model, error: modelError } = await db
    .from("model_versions")
    .select("id, provider, model_id, model_version_label")
    .eq("status", "active")
    .order("pinned_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (modelError) throw modelError;
  if (!model) throw new NoActiveModelError();

  const { data: preamble } = await db
    .from("ai_safety_preambles")
    .select("id, version, preamble_text, preamble_hash")
    .eq("is_current", true)
    .limit(1)
    .maybeSingle();

  let { data: template } = await db
    .from("prompt_templates")
    .select("id, version, system_prompt, safety_preamble_hash")
    .eq("function_name", functionName)
    .eq("status", "active")
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!template) {
    const { data: inserted, error: insertError } = await db
      .from("prompt_templates")
      .insert({
        function_name: functionName,
        version: 1,
        system_prompt: defaultTaskPrompt,
        safety_preamble_id: preamble?.id ?? null,
        safety_preamble_hash: preamble?.preamble_hash ?? (await sha256(defaultTaskPrompt)),
        status: "active",
        notes: "Seeded automatically from the function's built-in baseline prompt.",
      })
      .select("id, version, system_prompt, safety_preamble_hash")
      .single();
    if (insertError) throw insertError;
    template = inserted;
  }

  const systemPrompt = [preamble?.preamble_text, template!.system_prompt]
    .filter(Boolean)
    .join("\n\n");

  return {
    modelVersionId: model.id as string,
    modelId: model.model_id as string,
    modelVersionLabel: model.model_version_label as string,
    promptTemplateId: template!.id as string,
    promptTemplateVersion: template!.version as number,
    safetyPreambleId: (preamble?.id as string) ?? null,
    safetyPreambleVersion: (preamble?.version as number) ?? null,
    safetyPreambleHash: (preamble?.preamble_hash as string) ?? null,
    systemPrompt,
  };
}

/** Provenance block to store alongside any AI-generated output. */
export function provenanceOf(cfg: ResolvedPrompt, extra: Record<string, unknown> = {}) {
  return {
    ai_generated: true,
    model_id: cfg.modelId,
    model_version: cfg.modelVersionLabel,
    prompt_template_id: cfg.promptTemplateId,
    prompt_template_version: String(cfg.promptTemplateVersion),
    provenance: {
      model_version_id: cfg.modelVersionId,
      safety_preamble_id: cfg.safetyPreambleId,
      safety_preamble_version: cfg.safetyPreambleVersion,
      safety_preamble_hash: cfg.safetyPreambleHash,
      generated_at: new Date().toISOString(),
      ...extra,
    },
  };
}

/** Wrap untrusted clinical text so the model treats it as data, not instructions. */
export function asUserContent(text: string): string {
  return `<user_content>\n${text}\n</user_content>`;
}
