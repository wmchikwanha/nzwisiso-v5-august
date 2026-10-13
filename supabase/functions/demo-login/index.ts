// Sandbox one-click login: ensures a demo account exists for the chosen role
// and returns its credentials. Demo data is synthetic-only (pilot mode).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const DEMO: Record<string, { email: string; name: string; role: string }> = {
  admin: { email: "demo.admin@nzwisiso.test", name: "Demo Administrator", role: "admin" },
  clinician: { email: "demo.clinician@nzwisiso.test", name: "Dr Demo Clinician", role: "psychiatrist" },
  nurse: { email: "demo.nurse@nzwisiso.test", name: "Demo MH Nurse", role: "mh_nurse" },
  chw: { email: "demo.chw@nzwisiso.test", name: "Demo Community Health Worker", role: "chw" },
};
const PASSWORD = "Nzwisiso-Sandbox-2026!";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  try {
    const { persona } = await req.json();
    const d = DEMO[persona];
    if (!d) throw new Error("Unknown persona");
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const { data: prof } = await admin.from("profiles").select("id").eq("email", d.email).maybeSingle();
    let id = prof?.id as string | undefined;
    if (!id) {
      const { data, error } = await admin.auth.admin.createUser({
        email: d.email, password: PASSWORD, email_confirm: true,
        user_metadata: { full_name: d.name, intended_role: d.role === "admin" ? "psychiatrist" : d.role },
      });
      if (error) throw error;
      id = data.user!.id;
    } else {
      await admin.auth.admin.updateUserById(id, { password: PASSWORD });
    }
    await admin.from("user_roles").upsert({ user_id: id, role: d.role }, { onConflict: "user_id,role" });
    await admin.from("profiles").update({ status: "active" }).eq("id", id);

    return new Response(JSON.stringify({ email: d.email, password: PASSWORD }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String((e as Error).message ?? e) }), {
      status: 400, headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
