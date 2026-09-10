import { AlertTriangle } from "lucide-react";
import { PILOT_BANNER_TEXT } from "@/lib/copy";
import { usePilotConfig } from "@/hooks/usePilotConfig";

/**
 * Persistent, non-dismissible pilot notice shown on every screen,
 * including the public self-assessment and intake routes.
 */
export const PilotBanner = () => {
  const { pilotMode, config } = usePilotConfig();

  if (!pilotMode) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="sticky top-0 z-[100] w-full bg-destructive text-destructive-foreground"
    >
      <div className="flex items-center justify-center gap-2 px-3 py-1.5 text-center">
        <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <span className="text-[11px] font-semibold uppercase tracking-wide sm:text-xs">
          {PILOT_BANNER_TEXT}
        </span>
        {config?.pilot_version && (
          <span className="hidden text-[11px] opacity-80 sm:inline">
            ({config.pilot_version})
          </span>
        )}
      </div>
    </div>
  );
};
