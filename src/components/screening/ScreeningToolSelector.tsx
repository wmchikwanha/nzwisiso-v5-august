import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, Heart, Shield, Lock, Eye, Activity, Sprout } from "lucide-react";

interface ScreeningToolSelectorProps {
  onSelectTool: (tool: string) => void;
  /** If provided, only these tool IDs will be shown */
  allowedTools?: string[];
}

const SCREENING_TOOLS = [
  {
    id: "GAD7",
    name: "GAD-7",
    description: "Generalized Anxiety Disorder",
    detail: "7 questions • 2-3 minutes",
    icon: Heart,
    color: "text-blue-500",
  },
  {
    id: "PHQ9",
    name: "PHQ-9",
    description: "Depression Screening",
    detail: "9 questions • 3-4 minutes",
    icon: Brain,
    color: "text-purple-500",
  },
  {
    id: "PCL5",
    name: "PCL-5",
    description: "PTSD Checklist",
    detail: "20 questions • 5-7 minutes",
    icon: Shield,
    color: "text-amber-500",
  },
  {
    id: "SSQ14",
    name: "SSQ-14",
    description: "Shona Symptom Questionnaire",
    detail: "14 questions • 3-4 minutes • locally validated",
    icon: Sprout,
    color: "text-emerald-600",
  },
  {
    id: "PSQ",
    name: "PSQ",
    description: "Psychosis Screening",
    detail: "5 questions • 2 minutes",
    icon: Eye,
    color: "text-red-500",
  },
  {
    id: "PRIMER5",
    name: "PRIME-R-5",
    description: "Prodromal Psychosis Risk",
    detail: "5 questions • 2-3 minutes",
    icon: Activity,
    color: "text-orange-500",
  },
  {
    id: "MMSE",
    name: "MMSE",
    description: "Cognitive Assessment",
    detail: "Proprietary instrument — licence required",
    icon: Lock,
    color: "text-muted-foreground",
    licenceRequired: true,
  },
];

export const ScreeningToolSelector = ({ onSelectTool, allowedTools }: ScreeningToolSelectorProps) => {
  const tools = allowedTools
    ? SCREENING_TOOLS.filter((t) => allowedTools.includes(t.id))
    : SCREENING_TOOLS;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {tools.map((tool) => {
        const Icon = tool.icon;
        const locked = Boolean(tool.licenceRequired);
        return (
          <Card
            key={tool.id}
            className={
              locked
                ? "opacity-60 cursor-not-allowed"
                : "cursor-pointer hover:shadow-lg transition-shadow"
            }
            aria-disabled={locked}
            onClick={() => {
              if (!locked) onSelectTool(tool.id);
            }}
          >
            <CardHeader>
              <div className="flex items-start gap-3">
                <Icon className={`h-6 w-6 ${tool.color}`} />
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <CardTitle className="text-lg">{tool.name}</CardTitle>
                    {locked && (
                      <Badge variant="outline" className="text-[10px]">
                        Requires licence
                      </Badge>
                    )}
                  </div>
                  <CardDescription className="mt-1.5">{tool.description}</CardDescription>
                  <p className="text-xs text-muted-foreground mt-2">{tool.detail}</p>
                  {locked && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Deactivated in this pilot. Use SSQ-14 instead.
                    </p>
                  )}
                </div>
              </div>
            </CardHeader>
          </Card>
        );
      })}
    </div>
  );
};
