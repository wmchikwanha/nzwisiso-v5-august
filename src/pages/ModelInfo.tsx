import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Footer } from "@/components/Footer";
import { ArrowLeft, Info, Loader2 } from "lucide-react";
import { format } from "date-fns";

interface ModelCard {
  id: string;
  model_name: string;
  model_version: string;
  provider: string;
  capabilities: string[] | Record<string, unknown>;
  limitations: string[] | Record<string, unknown>;
  intended_use: string;
  out_of_scope_uses: string[] | Record<string, unknown>;
  performance_metrics: Record<string, unknown>;
  bias_assessment: Record<string, unknown> | string[];
  ethical_considerations: string | null;
  training_data_summary: string | null;
  last_updated: string;
}

const asList = (value: unknown): string[] => {
  if (Array.isArray(value)) return value.map((v) => (typeof v === "string" ? v : JSON.stringify(v)));
  if (value && typeof value === "object") {
    return Object.entries(value as Record<string, unknown>).map(
      ([k, v]) => `${k}: ${typeof v === "string" ? v : JSON.stringify(v)}`,
    );
  }
  return value ? [String(value)] : [];
};

const ModelInfo = () => {
  const [cards, setCards] = useState<ModelCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("ai_model_cards")
        .select("*")
        .order("last_updated", { ascending: false });
      setCards((data as unknown as ModelCard[]) ?? []);
      setLoading(false);
    })();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="border-b">
        <div className="container mx-auto flex items-center gap-3 px-6 py-4">
          <Button asChild variant="ghost" size="sm">
            <Link to="/"><ArrowLeft className="mr-2 h-4 w-4" /> Back</Link>
          </Button>
          <div>
            <h1 className="text-xl font-semibold">How the AI in Nzwisiso works</h1>
            <p className="text-sm text-muted-foreground">
              What the AI does, what it cannot do, and how its limits are managed.
            </p>
          </div>
        </div>
      </header>

      <main className="container mx-auto flex-1 space-y-6 px-6 py-8">
        <Card className="border-primary/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Info className="h-5 w-5" /> In plain terms</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              The AI reads what a health worker has written or dictated and turns it into structured notes and
              suggestions. It never makes a decision on its own.
            </p>
            <p>
              Screening scores, crisis pathways and severity levels are calculated by fixed rules, not by the AI.
              The AI is never allowed to change or invent a score.
            </p>
            <p>
              The AI never gives medication doses. Every suggestion it makes is labelled as needing clinician review,
              and nothing is final until a clinician approves it.
            </p>
          </CardContent>
        </Card>

        {loading && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading model information…
          </div>
        )}

        {!loading && !cards.length && (
          <p className="text-sm text-muted-foreground">No model information has been published yet.</p>
        )}

        {cards.map((card) => (
          <Card key={card.id}>
            <CardHeader>
              <CardTitle className="flex flex-wrap items-center gap-2">
                {card.model_name}
                <Badge variant="secondary">{card.model_version}</Badge>
                <Badge variant="outline">{card.provider}</Badge>
              </CardTitle>
              <CardDescription>
                Last updated {format(new Date(card.last_updated), "dd MMM yyyy, HH:mm")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5 text-sm">
              <section>
                <h2 className="font-medium">Intended use</h2>
                <p className="text-muted-foreground">{card.intended_use}</p>
              </section>

              {[
                ["What it can do", card.capabilities],
                ["Known limitations", card.limitations],
                ["Must not be used for", card.out_of_scope_uses],
                ["Fairness and bias review", card.bias_assessment],
                ["Validation measurements", card.performance_metrics],
              ].map(([heading, value]) => {
                const items = asList(value);
                if (!items.length) return null;
                return (
                  <section key={heading as string}>
                    <h2 className="font-medium">{heading as string}</h2>
                    <ul className="list-disc pl-5 text-muted-foreground">
                      {items.map((item) => <li key={item}>{item}</li>)}
                    </ul>
                  </section>
                );
              })}

              {card.training_data_summary && (
                <section>
                  <h2 className="font-medium">Where its knowledge comes from</h2>
                  <p className="text-muted-foreground">{card.training_data_summary}</p>
                </section>
              )}

              {card.ethical_considerations && (
                <section>
                  <h2 className="font-medium">Ethical considerations</h2>
                  <p className="text-muted-foreground">{card.ethical_considerations}</p>
                </section>
              )}
            </CardContent>
          </Card>
        ))}
      </main>

      <Footer />
    </div>
  );
};

export default ModelInfo;
