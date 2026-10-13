import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Stethoscope, HeartPulse, Users, ShieldCheck } from "lucide-react";
import type { User, Session } from "@supabase/supabase-js";
import { Footer } from "@/components/Footer";
import { PRIVACY_NOTE } from "@/lib/copy";

type IntendedRole = "psychiatrist" | "chw";

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState<string | null>(null);
  const [signupRole, setSignupRole] = useState<IntendedRole>("psychiatrist");
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          navigate("/");
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        navigate("/");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const fullName = formData.get("fullName") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    if (!fullName || !email || !password) {
      toast({
        variant: "destructive",
        title: "Missing fields",
        description: "Please fill in all fields",
      });
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      toast({
        variant: "destructive",
        title: "Password too short",
        description: "Password must be at least 6 characters",
      });
      setLoading(false);
      return;
    }

    const redirectUrl = `${window.location.origin}/`;

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
          intended_role: signupRole,
        },
      },
    });

    setLoading(false);

    if (error) {
      toast({
        variant: "destructive",
        title: "Sign up failed",
        description: error.message,
      });
    } else {
      toast({
        title: "Account created!",
        description: "You can now sign in with your credentials",
      });
    }
  };

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    if (!email || !password) {
      toast({
        variant: "destructive",
        title: "Missing fields",
        description: "Please fill in all fields",
      });
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      toast({
        variant: "destructive",
        title: "Sign in failed",
        description: error.message,
      });
    }
  };

  const enterAs = async (persona: string) => {
    setDemoLoading(persona);
    const { data, error } = await supabase.functions.invoke("demo-login", { body: { persona } });
    if (error || !data?.email) {
      setDemoLoading(null);
      toast({ variant: "destructive", title: "Couldn't open sandbox", description: error?.message ?? data?.error });
      return;
    }
    const { error: e2 } = await supabase.auth.signInWithPassword({ email: data.email, password: data.password });
    setDemoLoading(null);
    if (e2) {
      toast({ variant: "destructive", title: "Couldn't open sandbox", description: e2.message });
      return;
    }
    navigate(persona === "admin" ? "/admin" : persona === "chw" ? "/chw" : "/");
  };

  const personas = [
    { id: "clinician", label: "Clinician", desc: "Diagnosis, treatment & full screening", icon: Stethoscope },
    { id: "nurse", label: "MH Nurse", desc: "Assessment, screening & care planning", icon: HeartPulse },
    { id: "chw", label: "Community Health Worker", desc: "First contact, PHQ-9 & referral up", icon: Users },
    { id: "admin", label: "Administrator", desc: "Team, facilities & oversight", icon: ShieldCheck },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center gap-6 bg-gradient-to-br from-background via-background to-primary/10 p-4">
        <div className="text-center max-w-xl space-y-2">
          <h1 className="text-3xl font-bold">Welcome to Nzwisiso</h1>
          <p className="text-muted-foreground">
            Sandbox mode — pick a role to explore. No sign-up needed; all data is synthetic.
          </p>
        </div>
        <div className="grid w-full max-w-3xl grid-cols-1 sm:grid-cols-2 gap-3">
          {personas.map((p) => (
            <button
              key={p.id}
              onClick={() => enterAs(p.id)}
              disabled={!!demoLoading}
              className="flex items-start gap-3 rounded-lg border bg-card p-4 text-left transition hover:border-primary hover:shadow-md disabled:opacity-60"
            >
              <span className="rounded-md bg-primary/10 p-2 text-primary">
                {demoLoading === p.id ? <Loader2 className="h-5 w-5 animate-spin" /> : <p.icon className="h-5 w-5" />}
              </span>
              <span>
                <span className="block font-semibold">Enter as {p.label}</span>
                <span className="block text-sm text-muted-foreground">{p.desc}</span>
              </span>
            </button>
          ))}
        </div>
        <a href="/self-assess" className="text-sm text-primary hover:underline">
          Not a clinician? Take a confidential self-assessment →
        </a>
        <details className="w-full max-w-md">
          <summary className="cursor-pointer text-center text-sm text-muted-foreground">
            Have a personal account? Sign in or sign up
          </summary>
        <Card className="w-full mt-3">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl font-bold text-center">
              Mental Health Clinical Assistant
            </CardTitle>
            <CardDescription className="text-center">
              Sign up/in to use this decision support tool.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4 p-3 bg-primary/5 border border-primary/20 rounded-md text-sm">
              <p>
                <strong>Privacy Note:</strong> {PRIVACY_NOTE}
              </p>
            </div>
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>
              
              <TabsContent value="signin">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email">Email</Label>
                    <Input
                      id="signin-email"
                      name="email"
                      type="email"
                      placeholder="psychiatrist@example.com"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signin-password">Password</Label>
                    <Input
                      id="signin-password"
                      name="password"
                      type="password"
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Sign In
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label>I am signing up as</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        type="button"
                        variant={signupRole === "psychiatrist" ? "default" : "outline"}
                        onClick={() => setSignupRole("psychiatrist")}
                        className="w-full"
                      >
                        Clinician
                      </Button>
                      <Button
                        type="button"
                        variant={signupRole === "chw" ? "default" : "outline"}
                        onClick={() => setSignupRole("chw")}
                        className="w-full"
                      >
                        Community Health Worker
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {signupRole === "chw"
                        ? "CHW account: lay-counsellor scope (PHQ-9, narrative capture, upward referral)."
                        : "Clinician account: full diagnostic & treatment access."}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Full Name</Label>
                    <Input
                      id="signup-name"
                      name="fullName"
                      type="text"
                      placeholder={signupRole === "chw" ? "Jane Moyo" : "Dr. Jane Smith"}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      name="email"
                      type="email"
                      placeholder="psychiatrist@example.com"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <Input
                      id="signup-password"
                      name="password"
                      type="password"
                      minLength={6}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Sign Up
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
        </details>
      </div>
      <Footer />
    </div>
  );
};

export default Auth;