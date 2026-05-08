import { useState, useCallback, useEffect } from "react";
import {
  Stethoscope, ChevronRight, ChevronLeft, Check, AlertTriangle, ShieldCheck,
  Loader2, Phone, Mail, Globe, Mic, MicOff, Upload, FileText, MapPin, LocateFixed,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Footer } from "@/components/Footer";
import { SUPPORTED_LANGUAGES } from "@/lib/languages";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const CRISIS_NUMBERS = [
  { label: "Befrienders Zimbabwe", number: "0800 22 000" },
  { label: "SADAG (South Africa)", number: "0800 567 567" },
  { label: "Lifeline", number: "0861 322 322" },
  { label: "Emergency Services", number: "112" },
];

const CONSENT_ITEMS = [
  { type: "screening_disclaimer", label: "I understand this is a mental health screening tool only, NOT a diagnosis or medical advice. Results will help connect me with appropriate mental health services.", required: true },
  { type: "data_sharing", label: "I consent to my anonymised responses being shared with the mental health facility I select to facilitate a referral.", required: true },
  { type: "emergency_understanding", label: "I understand that in a medical emergency, I should call emergency services (112) or go to my nearest emergency room immediately. This tool is NOT an emergency service.", required: true },
  { type: "voluntary_participation", label: "I confirm I am completing this assessment voluntarily and that my responses are truthful to the best of my knowledge.", required: true },
  { type: "age_confirmation", label: "I confirm I am 18 years of age or older, or I am completing this with a parent/guardian's knowledge.", required: true },
  { type: "research_opt_in", label: "I optionally consent to my fully anonymised data being used for mental health research to improve services in my region.", required: false },
];

const PHQ9_QUESTIONS = [
  "Little interest or pleasure in doing things",
  "Feeling down, depressed, or hopeless",
  "Trouble falling or staying asleep, or sleeping too much",
  "Feeling tired or having little energy",
  "Poor appetite or overeating",
  "Feeling bad about yourself — or that you are a failure or have let yourself or your family down",
  "Trouble concentrating on things, such as reading or watching television",
  "Moving or speaking so slowly that other people could have noticed? Or the opposite — being so fidgety or restless",
  "Thoughts that you would be better off dead, or of hurting yourself in some way",
];

const LIKERT_OPTIONS = [
  { value: 0, label: "Not at all" },
  { value: 1, label: "Several days" },
  { value: 2, label: "More than half the days" },
  { value: 3, label: "Nearly every day" },
];

const REGIONS = [
  { value: "harare", label: "Harare" },
  { value: "bulawayo", label: "Bulawayo" },
  { value: "manicaland", label: "Manicaland" },
  { value: "mashonaland_central", label: "Mashonaland Central" },
  { value: "mashonaland_east", label: "Mashonaland East" },
  { value: "mashonaland_west", label: "Mashonaland West" },
  { value: "masvingo", label: "Masvingo" },
  { value: "matabeleland_north", label: "Matabeleland North" },
  { value: "matabeleland_south", label: "Matabeleland South" },
  { value: "midlands", label: "Midlands" },
  { value: "gauteng", label: "Gauteng (SA)" },
  { value: "western_cape", label: "Western Cape (SA)" },
  { value: "kwazulu_natal", label: "KwaZulu-Natal (SA)" },
  { value: "limpopo", label: "Limpopo (SA)" },
  { value: "other_za", label: "Other (South Africa)" },
  { value: "botswana", label: "Botswana" },
  { value: "zambia", label: "Zambia" },
  { value: "mozambique", label: "Mozambique" },
  { value: "other", label: "Other" },
];

type Step = "welcome" | "consent" | "demographics" | "screening" | "narrative" | "recipient" | "completing" | "result";

interface FacilityListItem {
  id: string;
  facility_name: string;
  facility_type: string;
  region: string;
  city: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  website: string | null;
  services_offered: string[];
  specialisations: string[];
  emergency_capable: boolean;
  distance_km: number | null;
}

async function callApi(body: Record<string, unknown>) {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/self-assess`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${SUPABASE_KEY}`, apikey: SUPABASE_KEY },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

