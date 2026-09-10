import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { scoreSSQ14 } from "@/lib/screening/scoringUtils";
import { SSQ14_ITEMS } from "@/lib/clinical/rulesEngine";
import { getRulesVersionId } from "@/lib/clinical/rulesVersion";
import { persistScreeningFhir } from "@/lib/fhir/persist";
import { Loader2, AlertTriangle } from "lucide-react";

interface SSQ14FormProps {
  patientId: string;
  onComplete: () => void;
}

const OPTIONS = [
  { value: "0", label: "No / Kwete" },
  { value: "1", label: "Yes / Hongu" },
];

export const SSQ14Form = ({ patientId, onComplete }: SSQ14FormProps) => {
  const [responses, setResponses] = useState<Record<number, number>>({});
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const isComplete = Object.keys(responses).length === SSQ14_ITEMS.length;
  const suicidalityEndorsed = responses[1] >= 1;

  // Live, client-side deterministic scoring — no server round-trip.
  const answered = SSQ14_ITEMS.map((_, i) => responses[i] ?? 0);
  const live = scoreSSQ14(answered);

  const handleSubmit = async () => {
    if (!isComplete) {
      toast({
        title: "Incomplete Assessment",
        description: "Please answer all 14 questions before submitting.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const responseArray = SSQ14_ITEMS.map((_, i) => responses[i]);
      const result = scoreSSQ14(responseArray);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: saved, error } = await supabase
        .from("screening_assessments")
        .insert({
          patient_id: patientId,
          user_id: user.id,
          tool_type: "SSQ14",
          responses: responseArray,
          total_score: result.totalScore,
          severity_level: result.severityLevel,
          interpretation: result.interpretation,
          notes: notes || null,
          rules_version_id: await getRulesVersionId(),
        })
        .select("*")
        .single();

      if (error) throw error;
      if (saved) await persistScreeningFhir(saved as any);

      toast({
        title: "SSQ-14 Saved",
        description: `Total Score: ${result.totalScore}/14 (${result.severityLevel})`,
        variant: result.alerts ? "destructive" : "default",
      });
      onComplete();
    } catch (error) {
      console.error("Error saving SSQ-14:", error);
      toast({
        title: "Error",
        description: "Failed to save assessment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle>SSQ-14: Shona Symptom Questionnaire</CardTitle>
            <CardDescription>
              In the past week, have you experienced any of the following? Locally validated
              Friendship Bench screener. Positive screen at a total of 8 or more.
            </CardDescription>
          </div>
          <Badge variant="outline" className="shrink-0">
            {live.totalScore}/14
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {suicidalityEndorsed && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="font-semibold">
              SUICIDALITY ALERT: Item 2 endorsed. Immediate safety assessment required and an
              emergency referral must be raised before the session is closed.
            </AlertDescription>
          </Alert>
        )}

        {isComplete && live.distressFlag && !suicidalityEndorsed && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Score {live.totalScore} is at or above the validated cut-point of 8 — screens
              positive for common mental disorder.
            </AlertDescription>
          </Alert>
        )}

        {SSQ14_ITEMS.map((item, index) => (
          <div key={index} className="space-y-3">
            <Label className="text-sm font-medium">
              {index + 1}. {item.en}
              <span className="block text-xs font-normal text-muted-foreground mt-0.5">
                {item.sn}
              </span>
            </Label>
            <RadioGroup
              value={responses[index]?.toString()}
              onValueChange={(value) =>
                setResponses((prev) => ({ ...prev, [index]: parseInt(value) }))
              }
            >
              <div className="grid grid-cols-2 gap-3">
                {OPTIONS.map((option) => (
                  <div key={option.value} className="flex items-center space-x-2">
                    <RadioGroupItem value={option.value} id={`ssq14-${index}-${option.value}`} />
                    <Label
                      htmlFor={`ssq14-${index}-${option.value}`}
                      className="text-sm cursor-pointer font-normal"
                    >
                      {option.label}
                    </Label>
                  </div>
                ))}
              </div>
            </RadioGroup>
          </div>
        ))}

        <div className="space-y-2 pt-4">
          <Label htmlFor="ssq14-notes">Clinical Notes (Optional)</Label>
          <Textarea
            id="ssq14-notes"
            placeholder="Additional observations or context..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
          />
        </div>

        <Button onClick={handleSubmit} disabled={!isComplete || isSubmitting} className="w-full">
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Assessment"
          )}
        </Button>
      </CardContent>
    </Card>
  );
};
