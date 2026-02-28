"use client";

import { ThemeToggle } from "@/components/theme-toggle";
import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User, Mail, Calendar, Shield, LogOut, Camera, Edit3, Check, X,
  Zap, FileText, TrendingUp, MessageSquare, Github, Linkedin,
  Phone, MapPin, Building2, Briefcase, Plus, Clock, ChevronRight,
  AlertCircle, Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import Link from "next/link";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────
interface ResumeAnalysis {
  id: string;
  filename: string;
  score?: number;
  improvementScore?: number;
  matchPercentage?: number;
  skills?: string[];
  skillGaps?: string[];
  status: string;
  createdAt: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const SKILL_SUGGESTIONS = [
  "Python","JavaScript","TypeScript","React","Next.js","Node.js","Java","C","C++",
  "Go","MongoDB","PostgreSQL","AWS","Docker","Kubernetes","Machine Learning",
  "GraphQL","Flutter","Vue.js","Angular","Terraform","Git","Redis","Firebase",
];

const EXP_OPTIONS = ["0–1 years","1–3 years","3–5 years","5–10 years","10+ years"];

const MOCK_RESUMES: ResumeAnalysis[] = [
  {
    id: "1",
    filename: "resume_v1.pdf",
    score: 78,
    improvementScore: 85,
    matchPercentage: 72,
    skills: ["React","TypeScript","Node.js","Python","AWS"],
    skillGaps: ["Kubernetes","System Design","GraphQL"],
    status: "complete",
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "2",
    filename: "resume_v2_updated.pdf",
    score: 65,
    improvementScore: 78,
    matchPercentage: 60,
    skills: ["React","JavaScript","CSS"],
    skillGaps: ["TypeScript","Testing","CI/CD","Docker"],
    status: "complete",
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

const connectedProviders = [
  {
    id: "google", label: "Google", connected: true,
    icon: () => (
      <svg viewBox="0 0 24 24" className="h-4 w-4">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
      </svg>
    ),
  },
  { id: "github", label: "GitHub", connected: false, icon: () => <Github className="h-4 w-4" /> },
  { id: "linkedin", label: "LinkedIn", connected: false, icon: () => <Linkedin className="h-4 w-4" /> },
];

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
  });
}

function getScoreColor(score: number) {
  if (score >= 80) return "text-success";
  if (score >= 60) return "text-warning";
  return "text-destructive";
}

