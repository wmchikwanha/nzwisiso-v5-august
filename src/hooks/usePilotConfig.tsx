import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface PilotConfig {
  id: string;
  pilot_mode: boolean;
  allow_real_data: boolean;
  pilot_version: string;
  pilot_end_date: string | null;
}

/**
 * Module-level cache so the banner and any other consumer share one fetch.
 * Also mirrored to a synchronous getter used by non-React code (PDF/FHIR export).
 */
let cached: PilotConfig | null = null;
let inflight: Promise<PilotConfig | null> | null = null;
const listeners = new Set<(c: PilotConfig | null) => void>();

export const getPilotConfigSync = (): PilotConfig | null => cached;

/** True when we have no config yet — fail safe: assume pilot mode is on. */
export const isPilotModeSync = (): boolean => cached?.pilot_mode !== false;

export const fetchPilotConfig = async (force = false): Promise<PilotConfig | null> => {
  if (cached && !force) return cached;
  if (inflight && !force) return inflight;

  inflight = (async () => {
    const { data, error } = await supabase
      .from("pilot_config")
      .select("id, pilot_mode, allow_real_data, pilot_version, pilot_end_date")
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("Failed to load pilot config", error);
      return cached;
    }
    cached = (data as PilotConfig) ?? null;
    listeners.forEach((l) => l(cached));
    return cached;
  })();

  const result = await inflight;
  inflight = null;
  return result;
};

export const usePilotConfig = () => {
  const [config, setConfig] = useState<PilotConfig | null>(cached);
  const [loading, setLoading] = useState(!cached);

  useEffect(() => {
    listeners.add(setConfig);
    fetchPilotConfig().then(() => setLoading(false));
    return () => {
      listeners.delete(setConfig);
    };
  }, []);

  return {
    config,
    loading,
    /** Fail safe: treat unknown state as pilot mode on. */
    pilotMode: config?.pilot_mode !== false,
    refresh: () => fetchPilotConfig(true),
  };
};
