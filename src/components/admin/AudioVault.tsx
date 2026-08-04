import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { canAccessRetainedAudio } from "@/lib/permissions";
import { getAudioAccessUrl } from "@/lib/audio/retention";
import { Lock, Play, Loader2 } from "lucide-react";

interface RecordingRow {
  id: string;
  patient_id: string;
  chw_session_id: string | null;
  storage_path: string;
  mime_type: string;
  size_bytes: number;
  duration_seconds: number | null;
  language_code: string | null;
  uploader_role: string;
  retention_until: string;
  created_at: string;
}

export function AudioVault() {
  const { userRole } = useAuth();
  const { toast } = useToast();
  const [rows, setRows] = useState<RecordingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [playing, setPlaying] = useState<string | null>(null);
  const [url, setUrl] = useState<string | null>(null);

  const allowed = canAccessRetainedAudio(userRole);

  useEffect(() => {
    if (!allowed) {
      setLoading(false);
      return;
    }
    (async () => {
      const { data, error } = await supabase
        .from("audio_recordings")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) {
        toast({ title: "Could not load recordings", description: error.message, variant: "destructive" });
      }
      setRows((data as RecordingRow[]) || []);
      setLoading(false);
    })();
  }, [allowed]);

  const handlePlay = async (r: RecordingRow) => {
    setPlaying(r.id);
    setUrl(null);
    try {
      const signed = await getAudioAccessUrl(r.id, r.storage_path, r.patient_id, userRole || "unknown");
      setUrl(signed);
    } catch (e: any) {
      toast({ title: "Access denied", description: e?.message || "Unable to open recording", variant: "destructive" });
      setPlaying(null);
    }
  };

  if (!allowed) {
    return (
      <Alert>
        <Lock className="h-4 w-4" />
        <AlertDescription>
          Retained audio is restricted to the Principal Investigator and Safety Monitor. Every
          playback is written to the immutable audit trail.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Lock className="h-4 w-4" /> Restricted Audio Register
        </CardTitle>
        <CardDescription>
          Recordings are held in a private, encrypted store. Playback issues a 5-minute signed link
          and logs an access event against your account. Recordings cannot be deleted from here —
          removal is retention-driven only.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          <div className="py-8 text-center text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin inline mr-2" /> Loading…
          </div>
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">
            No retained recordings yet. Audio retention is off by default and requires recording
            consent plus an explicit per-session opt-in.
          </p>
        ) : (
          rows.map((r) => (
            <div key={r.id} className="flex items-center justify-between gap-3 rounded-md border p-3">
              <div className="min-w-0 text-sm">
                <div className="font-medium truncate">{r.storage_path.split("/").pop()}</div>
                <div className="text-xs text-muted-foreground">
                  {new Date(r.created_at).toLocaleString()} · {(r.size_bytes / 1024).toFixed(0)} KB ·{" "}
                  {r.language_code || "unspecified"} · uploaded by {r.uploader_role}
                </div>
                <div className="text-xs text-muted-foreground">
                  Retention until {new Date(r.retention_until).toLocaleDateString()}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Badge variant="secondary">{r.mime_type}</Badge>
                <Button size="sm" variant="outline" onClick={() => handlePlay(r)}>
                  <Play className="h-4 w-4 mr-1" /> Open
                </Button>
              </div>
            </div>
          ))
        )}

        {playing && url && (
          <div className="rounded-md border p-3">
            <p className="text-xs text-muted-foreground mb-2">
              Signed link expires in 5 minutes. This access has been audited.
            </p>
            <audio controls autoPlay src={url} className="w-full" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
