import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function CHWReferralsList() {
  const { user } = useAuth();
  const [rows, setRows] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("referrals")
        .select("*")
        .eq("recorded_by", user.id)
        .order("created_at", { ascending: false });
      setRows(data || []);
    })();
  }, [user]);

  if (!rows.length) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          No referrals yet.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {rows.map((r) => (
        <Card key={r.id}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex justify-between">
              <span>{r.specialist_type || r.referral_type}</span>
              <div className="flex gap-2">
                <Badge variant={r.urgency === "emergency" ? "destructive" : "secondary"}>
                  {r.urgency}
                </Badge>
                <Badge variant="outline">{r.status}</Badge>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-1">
            <div className="text-muted-foreground">
              {new Date(r.created_at).toLocaleString()}
            </div>
            {r.destination && <div>To: {r.destination}</div>}
            {r.reason && <div className="italic">{r.reason}</div>}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
