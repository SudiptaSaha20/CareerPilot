"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FileText, Target, TrendingUp, Zap, AlertCircle } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { DashboardCard } from "@/components/DashboardCard";
import { ProgressRing } from "@/components/ProgressRing";
import { AnimatedCounter } from "@/components/AnimatedCounter";
import { CardSkeleton } from "@/components/LoaderSkeleton";
import { mockMarketTrends, mockMarketRoles } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Button } from "@/components/ui/button";

// ── Types ──────────────────────────────────────────────────────────────────────
interface ResumeRow {
  id:             string;
  filename:       string;
  jobDescription: string | null;
  semanticScore:  number | null;
  atsScore:       number | null;
  keywordDensity: number | null;
  resumeSkills:   string[];
  jdSkills:       string[];
  missingSkills:  string[];
  createdAt:      string;
}

// ── Helpers ────────────────────────────────────────────────────────────────────
function scoreColor(v: number) {
  return v >= 70 ? "bg-success" : v >= 40 ? "bg-warning" : "bg-destructive";
}

function Pill({ label, variant }: { label: string; variant: "green" | "blue" | "red" }) {
  const styles = {
    green: "bg-success/10 border-success/30 text-success",
    blue:  "bg-primary/10 border-primary/30 text-primary",
    red:   "bg-destructive/10 border-destructive/30 text-destructive",
  };
  return (
    <span className={cn(
      "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-mono font-medium",
      styles[variant]
    )}>
      {label}
    </span>
  );
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-mono font-bold text-foreground">{value.toFixed(1)}%</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-700", scoreColor(value))}
          style={{ width: `${Math.min(value, 100)}%` }}
        />
      </div>
    </div>
  );
}

