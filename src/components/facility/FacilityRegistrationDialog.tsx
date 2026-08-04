import { useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, Loader2 } from "lucide-react";

const FACILITY_TYPES = [
  { value: "clinic", label: "Clinic / Counselling Centre" },
  { value: "hospital", label: "Hospital" },
  { value: "psychiatric_unit", label: "Psychiatric Unit" },
  { value: "emergency_centre", label: "Emergency Centre" },
  { value: "private_practice", label: "Private Practice" },
  { value: "ngo", label: "NGO / Community Organisation" },
];

/** Maps a facility type onto the CHW referral directory target types. */
const TARGET_TYPE: Record<string, "nurse" | "psychiatrist" | "emergency_centre" | "clinic"> = {
  clinic: "clinic",
  hospital: "clinic",
  psychiatric_unit: "psychiatrist",
  emergency_centre: "emergency_centre",
  private_practice: "psychiatrist",
  ngo: "clinic",
};

interface Props {
  /** "admin" creates a live listing immediately; "self" submits for admin activation. */
  mode: "admin" | "self";
  trigger?: ReactNode;
  onSaved?: () => void;
}

export function FacilityRegistrationDialog({ mode, trigger, onSaved }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const [name, setName] = useState("");
  const [type, setType] = useState("clinic");
  const [region, setRegion] = useState("");
  const [city, setCity] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [services, setServices] = useState("");
  const [emergency, setEmergency] = useState(false);
  const [listInChwDirectory, setListInChwDirectory] = useState(true);

  const reset = () => {
    setName(""); setType("clinic"); setRegion(""); setCity("");
    setPhone(""); setEmail(""); setWebsite(""); setServices("");
    setEmergency(false); setListInChwDirectory(true);
  };

  const submit = async () => {
    if (!user) return;
    if (!name.trim() || !region.trim()) {
      toast({ title: "Missing details", description: "Facility name and region are required.", variant: "destructive" });
      return;
    }
    setBusy(true);
    const isAdmin = mode === "admin";

    const { error } = await supabase.from("facilities").insert({
      facility_name: name.trim(),
      facility_type: type,
      region: region.trim(),
      city: city.trim() || null,
      contact_phone: phone.trim() || null,
      contact_email: email.trim() || null,
      website: website.trim() || null,
      services_offered: services.split(",").map((s) => s.trim()).filter(Boolean),
      emergency_capable: emergency,
      accepts_referrals: true,
      is_active: isAdmin,
      created_by: user.id,
    });

    if (error) {
      setBusy(false);
      toast({ title: "Could not save facility", description: error.message, variant: "destructive" });
      return;
    }

    if (isAdmin && listInChwDirectory) {
      await supabase.from("referral_targets").insert({
        name: name.trim(),
        target_type: TARGET_TYPE[type] ?? "clinic",
        contact_phone: phone.trim() || null,
        contact_email: email.trim() || null,
        address: [city.trim(), region.trim()].filter(Boolean).join(", ") || null,
        notes: services.trim() || null,
        is_active: true,
      });
    }

    await supabase.from("audit_events").insert({
      actor_id: user.id,
      actor_role: isAdmin ? "admin" : "clinician",
      action: isAdmin ? "facility_created_by_admin" : "facility_registration_submitted",
      resource_type: "facility",
      description: `${name.trim()} (${type})`,
    });

    setBusy(false);
    setOpen(false);
    reset();
    toast({
      title: isAdmin ? "Facility listed" : "Facility submitted",
      description: isAdmin
        ? "It is live and available for referrals."
        : "An administrator will activate your listing shortly.",
    });
    onSaved?.();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="outline">
            <Building2 className="h-4 w-4 mr-2" /> Register facility
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{mode === "admin" ? "Add a facility directly" : "Register your facility"}</DialogTitle>
          <DialogDescription>
            {mode === "admin"
              ? "Creates a live listing immediately — no application needed."
              : "List your practice or facility so community health workers and self-referring patients can reach you."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="fac-name">Facility / practice name *</Label>
            <Input id="fac-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Parirenyatwa Annexe Psychiatric Unit" />
          </div>
          <div className="space-y-2">
            <Label>Type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {FACILITY_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="fac-region">Region / province *</Label>
              <Input id="fac-region" value={region} onChange={(e) => setRegion(e.target.value)} placeholder="Harare" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fac-city">City / town</Label>
              <Input id="fac-city" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Harare" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="fac-phone">Contact phone</Label>
              <Input id="fac-phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+263 …" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fac-email">Contact email</Label>
              <Input id="fac-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="fac-web">Website</Label>
            <Input id="fac-web" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="fac-services">Services offered (comma separated)</Label>
            <Textarea id="fac-services" rows={2} value={services} onChange={(e) => setServices(e.target.value)} placeholder="Psychiatry, counselling, crisis care" />
          </div>
          <div className="flex items-center justify-between rounded-md border p-3">
            <div>
              <Label className="text-sm">Emergency capable</Label>
              <p className="text-xs text-muted-foreground">Can accept immediate crisis referrals</p>
            </div>
            <Switch checked={emergency} onCheckedChange={setEmergency} />
          </div>
          {mode === "admin" && (
            <div className="flex items-center justify-between rounded-md border p-3">
              <div>
                <Label className="text-sm">Also list in CHW referral directory</Label>
                <p className="text-xs text-muted-foreground">Appears in the community health worker referral picker</p>
              </div>
              <Switch checked={listInChwDirectory} onCheckedChange={setListInChwDirectory} />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={busy}>Cancel</Button>
          <Button onClick={submit} disabled={busy}>
            {busy && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {mode === "admin" ? "Create listing" : "Submit registration"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
