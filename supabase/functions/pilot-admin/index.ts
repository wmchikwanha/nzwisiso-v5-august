import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const DEMO_PREFIX = "DEMO-";

interface DemoClient {
  ref: string;
  gender: string;
  language: string;
  dob: string;
  narrative: string;
  phq9: number[];
  severity: string;
  note: string;
}

/** Twelve synthetic clients. No real identifiers of any kind. */
const DEMO_CLIENTS: DemoClient[] = [
  {
    ref: "DEMO-001", gender: "female", language: "sn", dob: "1991-04-12",
    narrative: "Ndinorara zvakanaka asi ndichimuka ndakaneta. Work is fine, no big worries. Handina kufunga zvekuzvikuvadza.",
    phq9: [1, 0, 1, 1, 0, 0, 0, 0, 0], severity: "minimal",
    note: "Routine screen. Mild sleep complaint only.",
  },
  {
    ref: "DEMO-002", gender: "male", language: "sn", dob: "1986-09-30",
    narrative: "Ndine kufunganya kwakawanda since ndakarasikirwa nebasa. Kutya kwakawanda, my chest feels tight. Kurara kwakaoma.",
    phq9: [1, 1, 2, 1, 1, 1, 1, 0, 0], severity: "mild",
    note: "Job loss six weeks ago. Somatic anxiety presentation.",
  },
  {
    ref: "DEMO-003", gender: "female", language: "nd", dob: "1978-01-22",
    narrative: "Ngicabanga kakhulu ebusuku. Inhliziyo yami ibuhlungu. I cry for no reason, ngikhathele nsuku zonke.",
    phq9: [2, 2, 2, 2, 1, 1, 1, 0, 0], severity: "moderate",
    note: "Kufungisisa presentation. Referred for follow-up session.",
  },
  {
    ref: "DEMO-004", gender: "male", language: "en", dob: "1999-06-05",
    narrative: "I can't concentrate at college. Everything feels flat. Sometimes I think people would be better off without me, but I would not act on it.",
    phq9: [2, 3, 2, 3, 1, 3, 2, 1, 1], severity: "moderately-severe",
    note: "Item 9 endorsed at 1. Safety plan discussed. Escalated to clinician.",
  },
  {
    ref: "DEMO-005", gender: "female", language: "sn", dob: "1965-11-14",
    narrative: "Kusuwa kwakanyanya kubvira murume wangu afa. Handichadi kudya. Ndinongogara ndakanyarara mumba.",
    phq9: [3, 3, 3, 3, 2, 2, 2, 1, 0], severity: "severe",
    note: "Bereavement eight months ago. Persistent low mood and appetite loss.",
  },
  {
    ref: "DEMO-006", gender: "male", language: "nd", dob: "1994-03-08",
    narrative: "Ngiphuza kakhulu utshwala ngempelasonto. Abangane bathi ngiyaguqa. Ngizizwa ngilahlekelwe.",
    phq9: [1, 2, 1, 2, 1, 2, 1, 0, 0], severity: "mild",
    note: "Hazardous alcohol use flagged. Brief intervention delivered.",
  },
  {
    ref: "DEMO-007", gender: "female", language: "sn", dob: "2003-07-19",
    narrative: "Murume wangu anondirova pandinotaura. I am scared to go home. Ndinotya kuti vana vangu vanoona zvese.",
    phq9: [2, 2, 3, 2, 2, 2, 2, 0, 0], severity: "moderately-severe",
    note: "SAFEGUARDING: intimate partner violence disclosed. Emergency pathway initiated.",
  },
  {
    ref: "DEMO-008", gender: "male", language: "en", dob: "1972-12-02",
    narrative: "I hear voices telling me the neighbours are watching. I have not slept properly for four nights.",
    phq9: [2, 1, 3, 2, 1, 2, 3, 2, 0], severity: "moderately-severe",
    note: "Possible psychotic features. Upward referral to psychiatrist.",
  },
  {
    ref: "DEMO-009", gender: "female", language: "sn", dob: "1989-02-27",
    narrative: "Ndakasununguka mwedzi mitatu yapfuura. Handinzwe rudo kumwana wangu, uye ndinochema mangwanani ese.",
    phq9: [2, 3, 2, 2, 2, 3, 1, 0, 0], severity: "moderately-severe",
    note: "Postnatal presentation. Weekly follow-up arranged.",
  },
  {
    ref: "DEMO-010", gender: "male", language: "nd", dob: "1958-08-16",
    narrative: "Ngikhohlwa amagama abantu. Ngilahleka endleleni eya emakethe. Umndeni uyakhathazeka.",
    phq9: [1, 1, 2, 2, 1, 1, 2, 0, 0], severity: "mild",
    note: "Cognitive concerns raised by family. Screener licence pending.",
  },
  {
    ref: "DEMO-011", gender: "female", language: "en", dob: "1997-05-23",
    narrative: "Since the accident I get flashbacks and I cannot travel in a kombi. I am always on edge.",
    phq9: [2, 2, 3, 2, 1, 1, 2, 1, 0], severity: "moderate",
    note: "Trauma symptoms. PCL-5 indicated at next session.",
  },
  {
    ref: "DEMO-012", gender: "male", language: "sn", dob: "1983-10-11",
    narrative: "Handisisina tariro. Ndakatoronga kuti ndichaita sei kuzviuraya vhiki rino. Hapana chakanaka chasara.",
    phq9: [3, 3, 3, 3, 3, 3, 3, 3, 3], severity: "severe",
    note: "CRISIS: active suicidality with plan. Emergency referral required.",
  },
];