// ── Component ──────────────────────────────────────────────────────────────────
export default function DashboardOverview() {
  const [loading, setLoading]         = useState(true);
  const [resume, setResume]           = useState<ResumeRow | null>(null);

  useEffect(() => {
    fetch("/api/resume/latest")
      .then(r => r.json())
      .then(data => {
        if (data.resume) setResume(data.resume);
      })
      .catch(() => { /* show demo */ })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
      </div>
    );
  }

  const hasData = !!resume;

  // Real values or sensible demo fallbacks
  const semScore = resume?.semanticScore  ?? 0;
  const atsScore = resume?.atsScore       ?? 0;
  const kwScore  = resume?.keywordDensity ?? 0;

  const resumeSkills  = resume?.resumeSkills  ?? [];
  const jdSkills      = resume?.jdSkills      ?? [];
  const missingSkills = resume?.missingSkills ?? [];

  return (
    <div className="space-y-6">

      {/* Demo banner */}
      {!hasData && (
        <div className="flex items-center justify-between rounded-xl border border-warning/20 bg-warning/5 px-4 py-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-warning shrink-0" />
            <p className="text-sm text-muted-foreground">
              No resume found — <span className="text-warning font-medium">upload yours</span> to see real insights
            </p>
          </div>
          <Link href="/upload">
            <Button size="sm" variant="outline" className="border-warning/30 text-warning hover:bg-warning/10 shrink-0">
              Upload Resume
            </Button>
          </Link>
        </div>
      )}

      {/* Resume source badge */}
      {hasData && (
        <div className="flex items-center gap-3 rounded-xl border border-success/20 bg-success/5 px-4 py-2.5">
          <FileText className="h-4 w-4 text-success shrink-0" />
          <p className="text-sm text-foreground truncate">
            <span className="font-medium">{resume.filename}</span>
            {resume.jobDescription && (
              <span className="text-muted-foreground"> · analysed against your JD</span>
            )}
          </p>
          <span className="ml-auto text-xs text-muted-foreground shrink-0">
            {new Date(resume.createdAt).toLocaleDateString()}
          </span>
        </div>
      )}

      {/* ── Stat cards ─────────────────────────────────────────────────── */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <DashboardCard
          title="Semantic Match"
          icon={FileText}
          subtitle={hasData ? "Resume vs JD content alignment" : "Upload resume to see"}
        >
          <div className="mt-3">
            <AnimatedCounter
              value={Math.round(semScore)}
              suffix="%"
              className="text-3xl font-bold text-foreground"
            />
          </div>
        </DashboardCard>

        <DashboardCard
          title="ATS Score"
          icon={Target}
          subtitle={hasData ? "Keyword match with job description" : "Upload resume to see"}
        >
          <div className="mt-3">
            <AnimatedCounter
              value={Math.round(atsScore)}
              suffix="%"
              className="text-3xl font-bold text-foreground"
            />
          </div>
        </DashboardCard>

        <DashboardCard
          title="Keyword Density"
          icon={TrendingUp}
          subtitle={hasData ? "JD keywords found in resume" : "Upload resume to see"}
        >
          <div className="mt-3">
            <AnimatedCounter
              value={Math.round(kwScore)}
              suffix="%"
              className="text-3xl font-bold text-foreground"
            />
          </div>
        </DashboardCard>
      </div>

      {/* ── Middle row ─────────────────────────────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-3">

        {/* Progress ring */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="glass-card flex flex-col items-center justify-center p-8 gap-3"
        >
          <ProgressRing
            value={hasData ? Math.round(semScore) : 0}
            size={160}
            strokeWidth={10}
            label="Semantic"
          />
          <p className="text-sm text-muted-foreground">Semantic Match Score</p>
          {hasData && (
            <Link href="/dashboard/resume" className="text-xs text-primary hover:underline">
              Full analysis →
            </Link>
          )}
        </motion.div>

        {/* Score bars */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className="glass-card p-6 space-y-4"
        >
          <h3 className="text-sm font-medium text-muted-foreground">Score Breakdown</h3>
          {hasData ? (
            <>
              <ScoreBar label="Semantic Match"  value={semScore} />
              <ScoreBar label="ATS Score"       value={atsScore} />
              <ScoreBar label="Keyword Density" value={kwScore}  />
              <div className="pt-1 border-t border-border">
                <p className="text-xs text-muted-foreground">
                  {missingSkills.length > 0
                    ? `${missingSkills.length} skill gap${missingSkills.length > 1 ? "s" : ""} detected`
                    : "✅ No skill gaps — great match!"}
                </p>
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground py-4 text-center">
              Upload a resume to see your scores
            </p>
          )}
        </motion.div>

        {/* Market trend */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="glass-card p-6"
        >
          <h3 className="mb-4 text-sm font-medium text-muted-foreground">Market Demand Trend</h3>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={mockMarketTrends}>
              <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "0.75rem", color: "hsl(var(--foreground))" }} />
              <Line type="monotone" dataKey="demand" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* ── Skills grid (only with real data) ──────────────────────────── */}
      {hasData && (
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { title: "✅ Your Skills",  skills: resumeSkills,  variant: "green" as const, max: 15 },
            { title: "🎯 JD Skills",    skills: jdSkills,      variant: "blue"  as const, max: 15 },
            { title: "❌ Skill Gaps",   skills: missingSkills, variant: "red"   as const, max: 15 },
          ].map(({ title, skills, variant, max }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 + i * 0.05 }}
              className="glass-card p-5 space-y-3"
            >
              <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
              <div className="flex flex-wrap gap-1.5">
                {skills.length > 0
                  ? skills.slice(0, max).map(s => <Pill key={s} label={s} variant={variant} />)
                  : variant === "red"
                    ? <p className="text-sm text-success font-medium">No gaps 🎉</p>
                    : <p className="text-xs text-muted-foreground">None detected</p>}
              </div>
              {skills.length > max && (
                <p className="text-xs text-muted-foreground">+{skills.length - max} more</p>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* ── Bottom row ─────────────────────────────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-2">

        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          className="glass-card p-6"
        >
          <h3 className="mb-4 text-sm font-medium text-muted-foreground">Suggested Roles</h3>
          <div className="space-y-3">
            {mockMarketRoles.slice(0, 4).map(role => (
              <div key={role.id} className="flex items-center justify-between rounded-xl bg-secondary/50 px-4 py-3">
                <span className="text-sm font-medium text-foreground">{role.title}</span>
                <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                  {role.matchPercentage}% match
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}
          className="glass-card p-6"
        >
          <h3 className="mb-4 text-sm font-medium text-muted-foreground">Quick Links</h3>
          <div className="space-y-3">
            {[
              {
                href:  "/dashboard/resume",
                label: "📊 Full ATS Analysis",
                desc:  hasData ? "Scores · Skill gaps · Learning roadmap" : "Upload resume first",
              },
              {
                href:  "/dashboard/market",
                label: "📈 Market Insights",
                desc:  "Salary · Demand trends · Job matches",
              },
              {
                href:  "/dashboard/interview",
                label: "💬 Mock Interview",
                desc:  "Practice with AI interviewer",
              },
              {
                href:  "/dashboard/report",
                label: "📄 Download Report",
                desc:  "Export full analysis as PDF",
              },
            ].map(link => (
              <Link key={link.href} href={link.href}>
                <div className="flex items-center justify-between rounded-xl bg-secondary/50 px-4 py-3 hover:bg-secondary transition-colors cursor-pointer">
                  <div>
                    <p className="text-sm font-medium text-foreground">{link.label}</p>
                    <p className="text-xs text-muted-foreground">{link.desc}</p>
                  </div>
                  <Zap className="h-4 w-4 text-muted-foreground shrink-0" />
                </div>
              </Link>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}