// ─── Simple Progress Ring (no external dep issues) ────────────────────────────
function MiniRing({ value, color = "hsl(var(--primary))", size = 80 }: { value: number; color?: string; size?: number }) {
  const sw = 7;
  const r = (size - sw) / 2;
  const circ = r * 2 * Math.PI;
  const offset = circ - (value / 100) * circ;
  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="hsl(var(--border))" strokeWidth={sw} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={sw}
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          className="transition-all duration-700" />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-sm font-bold text-foreground">{value}%</span>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ProfilePage() {
  const { data: session, update } = useSession();

  // Basic edits
  const [editingName, setEditingName] = useState(false);
  const [editingPhone, setEditingPhone] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState(session?.user?.name || "");
  const [phone, setPhone] = useState("");

  // Career profile
  const [editingCareer, setEditingCareer] = useState(false);
  const [career, setCareer] = useState({
    targetCompany: "", yearsExperience: "", location: "",
    skills: [] as string[], skillInput: "",
  });
  const [savedCareer, setSavedCareer] = useState({
    targetCompany: "", yearsExperience: "", location: "", skills: [] as string[],
  });

  // Resume history
  const [resumes] = useState<ResumeAnalysis[]>(MOCK_RESUMES);
  const [selectedResume, setSelectedResume] = useState<ResumeAnalysis | null>(null);

  const getInitials = (n?: string | null) => {
    if (!n) return "U";
    return n.split(" ").map((s) => s[0]).join("").toUpperCase().slice(0, 2);
  };

  // ── Handlers ──────────────────────────────────────────────────────────────
  const saveName = async () => {
    setSaving(true);
    try {
      await new Promise((r) => setTimeout(r, 600));
      await update({ name });
      toast.success("Name updated!");
      setEditingName(false);
    } catch { toast.error("Failed to update name"); }
    finally { setSaving(false); }
  };

  const savePhone = async () => {
    setSaving(true);
    try {
      await new Promise((r) => setTimeout(r, 600));
      toast.success("Phone updated!");
      setEditingPhone(false);
    } catch { toast.error("Failed to update phone"); }
    finally { setSaving(false); }
  };

  const saveCareer = async () => {
    setSaving(true);
    try {
      await new Promise((r) => setTimeout(r, 600));
      setSavedCareer({
        targetCompany: career.targetCompany,
        yearsExperience: career.yearsExperience,
        location: career.location,
        skills: career.skills,
      });
      toast.success("Career profile updated!");
      setEditingCareer(false);
    } catch { toast.error("Failed to save"); }
    finally { setSaving(false); }
  };

  // ── Skill helpers ──────────────────────────────────────────────────────────
  const addSkill = (skill: string) => {
    const s = skill.trim();
    if (!s || career.skills.includes(s) || career.skills.length >= 15) return;
    setCareer((p) => ({ ...p, skills: [...p.skills, s], skillInput: "" }));
  };
  const removeSkill = (skill: string) =>
    setCareer((p) => ({ ...p, skills: p.skills.filter((s) => s !== skill) }));
  const filteredSuggestions = SKILL_SUGGESTIONS.filter((s) =>
    career.skillInput &&
    s.toLowerCase().includes(career.skillInput.toLowerCase()) &&
    !career.skills.includes(s)
  ).slice(0, 5);

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="fixed top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-6">
          <Link href="/dashboard" className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            <span className="font-bold text-foreground">CareerPilot</span>
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle iconOnly />
            <Link href="/dashboard">
              <Button variant="outline" size="sm" className="border-glass-border">← Dashboard</Button>
            </Link>
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-4xl px-6 pt-24 pb-16 space-y-6">

        {/* Profile Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            {/* Avatar */}
            <div className="relative group">
              <Avatar className="h-20 w-20 ring-2 ring-primary/20">
                <AvatarImage src={session?.user?.image ?? undefined} />
                <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
                  {getInitials(session?.user?.name)}
                </AvatarFallback>
              </Avatar>
              <button className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="h-5 w-5 text-white" />
              </button>
            </div>

            <div className="flex-1 min-w-0">
              {/* Name */}
              {editingName ? (
                <div className="flex items-center gap-2 mb-2">
                  <Input value={name} onChange={(e) => setName(e.target.value)}
                    className="bg-secondary border-none text-lg font-bold h-9 w-48" autoFocus />
                  <Button size="icon" className="h-8 w-8 bg-success/20 hover:bg-success/30 text-success border-none"
                    onClick={saveName} disabled={saving}><Check className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8"
                    onClick={() => { setName(session?.user?.name || ""); setEditingName(false); }}>
                    <X className="h-4 w-4" /></Button>
                </div>
              ) : (
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-xl font-bold text-foreground">{session?.user?.name || "User"}</h1>
                  <button onClick={() => setEditingName(true)} className="text-muted-foreground hover:text-foreground transition-colors">
                    <Edit3 className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}

              {/* Email */}
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-1">
                <Mail className="h-3.5 w-3.5" />{session?.user?.email}
              </div>

              {/* Phone */}
              {editingPhone ? (
                <div className="flex items-center gap-2 mb-2">
                  <Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210" className="bg-secondary border-none h-8 w-44 text-sm" autoFocus />
                  <Button size="icon" className="h-7 w-7 bg-success/20 hover:bg-success/30 text-success border-none"
                    onClick={savePhone} disabled={saving}><Check className="h-3.5 w-3.5" /></Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7"
                    onClick={() => setEditingPhone(false)}><X className="h-3.5 w-3.5" /></Button>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-3">
                  <Phone className="h-3.5 w-3.5" />
                  <span>{phone || "No phone number"}</span>
                  <button onClick={() => setEditingPhone(true)}
                    className="text-muted-foreground hover:text-primary transition-colors ml-1">
                    <Edit3 className="h-3 w-3" />
                  </button>
                </div>
              )}

              <div className="flex items-center gap-2">
                <Badge className="bg-primary/10 text-primary border-primary/20">Premium</Badge>
                <Badge variant="outline" className="border-success/30 text-success text-xs gap-1">
                  <Shield className="h-3 w-3" /> Verified
                </Badge>
              </div>
            </div>

            <Button variant="outline" size="sm"
              className="gap-2 border-destructive/30 text-destructive hover:bg-destructive/10 shrink-0"
              onClick={() => signOut({ callbackUrl: "/" })}>
              <LogOut className="h-4 w-4" /> Sign Out
            </Button>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="grid grid-cols-3 gap-4">
          {[
            { label: "Resume Score", value: resumes[0]?.score ? `${resumes[0].score}` : "—", icon: FileText, color: "text-primary" },
            { label: "Analyses Done", value: resumes.length.toString(), icon: TrendingUp, color: "text-success" },
            { label: "Mock Interviews", value: "3", icon: MessageSquare, color: "text-accent" },
          ].map((s) => (
            <div key={s.label} className="glass-card p-5 text-center">
              <div className={cn("mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-secondary", s.color)}>
                <s.icon className="h-5 w-5" />
              </div>
              <div className="text-2xl font-bold text-foreground">{s.value}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
            </div>
          ))}
        </motion.div>

        {/* ── TABS ─────────────────────────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Tabs defaultValue="profile" className="space-y-4">
            <TabsList className="bg-secondary w-full">
              <TabsTrigger value="profile" className="flex-1 gap-2">
                <User className="h-4 w-4" /> User Profile
              </TabsTrigger>
              <TabsTrigger value="history" className="flex-1 gap-2">
                <FileText className="h-4 w-4" /> Resume Analysis History
              </TabsTrigger>
            </TabsList>

            {/* ── TAB 1: USER PROFILE ──────────────────────────────────────── */}
            <TabsContent value="profile" className="space-y-4">

              {/* Account Details */}
              <div className="glass-card p-6 space-y-5">
                <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                  <User className="h-4 w-4 text-primary" /> Account Details
                </h2>
                <Separator className="bg-border" />
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <Label className="text-sm text-foreground">Email Address</Label>
                      <p className="text-sm text-muted-foreground mt-0.5">{session?.user?.email}</p>
                    </div>
                    <Badge variant="outline" className="text-xs border-success/30 text-success">Verified</Badge>
                  </div>
                  <Separator className="bg-border/50" />
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <Label className="text-sm text-foreground">Phone Number</Label>
                      <p className="text-sm text-muted-foreground mt-0.5 flex items-center gap-1.5">
                        <Phone className="h-3.5 w-3.5" />{phone || "Not set"}
                      </p>
                    </div>
                    <Button variant="ghost" size="sm" className="text-primary h-8 text-xs"
                      onClick={() => setEditingPhone(true)}>Edit</Button>
                  </div>
                  <Separator className="bg-border/50" />
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <Label className="text-sm text-foreground">Member Since</Label>
                      <p className="text-sm text-muted-foreground mt-0.5 flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" /> February 2026
                      </p>
                    </div>
                  </div>
                  <Separator className="bg-border/50" />
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <Label className="text-sm text-foreground">Password</Label>
                      <p className="text-sm text-muted-foreground mt-0.5">••••••••</p>
                    </div>
                    <Button variant="ghost" size="sm" className="text-primary h-8 text-xs">Change</Button>
                  </div>
                </div>
              </div>

              {/* Career Profile */}
              <div className="glass-card p-6 space-y-5">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-primary" /> Career Profile
                  </h2>
                  {!editingCareer ? (
                    <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-primary"
                      onClick={() => setEditingCareer(true)}>
                      <Edit3 className="h-3.5 w-3.5" /> Edit
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button size="sm" className="h-8 gap-1.5 text-xs" onClick={saveCareer} disabled={saving}>
                        <Check className="h-3.5 w-3.5" /> Save
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 text-xs"
                        onClick={() => setEditingCareer(false)}>Cancel</Button>
                    </div>
                  )}
                </div>
                <Separator className="bg-border" />

                <div className="space-y-4">
                  {/* Target Company */}
                  <div className="flex items-center justify-between py-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground w-36 shrink-0">
                      <Building2 className="h-4 w-4" /> Target Company
                    </div>
                    {editingCareer ? (
                      <Input value={career.targetCompany}
                        onChange={(e) => setCareer((p) => ({ ...p, targetCompany: e.target.value }))}
                        placeholder="e.g. Google, McKinsey..." className="bg-secondary border-none h-8 text-sm flex-1 ml-4" />
                    ) : (
                      <span className="text-sm font-medium text-foreground">
                        {savedCareer.targetCompany || <span className="text-muted-foreground italic">Not set</span>}
                      </span>
                    )}
                  </div>
                  <Separator className="bg-border/50" />

                  {/* Experience */}
                  <div className="flex items-start justify-between py-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground w-36 shrink-0">
                      <Briefcase className="h-4 w-4" /> Experience
                    </div>
                    {editingCareer ? (
                      <div className="flex flex-wrap gap-1.5 flex-1 ml-4">
                        {EXP_OPTIONS.map((opt) => (
                          <button key={opt} onClick={() => setCareer((p) => ({ ...p, yearsExperience: opt }))}
                            className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium border transition-all",
                              career.yearsExperience === opt
                                ? "bg-primary/10 border-primary/50 text-primary"
                                : "border-glass-border text-muted-foreground hover:border-primary/30")}>
                            {opt}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <span className="text-sm font-medium text-foreground">
                        {savedCareer.yearsExperience || <span className="text-muted-foreground italic">Not set</span>}
                      </span>
                    )}
                  </div>
                  <Separator className="bg-border/50" />

                  {/* Location */}
                  <div className="flex items-center justify-between py-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground w-36 shrink-0">
                      <MapPin className="h-4 w-4" /> Location
                    </div>
                    {editingCareer ? (
                      <Input value={career.location}
                        onChange={(e) => setCareer((p) => ({ ...p, location: e.target.value }))}
                        placeholder="e.g. Kolkata, India" className="bg-secondary border-none h-8 text-sm flex-1 ml-4" />
                    ) : (
                      <span className="text-sm font-medium text-foreground">
                        {savedCareer.location || <span className="text-muted-foreground italic">Not set</span>}
                      </span>
                    )}
                  </div>
                  <Separator className="bg-border/50" />

                  {/* Skills */}
                  <div className="py-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                      <Star className="h-4 w-4" /> Skills
                    </div>
                    {editingCareer ? (
                      <div className="space-y-2">
                        <div className="relative">
                          <Input value={career.skillInput}
                            onChange={(e) => setCareer((p) => ({ ...p, skillInput: e.target.value }))}
                            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSkill(career.skillInput); } }}
                            placeholder="Type a skill and press Enter..."
                            className="bg-secondary border-none text-sm pr-10" />
                          <button onClick={() => addSkill(career.skillInput)}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary">
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                        {filteredSuggestions.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {filteredSuggestions.map((s) => (
                              <button key={s} onClick={() => addSkill(s)}
                                className="rounded-full border border-dashed border-glass-border px-2.5 py-0.5 text-xs text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors">
                                + {s}
                              </button>
                            ))}
                          </div>
                        )}
                        <div className="flex flex-wrap gap-1.5">
                          {career.skills.map((s) => (
                            <Badge key={s} className="bg-primary/10 text-primary border-primary/20 gap-1 pr-1 cursor-pointer hover:bg-destructive/10 hover:text-destructive transition-colors"
                              onClick={() => removeSkill(s)}>
                              {s} <X className="h-3 w-3" />
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {savedCareer.skills.length > 0
                          ? savedCareer.skills.map((s) => (
                              <Badge key={s} className="bg-primary/10 text-primary border-primary/20">{s}</Badge>
                            ))
                          : <span className="text-sm text-muted-foreground italic">No skills added yet</span>}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Connected Accounts */}
              <div className="glass-card p-6 space-y-5">
                <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                  <Shield className="h-4 w-4 text-primary" /> Connected Accounts
                </h2>
                <Separator className="bg-border" />
                <div className="space-y-3">
                  {connectedProviders.map((p) => (
                    <div key={p.id} className="flex items-center justify-between rounded-xl bg-secondary/50 px-4 py-3">
                      <div className="flex items-center gap-3">
                        <p.icon />
                        <span className="text-sm font-medium text-foreground">{p.label}</span>
                      </div>
                      {p.connected
                        ? <Badge className="bg-success/10 text-success border-success/20 text-xs">Connected</Badge>
                        : <Button variant="outline" size="sm" className="h-7 text-xs border-glass-border hover:border-primary/30">Connect</Button>}
                    </div>
                  ))}
                </div>
              </div>

              {/* Danger Zone */}
              <div className="glass-card p-6 border-destructive/20 space-y-4">
                <h2 className="text-base font-semibold text-destructive">Danger Zone</h2>
                <Separator className="bg-destructive/20" />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">Delete Account</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Permanently delete your account and all data</p>
                  </div>
                  <Button variant="outline" size="sm" className="border-destructive/30 text-destructive hover:bg-destructive/10"
                    onClick={() => toast.error("Contact support to delete your account")}>Delete</Button>
                </div>
              </div>
            </TabsContent>

            {/* ── TAB 2: RESUME HISTORY ────────────────────────────────────── */}
            <TabsContent value="history" className="space-y-4">
              <AnimatePresence mode="wait">
                {selectedResume ? (
                  /* Detail view */
                  <motion.div key="detail" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                    <button onClick={() => setSelectedResume(null)}
                      className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
                      ← Back to history
                    </button>
                    <div className="glass-card p-6 space-y-6">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-foreground">{selectedResume.filename}</h3>
                          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5" />{formatDate(selectedResume.createdAt)}
                          </p>
                        </div>
                        <Badge className={cn("text-xs", selectedResume.status === "complete"
                          ? "bg-success/10 text-success border-success/20"
                          : "bg-warning/10 text-warning border-warning/20")}>
                          {selectedResume.status}
                        </Badge>
                      </div>

                      {/* Score rings */}
                      <div className="grid grid-cols-3 gap-4">
                        {[
                          { label: "Resume Score", value: selectedResume.score || 0, color: "hsl(var(--primary))" },
                          { label: "Improvement", value: selectedResume.improvementScore || 0, color: "hsl(var(--accent))" },
                          { label: "Role Match", value: selectedResume.matchPercentage || 0, color: "hsl(var(--success))" },
                        ].map((m) => (
                          <div key={m.label} className="flex flex-col items-center glass-card p-4">
                            <MiniRing value={m.value} color={m.color} />
                            <p className="text-xs text-muted-foreground mt-2 text-center">{m.label}</p>
                          </div>
                        ))}
                      </div>

                      {selectedResume.skills && selectedResume.skills.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-2">Detected Skills</p>
                          <div className="flex flex-wrap gap-1.5">
                            {selectedResume.skills.map((s) => (
                              <Badge key={s} className="bg-success/10 text-success border-success/20 text-xs">{s}</Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {selectedResume.skillGaps && selectedResume.skillGaps.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-2">Skill Gaps</p>
                          <div className="flex flex-wrap gap-1.5">
                            {selectedResume.skillGaps.map((s) => (
                              <Badge key={s} className="bg-destructive/10 text-destructive border-destructive/20 text-xs">{s}</Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ) : (
                  /* List view */
                  <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">
                        {resumes.length} analysis{resumes.length !== 1 ? "es" : ""} found
                      </p>
                      <Link href="/upload">
                        <Button size="sm" variant="outline" className="gap-1.5 border-glass-border text-xs">
                          + New Analysis
                        </Button>
                      </Link>
                    </div>

                    {resumes.map((resume, i) => (
                      <motion.div key={resume.id}
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                        className="glass-card-hover p-5 cursor-pointer" onClick={() => setSelectedResume(resume)}>
                        <div className="flex items-center gap-4">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                            <FileText className="h-5 w-5 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{resume.filename}</p>
                            <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
                              <Clock className="h-3 w-3" />{formatDate(resume.createdAt)}
                            </p>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            {resume.score !== undefined ? (
                              <div className="text-right">
                                <div className={cn("text-lg font-bold", getScoreColor(resume.score))}>{resume.score}</div>
                                <div className="text-xs text-muted-foreground">/ 100</div>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1 text-xs text-warning">
                                <AlertCircle className="h-3.5 w-3.5" /> Pending
                              </div>
                            )}
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
}