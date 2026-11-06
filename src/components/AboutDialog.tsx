import { Info } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { APP_ONE_LINER, IDIOM_LIBRARY_NOTE } from "@/lib/copy";
import { PrototypeLimits } from "@/components/PrototypeLimits";

export const AboutDialog = () => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9">
          <Info className="h-5 w-5 stroke-[2.5]" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            About Nzwisiso
            <Badge variant="secondary" className="text-xs">v3.1</Badge>
          </DialogTitle>
          <DialogDescription className="text-left space-y-4 pt-4">
            <p className="text-foreground font-medium">
              Research prototype for multilingual mental health documentation, designed with Southern African languages in mind
            </p>
            
            <div className="space-y-4 text-sm">
              <div>
                <p className="font-semibold text-foreground mb-1">What It Does</p>
                <p>
                  {APP_ONE_LINER} ("Nzwisiso" means "understanding" in Shona.) Separate views exist
                  for community health workers, nurses and clinicians, with role-based access.
                </p>
              </div>

              <div>
                <p className="font-semibold text-foreground mb-2">Key Features</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div className="space-y-1.5">
                    <p className="font-medium text-foreground text-xs uppercase tracking-wide">Assessment</p>
                    <ul className="list-disc list-inside space-y-0.5 ml-1 text-muted-foreground">
                      <li>Voice-to-text narrative capture</li>
                      <li>Voice Activity Detection (VAD)</li>
                      <li>Helps the clinician lay out a mental state examination draft</li>
                      <li>Rule-based safety flags (draft, for clinician review)</li>
                    </ul>
                  </div>
                  <div className="space-y-1.5">
                    <p className="font-medium text-foreground text-xs uppercase tracking-wide">Screening Tools</p>
                    <ul className="list-disc list-inside space-y-0.5 ml-1 text-muted-foreground">
                      <li>PHQ-9 (Depression)</li>
                      <li>GAD-7 (Anxiety)</li>
                      <li>PCL-5 (PTSD)</li>
                      <li>MMSE (Cognitive)</li>
                      <li>PSQ (Psychosis)</li>
                      <li>PRIME-R-5 (Prodromal)</li>
                    </ul>
                  </div>
                  <div className="space-y-1.5">
                    <p className="font-medium text-foreground text-xs uppercase tracking-wide">Diagnosis & Treatment</p>
                    <ul className="list-disc list-inside space-y-0.5 ml-1 text-muted-foreground">
                      <li>Clinician diagnosis (entered by the clinician), ICD-11/DSM-5</li>
                      <li>Differential diagnosis workspace</li>
                                            <li>Draft care-plan notes referencing WHO mhGAP</li>
                      <li>Case Summary PDF export</li>
                    </ul>
                  </div>
                  <div className="space-y-1.5">
                    <p className="font-medium text-foreground text-xs uppercase tracking-wide">Crisis & Referral</p>
                    <ul className="list-disc list-inside space-y-0.5 ml-1 text-muted-foreground">
                      <li>First Aid crisis protocols</li>
                      <li>Emergency checklists</li>
                      <li>CHW → clinician upward referral</li>
                      <li>Appointment scheduling & SMS</li>
                    </ul>
                  </div>
                  <div className="space-y-1.5">
                    <p className="font-medium text-foreground text-xs uppercase tracking-wide">Role-Based Access</p>
                    <ul className="list-disc list-inside space-y-0.5 ml-1 text-muted-foreground">
                      <li>Graduated CHW / Clinician views</li>
                      <li>CHW exclusion from diagnostics</li>
                      <li>Upward referral workflows</li>
                      <li>Full audit trail (FHIR AuditEvent)</li>
                    </ul>
                  </div>
                  <div className="space-y-1.5">
                    <p className="font-medium text-foreground text-xs uppercase tracking-wide">Cultural & Language</p>
                    <ul className="list-disc list-inside space-y-0.5 ml-1 text-muted-foreground">
                      <li>Shona, Ndebele, Zulu, Xhosa, Sotho</li>
                      <li>Afrikaans, Swahili</li>
                      <li>French (DRC), Portuguese (Moz/Angola)</li>
                      <li>Flags culturally specific expressions of distress for the clinician to interpret</li>
                      <li>Code-switching support</li>
                    </ul>
                  </div>
                </div>
              </div>

              <PrototypeLimits />

              <div>
                <p className="font-semibold text-foreground mb-1">Expressions of distress library</p>
                <p className="text-muted-foreground">{IDIOM_LIBRARY_NOTE}</p>
              </div>

              <div>
                <p className="font-semibold text-foreground mb-1">Patient Pre-Registration</p>
                <p className="text-muted-foreground">
                  Patients can complete published screening questionnaires, provide demographic and cultural 
                  context, and grant digital consent from home before their clinical encounter. Clinicians 
                  receive an AI-drafted intake brief for review. Its usefulness has not yet been evaluated.
                </p>
              </div>

              <div>
                <p className="font-semibold text-foreground mb-1">Community Health Worker Model</p>
                <p className="text-muted-foreground">
                  CHWs operate in a restricted "exclusion zone" — they can record narratives, administer 
                  PHQ-9 screening, and refer patients upward to named clinicians. Diagnostic formulation, 
                  treatment planning, crisis protocols, and AI tools are gated to qualified clinicians only.
                </p>
              </div>

              <div>
                <p className="font-semibold text-foreground mb-1">Clinical Governance</p>
                <p className="text-muted-foreground">
                  All AI-generated content follows the principle "AI suggests, clinician decides." 
                  Clinicians maintain editorial control with full audit trails. FHIR R4 compliant 
                  data architecture ensures interoperability. No PII is stored. No medication dosages 
                  are prescribed. Confidence indicators are model-reported and not yet evaluated.
                </p>
              </div>

              <div>
                <p className="font-semibold text-foreground mb-1">Standards & Compliance</p>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {["FHIR R4", "ICD-11", "DSM-5", "WHO mhGAP", "POPIA", "LOINC", "SaMD-aware"].map(tag => (
                    <Badge key={tag} variant="outline" className="text-xs font-normal">{tag}</Badge>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t">
                <p className="text-xs text-muted-foreground italic">
                  <strong>Important:</strong> This is a documentation-support prototype using synthetic data
                  only. It is not for clinical use. All AI-generated content is a draft for clinician review.
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  © {new Date().getFullYear()} StratedgeAI · Developed by Walter Chikwanha
                </p>
              </div>
            </div>
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
};
