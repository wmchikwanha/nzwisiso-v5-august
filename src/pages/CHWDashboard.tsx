import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { isCHW, canAccessChwDashboard, getRoleLabel } from "@/lib/permissions";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { HeartHandshake, Users, ArrowUpRight, History, LogOut, User } from "lucide-react";
import { CHWClientList } from "@/components/chw/CHWClientList";
import { CHWSessionWorkspace } from "@/components/chw/CHWSessionWorkspace";
import { CHWReferralsList } from "@/components/chw/CHWReferralsList";
import { CHWHistory } from "@/components/chw/CHWHistory";
import { Footer } from "@/components/Footer";

const CHWDashboard = () => {
  const { user, loading, userRole, signOut } = useAuth();
  const navigate = useNavigate();
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [tab, setTab] = useState("clients");

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!loading && userRole && !canAccessChwDashboard(userRole)) {
      navigate("/");
    }
  }, [loading, userRole, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }
  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card shadow-sm">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary rounded-lg">
              <HeartHandshake className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">CHW Workspace</h1>
              <p className="text-sm text-muted-foreground">
                Lay-counsellor first port of call · register clients · capture conversation ·
                PHQ-9 · refer up
              </p>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <User className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">{user?.email}</p>
                  <Badge className="w-fit text-xs">{getRoleLabel(userRole)}</Badge>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={signOut}>
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        {activeSessionId ? (
          <CHWSessionWorkspace
            sessionId={activeSessionId}
            onExit={() => {
              setActiveSessionId(null);
              setTab("clients");
            }}
          />
        ) : (
          <Tabs value={tab} onValueChange={setTab} className="w-full">
            <TabsList className="grid w-full max-w-2xl mx-auto mb-6 grid-cols-3">
              <TabsTrigger value="clients">
                <Users className="h-4 w-4 mr-2" /> Clients
              </TabsTrigger>
              <TabsTrigger value="referrals">
                <ArrowUpRight className="h-4 w-4 mr-2" /> Referrals
              </TabsTrigger>
              <TabsTrigger value="history">
                <History className="h-4 w-4 mr-2" /> History
              </TabsTrigger>
            </TabsList>

            <TabsContent value="clients">
              <CHWClientList onOpenSession={(id) => setActiveSessionId(id)} />
            </TabsContent>
            <TabsContent value="referrals">
              <CHWReferralsList />
            </TabsContent>
            <TabsContent value="history">
              <CHWHistory />
            </TabsContent>
          </Tabs>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default CHWDashboard;