export default function SelfAssess() {
  const { toast } = useToast();
  const [step, setStep] = useState<Step>("welcome");
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [crisisDetected, setCrisisDetected] = useState(false);

  const [consents, setConsents] = useState<Record<string, boolean>>({});

  const [ageBand, setAgeBand] = useState("");
  const [gender, setGender] = useState("");
  const [region, setRegion] = useState("");
  const [preferredLanguage, setPreferredLanguage] = useState("en");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [geoStatus, setGeoStatus] = useState<"idle" | "requesting" | "granted" | "denied">("idle");

  const [phq9Responses, setPhq9Responses] = useState<Record<number, number>>({});

  const [narrativeText, setNarrativeText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);

  const [facilities, setFacilities] = useState<FacilityListItem[]>([]);
  const [selectedFacilityIds, setSelectedFacilityIds] = useState<string[]>([]);

  const [resultData, setResultData] = useState<any>(null);

  const totalSteps = 6;
  const stepIndex: Record<Step, number> = {
    welcome: 0, consent: 1, demographics: 2, screening: 3, narrative: 4, recipient: 5, completing: 5, result: 6,
  };
  const progress = (stepIndex[step] / totalSteps) * 100;

  // ── Geolocation ──
  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setGeoStatus("denied");
      toast({ title: "Location not available", description: "Your browser does not support geolocation. Please pick a region instead." });
      return;
    }
    setGeoStatus("requesting");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGeoStatus("granted");
        toast({ title: "Location captured", description: "We'll use this to find services near you." });
      },
      () => {
        setGeoStatus("denied");
        toast({ title: "Location declined", description: "No problem — please pick a region instead.", variant: "destructive" });
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
    );
  }, [toast]);

  // ── Start session ──
  const startSession = useCallback(async () => {
    setLoading(true);
    try {
      const data = await callApi({ action: "start", language_code: preferredLanguage });
      setSessionToken(data.session.session_token);
      setStep("consent");
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally { setLoading(false); }
  }, [preferredLanguage, toast]);

  // ── Save consents ──
  const saveConsents = useCallback(async () => {
    const requiredMissing = CONSENT_ITEMS.filter(c => c.required && !consents[c.type]);
    if (requiredMissing.length > 0) {
      toast({ title: "Required consents", description: "Please agree to all required items before continuing.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const consentRows = CONSENT_ITEMS.map(c => ({
        consent_type: c.type, granted: !!consents[c.type], consent_text_version: "1.0",
      }));
      await callApi({ action: "save_consents", session_token: sessionToken, consents: consentRows });
      setStep("demographics");
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally { setLoading(false); }
  }, [consents, sessionToken, toast]);

  // ── Save demographics ──
  const saveDemographics = useCallback(async () => {
    if (!ageBand || !gender || !region) {
      toast({ title: "Required fields", description: "Please complete all required fields.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      await callApi({
        action: "save_demographics",
        session_token: sessionToken,
        demographics: { age_band: ageBand, gender, preferred_language: preferredLanguage },
        location_region: region,
        latitude: coords?.lat,
        longitude: coords?.lng,
      });
      setStep("screening");
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally { setLoading(false); }
  }, [ageBand, gender, region, preferredLanguage, sessionToken, coords, toast]);

  // ── Save screening ──
  const saveScreening = useCallback(async () => {
    if (Object.keys(phq9Responses).length < 9) {
      toast({ title: "Incomplete", description: "Please answer all 9 questions.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const totalScore = Object.values(phq9Responses).reduce((a, b) => a + b, 0);
      const q9Score = phq9Responses[8] || 0;
      const isCrisis = q9Score >= 1;
      let severityLevel = "minimal";
      if (totalScore >= 20) severityLevel = "severe";
      else if (totalScore >= 15) severityLevel = "moderately_severe";
      else if (totalScore >= 10) severityLevel = "moderate";
      else if (totalScore >= 5) severityLevel = "mild";

      const itemFlags: any = {};
      if (isCrisis) {
        itemFlags.suicidal_ideation = true;
        itemFlags.immediate_review = true;
        itemFlags.q9_score = q9Score;
      }
      const result = await callApi({
        action: "save_screening", session_token: sessionToken, tool_type: "PHQ-9",
        responses: phq9Responses, total_score: totalScore, severity_level: severityLevel,
        interpretation: `PHQ-9 score: ${totalScore}/27 (${severityLevel})`, item_flags: itemFlags,
      });
      if (result.crisis || isCrisis) setCrisisDetected(true);
      setStep("narrative");
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally { setLoading(false); }
  }, [phq9Responses, sessionToken, toast]);

  // ── Save narrative & move to recipient picker ──
  const proceedToRecipient = useCallback(async () => {
    setLoading(true);
    try {
      if (narrativeText.trim()) {
        await callApi({ action: "save_narrative", session_token: sessionToken, narrative_text: narrativeText });
      }
      const data = await callApi({ action: "list_facilities", session_token: sessionToken });
      setFacilities(data.facilities ?? []);
      setStep("recipient");
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally { setLoading(false); }
  }, [narrativeText, sessionToken, toast]);

  // ── Submit to chosen recipient(s) ──
  const submitReferral = useCallback(async () => {
    if (selectedFacilityIds.length === 0) {
      toast({ title: "Pick a recipient", description: "Choose at least one service to send your assessment to.", variant: "destructive" });
      return;
    }
    setLoading(true);
    setStep("completing");
    try {
      const result = await callApi({
        action: "submit",
        session_token: sessionToken,
        facility_ids: selectedFacilityIds,
      });
      setResultData(result);
      setStep("result");
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
      setStep("recipient");
    } finally { setLoading(false); }
  }, [selectedFacilityIds, sessionToken, toast]);

  // ── Voice recording ──
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: "audio/webm;codecs=opus" });
      const chunks: BlobPart[] = [];
      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(chunks, { type: "audio/webm" });
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64 = (reader.result as string).split(",")[1];
          try {
            const res = await fetch(`${SUPABASE_URL}/functions/v1/transcribe-audio`, {
              method: "POST",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${SUPABASE_KEY}`, apikey: SUPABASE_KEY },
              body: JSON.stringify({ audio: base64, languageCode: preferredLanguage }),
            });
            const data = await res.json();
            if (data.text) {
              setNarrativeText(prev => prev ? `${prev}\n\n${data.text}` : data.text);
              toast({ title: "Transcription complete" });
            }
          } catch {
            toast({ title: "Transcription failed", description: "Please type your concerns instead.", variant: "destructive" });
          }
        };
        reader.readAsDataURL(blob);
      };
      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch {
      toast({ title: "Microphone access denied", variant: "destructive" });
    }
  }, [preferredLanguage, toast]);

  const stopRecording = useCallback(() => {
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
      mediaRecorder.stop();
      setIsRecording(false);
      setMediaRecorder(null);
    }
  }, [mediaRecorder]);

  const handleDocumentUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowedTypes = ["application/pdf", "image/jpeg", "image/png", "image/webp", "text/plain"];
    if (!allowedTypes.includes(file.type)) {
      toast({ title: "Unsupported file", variant: "destructive" });
      return;
    }
    if (file.type === "text/plain") {
      const text = await file.text();
      setNarrativeText(prev => prev ? `${prev}\n\n--- From ${file.name} ---\n${text}` : text);
      return;
    }
    setLoading(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = (reader.result as string).split(",")[1];
        const res = await fetch(`${SUPABASE_URL}/functions/v1/process-document`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${SUPABASE_KEY}`, apikey: SUPABASE_KEY },
          body: JSON.stringify({ document: base64, fileName: file.name, mimeType: file.type }),
        });
        const data = await res.json();
        if (data.text) setNarrativeText(prev => prev ? `${prev}\n\n--- From ${file.name} ---\n${data.text}` : data.text);
        setLoading(false);
      };
      reader.readAsDataURL(file);
    } catch {
      toast({ title: "Upload failed", variant: "destructive" });
      setLoading(false);
    }
  }, [toast]);

  const toggleFacility = (id: string) => {
    setSelectedFacilityIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  // SEO
  useEffect(() => {
    document.title = "Mental Health Self-Assessment | Nzwisiso";
    const desc = "Free, confidential mental health self-assessment. Get matched with services in Zimbabwe and Southern Africa.";
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "description");
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", desc);
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="bg-card border-b px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <Stethoscope className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">Nzwisiso</h1>
              <p className="text-xs text-muted-foreground">Mental Health Self-Assessment</p>
            </div>
          </div>
          <Badge variant="outline" className="text-xs">Confidential</Badge>
        </div>
      </header>

      {step !== "welcome" && step !== "result" && (
        <div className="max-w-3xl mx-auto w-full px-6 pt-4">
          <Progress value={progress} className="h-2" />
          <p className="text-xs text-muted-foreground mt-1 text-right">
            Step {stepIndex[step]} of {totalSteps}
          </p>
        </div>
      )}

      {crisisDetected && (
        <div className="max-w-3xl mx-auto w-full px-6 mt-4">
          <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-destructive text-sm">If you are in immediate danger, please contact emergency services now</p>
                <div className="mt-2 space-y-1">
                  {CRISIS_NUMBERS.map((c) => (
                    <p key={c.number} className="text-sm">
                      <strong>{c.label}:</strong>{" "}
                      <a href={`tel:${c.number.replace(/\s/g, "")}`} className="text-destructive underline font-mono">{c.number}</a>
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-8">
        {step === "welcome" && (
          <Card>
            <CardHeader className="text-center pb-2">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <ShieldCheck className="w-8 h-8 text-primary" />
              </div>
              <CardTitle className="text-2xl">Mental Health Self-Assessment</CardTitle>
              <CardDescription className="text-base mt-2">
                A confidential tool to help you understand how you've been feeling and connect you with mental health services you choose.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-accent/30 rounded-lg p-4 space-y-2">
                <h3 className="font-semibold text-sm">What to expect:</h3>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>A short screening questionnaire (about 5 minutes)</li>
                  <li>Option to share your story by voice, text, or document upload</li>
                  <li><strong>You choose</strong> which mental health service receives your assessment</li>
                  <li>No personal identifying information is stored</li>
                </ul>
              </div>

              <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-4">
                <p className="text-sm font-medium text-destructive flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" /> This is NOT an emergency service
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  If you are in immediate danger, call emergency services (112) or go to your nearest emergency room.
                </p>
              </div>

              <div className="space-y-2">
                <Label>Preferred language</Label>
                <Select value={preferredLanguage} onValueChange={setPreferredLanguage}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SUPPORTED_LANGUAGES.map(l => (
                      <SelectItem key={l.code} value={l.code}>{l.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={startSession} disabled={loading} className="w-full" size="lg">
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Begin Self-Assessment
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        )}

        {step === "consent" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-primary" /> Consent & Safety Information
              </CardTitle>
              <CardDescription>Please read and agree to the following before continuing.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {CONSENT_ITEMS.map((item) => (
                <div key={item.type} className="flex items-start gap-3 p-3 rounded-lg border bg-card">
                  <Checkbox
                    id={item.type}
                    checked={!!consents[item.type]}
                    onCheckedChange={(c) => setConsents(prev => ({ ...prev, [item.type]: !!c }))}
                  />
                  <Label htmlFor={item.type} className="text-sm leading-relaxed cursor-pointer flex-1">
                    {item.label}
                    {item.required && <span className="text-destructive ml-1">*</span>}
                  </Label>
                </div>
              ))}
              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={() => setStep("welcome")}>
                  <ChevronLeft className="w-4 h-4 mr-1" /> Back
                </Button>
                <Button onClick={saveConsents} disabled={loading} className="flex-1">
                  {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  I Agree & Continue <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === "demographics" && (
          <Card>
            <CardHeader>
              <CardTitle>About You</CardTitle>
              <CardDescription>Help us match you with the right services. No identifying information is stored.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Age range <span className="text-destructive">*</span></Label>
                <Select value={ageBand} onValueChange={setAgeBand}>
                  <SelectTrigger><SelectValue placeholder="Select age range" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="18-24">18–24</SelectItem>
                    <SelectItem value="25-34">25–34</SelectItem>
                    <SelectItem value="35-44">35–44</SelectItem>
                    <SelectItem value="45-54">45–54</SelectItem>
                    <SelectItem value="55-64">55–64</SelectItem>
                    <SelectItem value="65+">65+</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Gender <span className="text-destructive">*</span></Label>
                <Select value={gender} onValueChange={setGender}>
                  <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="non-binary">Non-binary</SelectItem>
                    <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Region / Province <span className="text-destructive">*</span></Label>
                <Select value={region} onValueChange={setRegion}>
                  <SelectTrigger><SelectValue placeholder="Select your region" /></SelectTrigger>
                  <SelectContent>
                    {REGIONS.map(r => (
                      <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="rounded-lg border p-3 bg-accent/20 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-primary" />
                    <span className="font-medium">Use my location (optional)</span>
                  </div>
                  {geoStatus === "granted" && coords && (
                    <Badge variant="secondary" className="text-xs">
                      Captured ({coords.lat.toFixed(2)}, {coords.lng.toFixed(2)})
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Sharing your location helps us rank facilities by distance. Optional — region above is enough.
                </p>
                <Button
                  type="button" variant="outline" size="sm"
                  onClick={requestLocation}
                  disabled={geoStatus === "requesting"}
                >
                  {geoStatus === "requesting" ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <LocateFixed className="w-4 h-4 mr-1" />}
                  {geoStatus === "granted" ? "Update location" : "Share my location"}
                </Button>
              </div>

              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={() => setStep("consent")}>
                  <ChevronLeft className="w-4 h-4 mr-1" /> Back
                </Button>
                <Button onClick={saveDemographics} disabled={loading} className="flex-1">
                  {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Continue to Screening <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === "screening" && (
          <Card>
            <CardHeader>
              <CardTitle>How Have You Been Feeling?</CardTitle>
              <CardDescription>
                Over the <strong>last 2 weeks</strong>, how often have you been bothered by any of the following problems?
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {PHQ9_QUESTIONS.map((q, i) => (
                <div key={i} className="space-y-2">
                  <Label className="text-sm font-medium">
                    {i + 1}. {q}
                    {i === 8 && <Badge variant="outline" className="ml-2 text-xs">Safety question</Badge>}
                  </Label>
                  <RadioGroup
                    value={phq9Responses[i]?.toString()}
                    onValueChange={(v) => setPhq9Responses(prev => ({ ...prev, [i]: parseInt(v) }))}
                    className="flex flex-wrap gap-2"
                  >
                    {LIKERT_OPTIONS.map(opt => (
                      <div key={opt.value} className="flex items-center">
                        <RadioGroupItem value={opt.value.toString()} id={`q${i}-${opt.value}`} className="peer sr-only" />
                        <Label
                          htmlFor={`q${i}-${opt.value}`}
                          className="px-3 py-2 rounded-md border text-xs cursor-pointer peer-data-[state=checked]:bg-primary peer-data-[state=checked]:text-primary-foreground peer-data-[state=checked]:border-primary hover:bg-accent transition-colors"
                        >
                          {opt.label}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              ))}
              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={() => setStep("demographics")}>
                  <ChevronLeft className="w-4 h-4 mr-1" /> Back
                </Button>
                <Button onClick={saveScreening} disabled={loading} className="flex-1">
                  {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Continue <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === "narrative" && (
          <Card>
            <CardHeader>
              <CardTitle>Tell Us More (Optional)</CardTitle>
              <CardDescription>
                Share anything else about how you've been feeling. You can type, speak, or upload documents.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={narrativeText}
                onChange={(e) => setNarrativeText(e.target.value)}
                placeholder="Describe what's been on your mind, any symptoms, or concerns you'd like help with..."
                rows={6}
              />
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant={isRecording ? "destructive" : "outline"} size="sm"
                  onClick={isRecording ? stopRecording : startRecording}>
                  {isRecording ? <MicOff className="w-4 h-4 mr-1" /> : <Mic className="w-4 h-4 mr-1" />}
                  {isRecording ? "Stop Recording" : "Speak"}
                </Button>
                <Label htmlFor="doc-upload" className="cursor-pointer">
                  <Button type="button" variant="outline" size="sm" asChild>
                    <span><Upload className="w-4 h-4 mr-1" /> Upload Document</span>
                  </Button>
                </Label>
                <Input id="doc-upload" type="file" className="hidden"
                  accept=".pdf,.txt,.jpg,.jpeg,.png,.webp" onChange={handleDocumentUpload} />
              </div>
              <p className="text-xs text-muted-foreground">Accepted: PDF, images, or text files.</p>
              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={() => setStep("screening")}>
                  <ChevronLeft className="w-4 h-4 mr-1" /> Back
                </Button>
                <Button onClick={proceedToRecipient} disabled={loading} className="flex-1">
                  {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Continue to Choose Recipient <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === "recipient" && (
          <Card>
            <CardHeader>
              <CardTitle>Choose Where to Send Your Assessment</CardTitle>
              <CardDescription>
                You decide who receives your assessment. Pick one or more services. The receiving practitioner will see your screening results and an AI-generated diagnostic suggestion to inform their review — only they can see it, not anyone else.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {facilities.length === 0 && (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  No facilities available right now. Please contact a crisis line above.
                </div>
              )}
              {facilities.map((f) => {
                const checked = selectedFacilityIds.includes(f.id);
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => toggleFacility(f.id)}
                    className={`w-full text-left p-4 rounded-lg border transition-colors ${
                      checked ? "border-primary bg-primary/5" : "bg-card hover:bg-accent/30"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <Checkbox checked={checked} className="mt-1" />
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="font-semibold">{f.facility_name}</h4>
                          <div className="flex gap-1">
                            <Badge variant="outline" className="text-xs capitalize">{f.facility_type}</Badge>
                            {f.emergency_capable && <Badge variant="destructive" className="text-xs">Emergency</Badge>}
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {f.city ?? f.region}
                          {f.distance_km !== null && ` · ${f.distance_km.toFixed(1)} km away`}
                        </p>
                        {f.services_offered?.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-1">
                            {f.services_offered.slice(0, 4).map((s, j) => (
                              <Badge key={j} variant="secondary" className="text-xs">{s}</Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={() => setStep("narrative")}>
                  <ChevronLeft className="w-4 h-4 mr-1" /> Back
                </Button>
                <Button onClick={submitReferral} disabled={loading || selectedFacilityIds.length === 0} className="flex-1">
                  {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Submit to {selectedFacilityIds.length || "..."} service{selectedFacilityIds.length !== 1 ? "s" : ""}
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === "completing" && (
          <Card>
            <CardContent className="py-12 text-center space-y-4">
              <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
              <h3 className="text-lg font-semibold">Submitting your assessment...</h3>
              <p className="text-sm text-muted-foreground">Sending your information to the services you selected.</p>
            </CardContent>
          </Card>
        )}

        {step === "result" && resultData && (
          <div className="space-y-6">
            {resultData.is_crisis ? (
              <Card className="border-destructive/50 bg-destructive/5">
                <CardHeader>
                  <CardTitle className="text-destructive flex items-center gap-2">
                    <AlertTriangle className="w-6 h-6" /> Immediate Support Available
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm">
                    Based on your responses, we strongly recommend you speak with someone right away.
                  </p>
                  <div className="space-y-3">
                    {CRISIS_NUMBERS.map(c => (
                      <a key={c.number} href={`tel:${c.number.replace(/\s/g, "")}`}
                        className="flex items-center gap-3 p-3 rounded-lg border border-destructive/30 bg-card">
                        <Phone className="w-5 h-5 text-destructive" />
                        <div>
                          <p className="font-semibold text-sm">{c.label}</p>
                          <p className="text-destructive font-mono">{c.number}</p>
                        </div>
                      </a>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-primary/30 bg-primary/5">
                <CardHeader>
                  <CardTitle className="text-primary flex items-center gap-2">
                    <Check className="w-6 h-6" /> Assessment Submitted
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Thank you. Your assessment has been sent to the services you chose. They will review and reach out to you.
                  </p>
                </CardContent>
              </Card>
            )}

            {resultData.facilities && resultData.facilities.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Sent To</CardTitle>
                  <CardDescription>You can also contact these services directly.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {resultData.facilities.map((f: any, i: number) => (
                    <div key={i} className="p-4 rounded-lg border bg-card space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold">{f.name}</h4>
                        {f.emergency && <Badge variant="destructive" className="text-xs">Emergency capable</Badge>}
                      </div>
                      {f.city && <p className="text-sm text-muted-foreground">{f.city}</p>}
                      <div className="flex flex-wrap gap-2 text-sm">
                        {f.phone && <a href={`tel:${f.phone}`} className="flex items-center gap-1 text-primary hover:underline"><Phone className="w-3 h-3" /> {f.phone}</a>}
                        {f.email && <a href={`mailto:${f.email}`} className="flex items-center gap-1 text-primary hover:underline"><Mail className="w-3 h-3" /> {f.email}</a>}
                        {f.website && <a href={f.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary hover:underline"><Globe className="w-3 h-3" /> Website</a>}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader><CardTitle className="text-lg">What Happens Next?</CardTitle></CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5"><span className="text-xs font-bold text-primary">1</span></div>
                  <p>Your selected facility will receive your anonymised referral within 24 hours.</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5"><span className="text-xs font-bold text-primary">2</span></div>
                  <p>A mental health professional will review your assessment and may reach out to schedule an appointment.</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5"><span className="text-xs font-bold text-primary">3</span></div>
                  <p>If you don't hear back within 48 hours, you can contact the facility directly using the details above.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
