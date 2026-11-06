/** "What this prototype is not" — shown on the About panel, sign-in page and governance panel. */
export const PrototypeLimits = ({ className = "" }: { className?: string }) => (
  <div className={`rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm ${className}`}>
    <p className="font-semibold text-foreground mb-1">What this prototype is not</p>
    <ul className="list-disc list-inside space-y-0.5 text-muted-foreground">
      <li>It does not diagnose or recommend treatment.</li>
      <li>It has not been evaluated with clinicians or patients, and has no ethics approval for live use.</li>
      <li>Its translations and flags are drafts. The clinician is responsible for every word in the record.</li>
    </ul>
  </div>
);
