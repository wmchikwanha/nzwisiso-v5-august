import { AlertTriangle } from "lucide-react";
import { PILOT_BANNER_TEXT } from "@/lib/copy";
import { usePilotConfig } from "@/hooks/usePilotConfig";

/**
 * Persistent, non-dismissible pilot notice shown on every screen,
 * including the public self-assessment and intake routes.
 */
export const PilotBanner = () => {
  const { config } = usePilotConfig();

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
      </div>
    </div>
  );
};