const phqTotal = (r: number[]) => r.reduce((a, b) => a + b, 0);

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(supabaseUrl, serviceKey);

  try {
    // --- Verify caller is a signed-in admin ---
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace("Bearer ", "");
    if (!token) {
      return new Response(JSON.stringify({ error: "Not signed in" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: userData, error: userErr } = await admin.auth.getUser(token);
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "Invalid session" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const actorId = userData.user.id;

    const { data: isAdmin } = await admin.rpc("has_role", {
      _user_id: actorId, _role: "admin",
    });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const action = body?.action as string;

    const audit = async (act: string, outcome: string, description: string, metadata: unknown = {}) => {
      await admin.from("audit_events").insert({
        actor_id: actorId,
        actor_role: "admin",
        action: act,
        outcome,
        resource_type: "PilotConfig",
        description,
        metadata,
        source: "pilot-admin",
      });
    };

    const deleteDemoData = async () => {
      const { data: demoPatients } = await admin
        .from("patients")
        .select("id")
        .like("patient_identifier", `${DEMO_PREFIX}%`);

      const ids = (demoPatients ?? []).map((p: { id: string }) => p.id);
      if (!ids.length) return 0;

      // Children first (transcript chunks hang off sessions)
      const { data: sessions } = await admin
        .from("chw_sessions").select("id").in("patient_id", ids);
      const sessionIds = (sessions ?? []).map((s: { id: string }) => s.id);
      if (sessionIds.length) {
        await admin.from("chw_session_transcript_chunks").delete().in("session_id", sessionIds);
      }

      for (const table of [
        "screening_assessments", "assessments", "treatment_notes",
        "diagnostic_formulations", "crisis_interventions", "referrals",
        "appointments", "audio_recordings", "consents", "fhir_resources",
        "chw_sessions",
      ]) {
        await admin.from(table).delete().in("patient_id", ids);
      }

      await admin.from("patients").delete().in("id", ids);
      return ids.length;
    };

    const seedDemoData = async () => {
      let created = 0;
      for (const c of DEMO_CLIENTS) {
        const { data: patient, error: pErr } = await admin
          .from("patients")
          .insert({
            user_id: actorId,
            patient_identifier: c.ref,
            date_of_birth: c.dob,
            gender: c.gender,
            language_preference: c.language,
            cultural_background: "Zimbabwean",
            contact_notes: "Synthetic pilot record. No real contact details.",
            metadata: { demo: true, seeded_at: new Date().toISOString() },
            synthetic: true,
          })
          .select("id")
          .single();

        if (pErr || !patient) {
          console.error("Seed patient failed", c.ref, pErr);
          continue;
        }

        const total = phqTotal(c.phq9);

        await admin.from("chw_sessions").insert({
          chw_id: actorId,
          created_by: actorId,
          patient_id: patient.id,
          status: "completed",
          narrative_text: c.narrative,
          transcript_language: c.language,
          phq9_score: total,
          phq9_severity: c.severity,
          phq9_item9_flag: c.phq9[8] >= 1,
          notes: c.note,
          started_at: new Date(Date.now() - 86400000).toISOString(),
          ended_at: new Date(Date.now() - 86000000).toISOString(),
          synthetic: true,
        });

        await admin.from("screening_assessments").insert({
          patient_id: patient.id,
          user_id: actorId,
          created_by: actorId,
          tool_type: "PHQ9",
          responses: c.phq9.reduce(
            (acc: Record<string, number>, v, i) => ({ ...acc, [`q${i + 1}`]: v }),
            {}
          ),
          total_score: total,
          severity_level: c.severity,
          interpretation: c.note,
          administered_at: new Date(Date.now() - 86000000).toISOString(),
          synthetic: true,
        });

        created++;
      }
      return created;
    };

    if (action === "seed_demo_data") {
      const created = await seedDemoData();
      await audit("pilot_demo_seed", "success", `Seeded ${created} synthetic demo clients`, { created });
      return new Response(JSON.stringify({ success: true, created }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "reset_demo_data") {
      const removed = await deleteDemoData();
      const created = await seedDemoData();
      await audit(
        "pilot_demo_reset", "success",
        `Reset demo data: removed ${removed}, reseeded ${created}`,
        { removed, created }
      );
      return new Response(JSON.stringify({ success: true, removed, created }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "update_config") {
      const patch: Record<string, unknown> = {};
      if (typeof body.pilot_mode === "boolean") patch.pilot_mode = body.pilot_mode;
      if (typeof body.allow_real_data === "boolean") patch.allow_real_data = body.allow_real_data;
      if (typeof body.pilot_version === "string") patch.pilot_version = body.pilot_version.slice(0, 60);
      if (typeof body.pilot_end_date === "string" || body.pilot_end_date === null) {
        patch.pilot_end_date = body.pilot_end_date || null;
      }
      if (!Object.keys(patch).length) {
        return new Response(JSON.stringify({ error: "Nothing to update" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: row } = await admin.from("pilot_config").select("id").limit(1).maybeSingle();
      if (!row) throw new Error("Pilot config row missing");

      const { error: upErr } = await admin.from("pilot_config").update(patch).eq("id", row.id);
      if (upErr) throw upErr;

      await audit("pilot_config_update", "success", "Pilot configuration changed", patch);
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("pilot-admin error", error);
    const message = error instanceof Error ? error.message : "Unexpected error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
