import { supabase } from "@/integrations/supabase/client";
import { RULES_ENGINE_VERSION } from "@/lib/clinical/rulesEngine";

let cachedId: string | null = null;
let inflight: Promise<string | null> | null = null;

/**
 * Resolve the database id of the currently active deterministic rules engine
 * version, so every screening row records exactly which logic scored it.
 * Returns null if the registry row is unavailable — the screening still saves.
 */
export async function getRulesVersionId(): Promise<string | null> {
  if (cachedId) return cachedId;
  if (inflight) return inflight;

  inflight = (async () => {
    const { data, error } = await supabase
      .from("rules_engine_versions")
      .select("id")
      .eq("version", RULES_ENGINE_VERSION)
      .maybeSingle();

    if (error) {
      console.error("Could not resolve rules engine version", error);
      return null;
    }
    cachedId = (data?.id as string) ?? null;
    return cachedId;
  })();

  const result = await inflight;
  inflight = null;
  return result;
}
