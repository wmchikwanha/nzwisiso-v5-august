import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Footer } from "@/components/Footer";
import { Loader2, ShieldCheck, UserPlus, ArrowLeft, Trash2, Ban, RotateCcw, Activity } from "lucide-react";
import { getRoleLabel } from "@/lib/permissions";

interface Member {
  id: string;
  full_name: string;
  email: string;
  status: string;
  created_at: string;
  roles: string[];
}

interface AuditEvent {
  id: string;
  actor_id: string;
  actor_role: string;
  action: string;
  resource_type: string;
  resource_id: string | null;
  outcome: string;
  recorded_at: string;
  description: string | null;
}

const ROLES = ["admin", "psychiatrist", "chw", "viewer"];

const AdminDashboard = () => {
  const { session, userRole, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [members, setMembers] = useState<Member[]>([]);
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [busy, setBusy] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("psychiatrist");

  useEffect(() => {
    if (loading) return;
    if (!session) {
      navigate("/auth");
      return;
    }
    if (userRole !== "admin") {
      navigate("/");
    }
  }, [session, userRole, loading, navigate]);

  const call = async (action: string, payload?: any) => {
    const { data, error } = await supabase.functions.invoke("admin-team", {
      body: { action, payload },
    });
    if (error) throw error;
    if ((data as any)?.error) throw new Error((data as any).error);
    return data as any;
  };

  const refresh = async () => {
    setBusy(true);
    try {
      const [m, a] = await Promise.all([call("list"), call("activity")]);
      setMembers(m.members ?? []);
      setEvents(a.events ?? []);
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (userRole === "admin") refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userRole]);

  const handleInvite = async () => {
    try {
      await call("invite", { email: inviteEmail, role: inviteRole });
      toast({ title: "Invitation sent", description: inviteEmail });
      setInviteOpen(false);
      setInviteEmail("");
      refresh();
    } catch (e: any) {
      toast({ title: "Invite failed", description: e.message, variant: "destructive" });
    }
  };

  const handleSetRole = async (user_id: string, role: string) => {
    try {
      await call("set_role", { user_id, role });
      toast({ title: "Role updated" });
      refresh();
    } catch (e: any) {
      toast({ title: "Failed", description: e.message, variant: "destructive" });
    }
  };

  const handleSetStatus = async (user_id: string, status: string) => {
    try {
      await call("set_status", { user_id, status });
      toast({ title: status === "revoked" ? "Access revoked" : "Access reinstated" });
      refresh();
    } catch (e: any) {
      toast({ title: "Failed", description: e.message, variant: "destructive" });
    }
  };

  const handleDelete = async (user_id: string, email: string) => {
    if (!confirm(`Permanently delete ${email}? This cannot be undone.`)) return;
    try {
      await call("delete", { user_id });
      toast({ title: "Member deleted" });
      refresh();
    } catch (e: any) {
      toast({ title: "Failed", description: e.message, variant: "destructive" });
    }
  };

  if (loading || userRole !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <ShieldCheck className="h-6 w-6 text-primary" />
            <div>
              <h1 className="text-xl font-bold">Admin Console</h1>
              <p className="text-xs text-muted-foreground">Manage team members & monitor activity</p>
            </div>
          </div>
          <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="h-4 w-4 mr-2" /> Invite Member
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Invite team member</DialogTitle>
                <DialogDescription>
                  An email invitation will be sent. They'll set a password and join with the role you choose.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="invite-email">Email</Label>
                  <Input
                    id="invite-email"
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="colleague@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Role</Label>
                  <Select value={inviteRole} onValueChange={setInviteRole}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ROLES.map(r => (
                        <SelectItem key={r} value={r}>{getRoleLabel(r)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setInviteOpen(false)}>Cancel</Button>
                <Button onClick={handleInvite} disabled={!inviteEmail}>Send invitation</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <main className="container mx-auto px-6 py-6 flex-1">
        <Tabs defaultValue="members">
          <TabsList>
            <TabsTrigger value="members"><ShieldCheck className="h-4 w-4 mr-2" />Members</TabsTrigger>
            <TabsTrigger value="activity"><Activity className="h-4 w-4 mr-2" />Activity</TabsTrigger>
            <TabsTrigger value="audio"><Lock className="h-4 w-4 mr-2" />Audio</TabsTrigger>
          </TabsList>

          <TabsContent value="audio">
            <AudioVault />
          </TabsContent>



          <TabsContent value="members">
            <Card>
              <CardHeader>
                <CardTitle>Team members</CardTitle>
                <CardDescription>
                  {busy ? "Loading…" : `${members.length} account(s)`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {members.map((m) => {
                      const currentRole = m.roles[0] ?? "viewer";
                      return (
                        <TableRow key={m.id}>
                          <TableCell className="font-medium">{m.full_name}</TableCell>
                          <TableCell>{m.email}</TableCell>
                          <TableCell>
                            <Select
                              value={currentRole}
                              onValueChange={(r) => handleSetRole(m.id, r)}
                            >
                              <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {ROLES.map(r => (
                                  <SelectItem key={r} value={r}>{getRoleLabel(r)}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Badge variant={m.status === "active" ? "default" : m.status === "revoked" ? "destructive" : "secondary"}>
                              {m.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right space-x-2">
                            {m.status === "revoked" ? (
                              <Button size="sm" variant="outline" onClick={() => handleSetStatus(m.id, "active")}>
                                <RotateCcw className="h-3 w-3 mr-1" /> Reinstate
                              </Button>
                            ) : (
                              <Button size="sm" variant="outline" onClick={() => handleSetStatus(m.id, "revoked")}>
                                <Ban className="h-3 w-3 mr-1" /> Revoke
                              </Button>
                            )}
                            <Button size="sm" variant="ghost" onClick={() => handleDelete(m.id, m.email)}>
                              <Trash2 className="h-3 w-3 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {!busy && members.length === 0 && (
                      <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">No members yet.</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity">
            <Card>
              <CardHeader>
                <CardTitle>Recent activity</CardTitle>
                <CardDescription>Last 200 audit events across the platform</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>When</TableHead>
                      <TableHead>Actor</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Resource</TableHead>
                      <TableHead>Outcome</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {events.map((e) => (
                      <TableRow key={e.id}>
                        <TableCell className="text-xs whitespace-nowrap">
                          {new Date(e.recorded_at).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-xs">
                          <div className="font-mono">{e.actor_id?.slice(0, 8)}</div>
                          <div className="text-muted-foreground">{e.actor_role}</div>
                        </TableCell>
                        <TableCell className="text-xs">{e.action}</TableCell>
                        <TableCell className="text-xs">
                          {e.resource_type}{e.resource_id ? ` · ${e.resource_id.slice(0, 8)}` : ""}
                        </TableCell>
                        <TableCell>
                          <Badge variant={e.outcome === "success" ? "default" : "destructive"}>
                            {e.outcome}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                    {!busy && events.length === 0 && (
                      <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">No activity recorded yet.</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
};

export default AdminDashboard;
