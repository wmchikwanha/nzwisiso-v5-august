import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Activity, CheckCircle2, Loader2, PlayCircle, Plus, Save, ShieldAlert, XCircle } from "lucide-react";

interface ModelVersion {
  id: string;
  provider: string;
  model_id: string;
  model_version_label: string;
  status: string;
  pinned_at: string;
  notes: string | null;
}

interface EvalRun {
  id: string;
  model_version_id: string;
  eval_suite_version: string;
  passed: boolean;
  score: Record<string, unknown> | null;
  test_date: string;
}

interface PromptTemplate {
  id: string;
  function_name: string;
  version: number;
  system_prompt: string;
  status: string;
  updated_at: string;
}

interface DriftMetric {
  id: string;
  function_name: string;
  period_start: string;
  period_end: string;
  avg_confidence: number | null;
  override_rate: number | null;
  total_invocations: number;
  flagged: boolean;
  flag_reason: string | null;
}

const statusTone: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  active: "default",
  candidate: "secondary",
  retired: "outline",
};

export const ModelRegistry = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const [models, setModels] = useState<ModelVersion[]>([]);
  const [runs, setRuns] = useState<EvalRun[]>([]);
  const [prompts, setPrompts] = useState<PromptTemplate[]>([]);
  const [preamble, setPreamble] = useState<{ id: string; version: number; preamble_text: string } | null>(null);
  const [drift, setDrift] = useState<DriftMetric[]>([]);
  const [caseCount, setCaseCount] = useState({ total: 0, adversarial: 0 });

  const [newProvider, setNewProvider] = useState("lovable-ai-gateway");
  const [newModelId, setNewModelId] = useState("");
  const [newLabel, setNewLabel] = useState("");

  const [selectedFunction, setSelectedFunction] = useState<string>("");
  const [promptDraft, setPromptDraft] = useState("");
  const [preambleDraft, setPreambleDraft] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const [m, r, p, pre, d, gc, ga] = await Promise.all([
      supabase.from("model_versions").select("*").order("pinned_at", { ascending: false }),
      supabase.from("eval_results").select("*").order("test_date", { ascending: false }).limit(10),
      supabase.from("prompt_templates").select("*").eq("status", "active").order("function_name"),
      supabase.from("ai_safety_preambles").select("id, version, preamble_text").eq("is_current", true).maybeSingle(),
      supabase.from("ai_drift_metrics").select("*").order("period_end", { ascending: false }).limit(12),
      supabase.from("golden_cases").select("id", { count: "exact", head: true }).eq("active", true),
      supabase.from("golden_cases").select("id", { count: "exact", head: true }).eq("active", true).eq("adversarial", true),
    ]);
    setModels((m.data as ModelVersion[]) ?? []);
    setRuns((r.data as EvalRun[]) ?? []);
    setPrompts((p.data as PromptTemplate[]) ?? []);
    setPreamble((pre.data as { id: string; version: number; preamble_text: string }) ?? null);
    setPreambleDraft(pre.data?.preamble_text ?? "");
    setDrift((d.data as DriftMetric[]) ?? []);
    setCaseCount({ total: gc.count ?? 0, adversarial: ga.count ?? 0 });
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const t = prompts.find((x) => x.function_name === selectedFunction);
    setPromptDraft(t?.system_prompt ?? "");
  }, [selectedFunction, prompts]);

  const call = async (payload: Record<string, unknown>, key: string, successMessage: string) => {
    setBusy(key);
    try {
      const { data, error } = await supabase.functions.invoke("model-lifecycle", { body: payload });
      if (error) throw error;
      if ((data as { error?: string })?.error) throw new Error((data as { error: string }).error);
      toast({ title: successMessage });
      await load();
      return data;
    } catch (e) {
      toast({
        title: "Action failed",
        description: e instanceof Error ? e.message : "Unexpected error",
        variant: "destructive",
      });
      return null;
    } finally {
      setBusy(null);
    }
  };

  const latestRunFor = (modelId: string) => runs.find((r) => r.model_version_id === modelId);

  if (loading) {
    return <div className="flex items-center gap-2 p-8 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading model registry…</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><ShieldAlert className="h-5 w-5" /> Model versions</CardTitle>
          <CardDescription>
            Exactly one version is live at a time. A version can only go live after it passes the safety
            regression suite ({caseCount.total} cases, {caseCount.adversarial} adversarial).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {models.map((m) => {
            const run = latestRunFor(m.id);
            return (
              <div key={m.id} className="flex flex-wrap items-center justify-between gap-3 rounded-md border p-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{m.model_version_label}</span>
                    <Badge variant={statusTone[m.status] ?? "outline"}>{m.status}</Badge>
                    {run && (
                      <Badge variant={run.passed ? "default" : "destructive"} className="gap-1">
                        {run.passed ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                        last run {run.passed ? "passed" : "failed"}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {m.provider} · {m.model_id} · pinned {format(new Date(m.pinned_at), "dd MMM yyyy, HH:mm")}
                  </p>
                  {m.notes && <p className="text-sm text-muted-foreground">{m.notes}</p>}
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm" variant="outline"
                    disabled={busy !== null}
                    onClick={() => call({ action: "run_eval", model_version_id: m.id }, `eval-${m.id}`, "Regression suite completed")}
                  >
                    {busy === `eval-${m.id}` ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlayCircle className="h-4 w-4" />}
                    <span className="ml-2">Run suite</span>
                  </Button>
                  {m.status !== "active" && (
                    <Button
                      size="sm" disabled={busy !== null}
                      onClick={() => call({ action: "promote_model", model_version_id: m.id }, `promote-${m.id}`, "Model promoted to live")}
                    >
                      Promote
                    </Button>
                  )}
                  {m.status === "candidate" && (
                    <Button
                      size="sm" variant="ghost" disabled={busy !== null}
                      onClick={() => call({ action: "retire_model", model_version_id: m.id }, `retire-${m.id}`, "Model retired")}
                    >
                      Retire
                    </Button>
                  )}
                </div>
              </div>
            );
          })}

          <div className="grid gap-3 rounded-md border border-dashed p-3 md:grid-cols-4">
            <div className="space-y-1">
              <Label htmlFor="mr-provider">Provider</Label>
              <Input id="mr-provider" value={newProvider} onChange={(e) => setNewProvider(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="mr-model">Model identifier</Label>
              <Input id="mr-model" placeholder="google/gemini-2.5-flash" value={newModelId} onChange={(e) => setNewModelId(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="mr-label">Version label</Label>
              <Input id="mr-label" placeholder="2026-10-pin-2" value={newLabel} onChange={(e) => setNewLabel(e.target.value)} />
            </div>
            <div className="flex items-end">
              <Button
                className="w-full"
                disabled={busy !== null || !newModelId || !newLabel}
                onClick={async () => {
                  const ok = await call(
                    { action: "register_model", provider: newProvider, model_id: newModelId, model_version_label: newLabel },
                    "register", "Candidate model registered",
                  );
                  if (ok) { setNewModelId(""); setNewLabel(""); }
                }}
              >
                <Plus className="mr-2 h-4 w-4" /> Register candidate
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Safety preamble</CardTitle>
          <CardDescription>
            Prepended to every clinical AI request. Saving creates a new version — earlier versions are kept for audit.
            {preamble && <span className="ml-1">Current version: {preamble.version}.</span>}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea rows={10} value={preambleDraft} onChange={(e) => setPreambleDraft(e.target.value)} />
          <Button
            disabled={busy !== null || !preambleDraft.trim() || preambleDraft === preamble?.preamble_text}
            onClick={() => call({ action: "update_preamble", preamble_text: preambleDraft }, "preamble", "Safety preamble version saved")}
          >
            {busy === "preamble" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save new version
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Prompt templates</CardTitle>
          <CardDescription>Task prompts are stored here, not in code. Saving publishes a new version.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Select value={selectedFunction} onValueChange={setSelectedFunction}>
            <SelectTrigger className="max-w-sm"><SelectValue placeholder="Choose a feature" /></SelectTrigger>
            <SelectContent>
              {prompts.map((p) => (
                <SelectItem key={p.id} value={p.function_name}>{p.function_name} (v{p.version})</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedFunction && (
            <>
              <Textarea rows={12} value={promptDraft} onChange={(e) => setPromptDraft(e.target.value)} />
              <Button
                disabled={busy !== null || !promptDraft.trim()}
                onClick={() => call({ action: "update_prompt", function_name: selectedFunction, system_prompt: promptDraft }, "prompt", "Prompt version saved")}
              >
                {busy === "prompt" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Save new version
              </Button>
            </>
          )}
          {!prompts.length && (
            <p className="text-sm text-muted-foreground">
              Prompts appear here the first time each AI feature runs.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent regression runs</CardTitle>
          <CardDescription>Suite results, including adversarial cases, retained as evidence.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {!runs.length && <p className="text-sm text-muted-foreground">No runs recorded yet.</p>}
          {runs.map((r) => {
            const score = (r.score ?? {}) as Record<string, number>;
            return (
              <div key={r.id} className="flex items-center justify-between rounded-md border p-3 text-sm">
                <div>
                  <span className="font-medium">{r.eval_suite_version}</span>
                  <span className="text-muted-foreground"> · {format(new Date(r.test_date), "dd MMM yyyy, HH:mm")}</span>
                  <div className="text-muted-foreground">
                    {score.passed_cases ?? 0}/{score.total_cases ?? 0} passed
                    {typeof score.adversarial_failures === "number" && score.adversarial_failures > 0
                      ? ` · ${score.adversarial_failures} adversarial failure(s)` : " · no adversarial failures"}
                  </div>
                </div>
                <Badge variant={r.passed ? "default" : "destructive"}>{r.passed ? "Passed" : "Failed"}</Badge>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Activity className="h-5 w-5" /> Drift monitoring</CardTitle>
          <CardDescription>
            Tracks clinician override rates and confidence over a trailing window. Run weekly.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            variant="outline" disabled={busy !== null}
            onClick={() => call({ action: "compute_drift", days: 7 }, "drift", "Drift check completed")}
          >
            {busy === "drift" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Activity className="mr-2 h-4 w-4" />}
            Run 7-day drift check
          </Button>
          {!drift.length && <p className="text-sm text-muted-foreground">No drift measurements recorded yet.</p>}
          {drift.map((d) => (
            <div key={d.id} className="flex items-center justify-between rounded-md border p-3 text-sm">
              <div>
                <span className="font-medium">{d.function_name}</span>
                <div className="text-muted-foreground">
                  {d.total_invocations} uses · override rate {((d.override_rate ?? 0) * 100).toFixed(0)}%
                  {d.avg_confidence !== null && ` · mean confidence ${(d.avg_confidence * 100).toFixed(0)}%`}
                </div>
                {d.flag_reason && <div className="text-destructive">{d.flag_reason}</div>}
              </div>
              <Badge variant={d.flagged ? "destructive" : "outline"}>{d.flagged ? "Flagged" : "Stable"}</Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};
