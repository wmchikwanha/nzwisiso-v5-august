import { ShieldCheck, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const SAFEGUARDS: { title: string; detail: string }[] = [
  { title: "AI suggests, clinician decides", detail: "Every AI output is labelled as a suggestion and needs explicit clinician approval before it is finalised." },
  { title: "Immutable audit trail", detail: "Every clinical action (who, role, what, when, outcome) is written to an append-only log that cannot be edited or deleted." },
  { title: "Deterministic safety rules", detail: "Screening scores, crisis triggers (PHQ-9 item 9, SSQ-14 item 2) and referral thresholds are calculated by fixed, versioned rules — never by AI." },
  { title: "No medication dosages", detail: "AI outputs are scanned and blocked if any dosage is detected." },
  { title: "No personal identifiers", detail: "Patients are pseudonymised with clinician-defined codes; consent logs use hashed IP addresses." },
  { title: "Role-based access", detail: "CHW, nurse, clinician, admin, Principal Investigator and Safety Monitor each see only what their role allows, enforced on the server." },
  { title: "Model governance", detail: "Pinned AI model versions, a safety test suite with adversarial cases, promotion gates and drift monitoring." },
  { title: "Incident reporting", detail: "Any user can report an unsafe AI output; reports go to a reviewed safety queue with corrective-action notes." },
  { title: "Prompt-injection & input guard", detail: "Inputs are length-capped, screened for manipulation attempts and logged; invalid AI output falls back safely." },
  { title: "Encrypted audio retention", detail: "Recordings are stored privately; playback is limited to the Principal Investigator and Safety Monitor and is itself audited." },
  { title: "Pilot mode", detail: "During the pilot all records are marked synthetic and exports are watermarked." },
];

export const GovernanceDialog = () => (
  <Dialog>
    <DialogTrigger asChild>
      <Button variant="outline" size="sm" className="gap-1.5 border-primary/40 text-primary">
        <ShieldCheck className="h-4 w-4" /> Ethics &amp; Governance
      </Button>
    </DialogTrigger>
    <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-primary" /> Ethics, Safety &amp; Governance
        </DialogTitle>
        <DialogDescription>
          Safeguards built into Nzwisiso for clinical, ethical and research oversight.
        </DialogDescription>
      </DialogHeader>
      <ul className="space-y-3">
        {SAFEGUARDS.map((s) => (
          <li key={s.title} className="flex gap-3">
            <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-sm">{s.title}</p>
              <p className="text-sm text-muted-foreground">{s.detail}</p>
            </div>
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap gap-1.5 pt-2">
        {["FHIR R4 AuditEvent", "WHO mhGAP", "POPIA", "Zimbabwe DPA", "SaMD-aware"].map((t) => (
          <Badge key={t} variant="outline" className="text-xs font-normal">{t}</Badge>
        ))}
      </div>
      <p className="text-xs text-muted-foreground border-t pt-3">
        Full AI model details: <Link to="/model-info" className="underline text-primary">AI model information</Link>.
        Each patient record includes its own audit trail.
      </p>
    </DialogContent>
  </Dialog>
);
