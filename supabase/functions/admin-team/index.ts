// Admin team management edge function. Validates the caller is an admin
// (via JWT lookup against user_roles) and uses the service role for
// privileged actions (invite, set role, suspend/reactivate, delete).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

async function requireAdmin(req: Request) {
  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.replace(/^Bearer\s+/i, "");
  if (!token) return { error: "Missing auth token", status: 401 };
  const { data: userData, error: userErr } = await admin.auth.getUser(token);
  if (userErr || !userData.user) return { error: "Invalid token", status: 401 };
  const { data: role } = await admin
    .from("user_roles")
    .select("role")
    .eq("user_id", userData.user.id)
    .eq("role", "admin")
    .maybeSingle();
  if (!role) return { error: "Admin only", status: 403 };
  return { user: userData.user };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const gate = await requireAdmin(req);
    if ("error" in gate) return json({ error: gate.error }, gate.status);

    const { action, payload } = await req.json();

    switch (action) {
      case "list": {
        const { data: profiles, error: pErr } = await admin
          .from("profiles")
          .select("id, full_name, email, status, created_at")
          .order("created_at", { ascending: false });
        if (pErr) throw pErr;
        const { data: roles } = await admin
          .from("user_roles")
          .select("user_id, role");
        const byUser: Record<string, string[]> = {};
        (roles ?? []).forEach((r: any) => {
          (byUser[r.user_id] ||= []).push(r.role);
        });
        return json({
          members: (profiles ?? []).map((p: any) => ({
            ...p,
            roles: byUser[p.id] ?? [],
          })),
        });
      }

      case "invite": {
        const { email, role } = payload ?? {};
        if (!email) return json({ error: "Email required" }, 400);
        const redirectTo = req.headers.get("origin")
          ? `${req.headers.get("origin")}/auth`
          : undefined;
        const { data, error } = await admin.auth.admin.inviteUserByEmail(
          email,
          {
            redirectTo,
            data: { intended_role: role ?? "psychiatrist" },
          },
        );
        if (error) return json({ error: error.message }, 400);
        return json({ ok: true, user_id: data.user?.id });
      }

      case "set_role": {
        const { user_id, role } = payload ?? {};
        if (!user_id || !role) return json({ error: "user_id + role required" }, 400);
        // Replace all role rows with the chosen role
        await admin.from("user_roles").delete().eq("user_id", user_id);
        const { error } = await admin
          .from("user_roles")
          .insert({ user_id, role });
        if (error) return json({ error: error.message }, 400);
        return json({ ok: true });
      }

      case "set_status": {
        const { user_id, status } = payload ?? {};
        if (!user_id || !["active", "pending", "revoked"].includes(status))
          return json({ error: "Invalid status" }, 400);
        const { error } = await admin
          .from("profiles")
          .update({ status })
          .eq("id", user_id);
        if (error) return json({ error: error.message }, 400);
        // If revoked, also sign out / ban the user via auth admin
        if (status === "revoked") {
          await admin.auth.admin.updateUserById(user_id, {
            ban_duration: "876000h", // ~100 years
          });
        } else {
          await admin.auth.admin.updateUserById(user_id, {
            ban_duration: "none",
          });
        }
        return json({ ok: true });
      }

      case "delete": {
        const { user_id } = payload ?? {};
        if (!user_id) return json({ error: "user_id required" }, 400);
        const { error } = await admin.auth.admin.deleteUser(user_id);
        if (error) return json({ error: error.message }, 400);
        return json({ ok: true });
      }

      case "activity": {
        const { data, error } = await admin
          .from("audit_events")
          .select("id, actor_id, actor_role, action, resource_type, resource_id, outcome, recorded_at, description")
          .order("recorded_at", { ascending: false })
          .limit(200);
        if (error) throw error;
        return json({ events: data ?? [] });
      }

      default:
        return json({ error: "Unknown action" }, 400);
    }
  } catch (e) {
    console.error("admin-team error", e);
    return json({ error: (e as Error).message }, 500);
  }
});
