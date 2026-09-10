import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { usePilotConfig } from "@/hooks/usePilotConfig";
import { PILOT_BANNER_TEXT, PILOT_WATERMARK } from "@/lib/copy";
import { AlertTriangle, Loader2, RefreshCw, Save } from "lucide-react";

export const PilotPanel = () => {
  const { config, loading, refresh } = usePilotConfig();
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);
  const [pilotMode, setPilotMode] = useState(true);
  const [allowRealData, setAllowRealData] = useState(false);
  const [version, setVersion] = useState("");
  const [endDate, setEndDate] = useState("");
  const [demoCount, setDemoCount] = useState<number | null>(null);

  useEffect(() => {
    if (!config) return;
    setPilotMode(config.pilot_mode);
    setAllowRealData(config.allow_real_data);
    setVersion(config.pilot_version ?? "");
    setEndDate(config.pilot_end_date ?? "");
  }, [config]);

  const countDemo = async () => {
    const { count } = await supabase
      .from("patients")
      .select("id", { count: "exact", head: true })
      .like("patient_identifier", "DEMO-%");
    setDemoCount(count ?? 0);
  };

  useEffect(() => {
    countDemo();
  }, []);

  const call = async (body: Record<string, unknown>) => {
    const { data, error } = await supabase.functions.invoke("pilot-admin", { body });
    if (error) throw error;
    if ((data as any)?.error) throw new Error((data as any).error);
    return data as any;
  };

  const saveConfig = async () => {
    setBusy(true);
    try {
      await call({
        action: "update_config",
        pilot_mode: pilotMode,
        allow_real_data: allowRealData,
        pilot_version: version,
        pilot_end_date: endDate || null,
      });
      await refresh();
      toast({ title: "Pilot settings saved" });
    } catch (e: any) {
      toast({ title: "Could not save", description: e.message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const resetDemo = async () => {
    if (!confirm("Remove all DEMO-nnn records and recreate the 12 demo clients? Your own test records are not affected.")) return;
    setBusy(true);
    try {
      const res = await call({ action: "reset_demo_data" });
      await countDemo();
      toast({
        title: "Demo data reset",
        description: `Removed ${res.removed}, created ${res.created} demo clients.`,
      });
    } catch (e: any) {
      toast({ title: "Reset failed", description: e.message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const seedDemo = async () => {
    setBusy(true);
    try {
      const res = await call({ action: "seed_demo_data" });
      await countDemo();
      toast({ title: "Demo clients created", description: `${res.created} added.` });
    } catch (e: any) {
      toast({ title: "Seeding failed", description: e.message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            Pilot mode
          </CardTitle>
          <CardDescription>
            While pilot mode is on, every new record is marked as synthetic, appointment
            reminders are held back and logged, and all exports carry the pilot watermark.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <div>
              <Label htmlFor="pilot-mode" className="text-sm font-medium">Pilot mode active</Label>
              <p className="text-xs text-muted-foreground">Shows the banner: “{PILOT_BANNER_TEXT}”</p>
            </div>
            <Switch id="pilot-mode" checked={pilotMode} onCheckedChange={setPilotMode} />
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <div>
              <Label htmlFor="allow-real" className="text-sm font-medium">Allow real client data</Label>
              <p className="text-xs text-muted-foreground">
                Keep this off. The pilot environment is for synthetic data only.
              </p>
            </div>
            <Switch id="allow-real" checked={allowRealData} onCheckedChange={setAllowRealData} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="pilot-version">Pilot version</Label>
              <Input id="pilot-version" value={version} onChange={(e) => setVersion(e.target.value)} placeholder="v1.0-pilot" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pilot-end">Pilot end date</Label>
              <Input id="pilot-end" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>

          <div className="rounded-md bg-muted p-3 text-xs text-muted-foreground">
            Export watermark: <span className="font-medium text-foreground">{PILOT_WATERMARK}</span>
          </div>

          <Button onClick={saveConfig} disabled={busy}>
            {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save settings
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Demo clients</CardTitle>
          <CardDescription>
            Twelve synthetic clients, DEMO-001 to DEMO-012, spanning the PHQ-9 severity range
            and including one suicidality case and one safeguarding case. Resetting only touches
            records whose reference starts with DEMO- — your own test records are never removed.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Currently in the database:</span>
            <Badge variant={demoCount === 12 ? "default" : "secondary"}>
              {demoCount === null ? "…" : `${demoCount} demo client(s)`}
            </Badge>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={resetDemo} disabled={busy}>
              <RefreshCw className="mr-2 h-4 w-4" /> Reset demo data
            </Button>
            <Button variant="ghost" onClick={seedDemo} disabled={busy}>
              Add demo clients without removing
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
