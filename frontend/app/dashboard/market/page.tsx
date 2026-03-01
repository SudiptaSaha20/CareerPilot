"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import {
  TrendingUp, TrendingDown, Minus, Search,
  AlertCircle, ChevronDown, ChevronUp, BookOpen,
  Briefcase, Zap, Target, AlertTriangle, FileText,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { CardSkeleton } from "@/components/LoaderSkeleton";
import { SkillTag } from "@/components/SkillTag";
import { cn } from "@/lib/utils";
import { useResume } from "@/context/ResumeContext";
import Link from "next/link";

// ── Types ─────────────────────────────────────────────────────────────────────

interface SkillDemand {
  skill: string; demand_score: number;
  trend: "rising" | "stable" | "declining";
  level: "high" | "medium" | "low";
  market_comment: string;
}
interface TrendingSkill  { skill: string; demand_score: number; why_trending: string; }
interface SkillGap       { skill: string; demand_score: number; why_needed: string; }
interface JobMatch       { title: string; match_pct: number; required_skills: string[]; missing_skills: string[]; avg_salary_usd: string; }
interface LearningItem   { skill: string; priority: "high" | "medium" | "low"; estimated_time: string; resource: string; }
interface AnalysisResult {
  skills: string[]; skill_demand: SkillDemand[]; trending_skills: TrendingSkill[];
  skill_gaps: SkillGap[]; job_matches: JobMatch[];
  learning_path: LearningItem[]; market_summary: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function scoreColor(v: number) {
  return v >= 75 ? "text-success" : v >= 50 ? "text-warning" : "text-destructive";
}
function levelBadgeClass(level: "high" | "medium" | "low") {
  if (level === "high")   return "bg-success/10 text-success border border-success/20";
  if (level === "medium") return "bg-warning/10 text-warning border border-warning/20";
  return "bg-destructive/10 text-destructive border border-destructive/20";
}
function priorityBadgeClass(p: "high" | "medium" | "low") {
  if (p === "high")   return "bg-success/10 text-success border border-success/20";
  if (p === "medium") return "bg-warning/10 text-warning border border-warning/20";
  return "bg-secondary text-muted-foreground border border-border";
}
function TrendIcon({ trend }: { trend: string }) {
  if (trend === "rising")    return <TrendingUp   className="h-3.5 w-3.5 text-success" />;
  if (trend === "declining") return <TrendingDown className="h-3.5 w-3.5 text-destructive" />;
  return <Minus className="h-3.5 w-3.5 text-muted-foreground" />;
}

const TOOLTIP_STYLE = {
  backgroundColor: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: "0.75rem",
  color: "hsl(var(--foreground))",
  fontSize: "12px",
};
const TICK = { fill: "hsl(var(--muted-foreground))", fontSize: 11 };


// ── Horizontal bar with Y-axis labels clearly visible on the left ─────────────
function HBar({ data, getColor, tooltipLabel }: {
  data: { name: string; score: number }[];
  getColor?: (i: number) => string;
  tooltipLabel: string;
}) {
  const rowH = 44;
  const height = Math.max(data.length * rowH + 24, 180);
  // Compute label width dynamically: longest name * ~7px per char, capped at 160
  const labelW = Math.min(Math.max(...data.map(d => d.name.length)) * 7 + 8, 160);
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 4, right: 32, bottom: 4, left: 4 }}
        barCategoryGap="25%"
      >
        <XAxis
          type="number"
          domain={[0, 100]}
          tick={TICK}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          type="category"
          dataKey="name"
          width={labelW}
          tick={{ fill: "hsl(var(--foreground))", fontSize: 12, fontFamily: "monospace", fontWeight: 500 }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number) => [`${v}/100`, tooltipLabel]} />
        <Bar dataKey="score" radius={[0, 6, 6, 0]}>
          {data.map((_, i) => (
            <Cell key={i} fill={getColor ? getColor(i) : `hsla(${160 - i * 12}, 68%, ${52 + i * 1.5}%, 0.85)`} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// ── Vertical bar with rotated truncated labels ────────────────────────────────
function VBar({ data, getColor, tooltipLabel }: {
  data: { name: string; score: number; [k: string]: unknown }[];
  getColor?: (d: { name: string; score: number; [k: string]: unknown }) => string;
  tooltipLabel: string;
}) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 4, right: 4, bottom: 52, left: 0 }}>
        <XAxis
          dataKey="name"
          interval={0}
          tickLine={false}
          axisLine={false}
          tick={(props) => {
            const { x, y, payload } = props;
            return (
              <g transform={`translate(${x},${y})`}>
                <text x={0} y={0} dy={12} textAnchor="end" transform="rotate(-35)"
                  fill="hsl(var(--muted-foreground))" fontSize={11}>
                  {(payload.value as string).length > 11 ? (payload.value as string).slice(0, 10) + "…" : payload.value}
                </text>
              </g>
            );
          }}
        />
        <YAxis tick={TICK} domain={[0, 100]} tickLine={false} axisLine={false} />
        <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number) => [`${v}/100`, tooltipLabel]} />
        <Bar dataKey="score" radius={[6, 6, 0, 0]}>
          {data.map((d, i) => (
            <Cell key={i} fill={getColor ? getColor(d) : "hsl(var(--primary))"} fillOpacity={0.85} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// ── Reusable UI pieces ────────────────────────────────────────────────────────
function MetricCard({ icon, label, value, colorClass, delay = 0 }: {
  icon: React.ReactNode; label: string; value: string | number; colorClass: string; delay?: number;
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}
      className="glass-card p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground">{label}</span>
        <div className="rounded-xl bg-primary/10 p-2">{icon}</div>
      </div>
      <div className={cn("text-3xl font-bold font-mono", colorClass)}>{value}</div>
    </motion.div>
  );
}

function Section({ title, icon, children, delay = 0 }: {
  title: string; icon: React.ReactNode; children: React.ReactNode; delay?: number;
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}
      className="glass-card p-6 space-y-5">
      <div className="flex items-center gap-2.5">
        <div className="rounded-xl bg-primary/10 p-2">{icon}</div>
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
      </div>
      {children}
    </motion.div>
  );
}

function JobCard({ job, index }: { job: JobMatch; index: number }) {
  const [open, setOpen] = useState(index === 0);
  return (
    <div className={cn("rounded-2xl border transition-colors",
      open ? "border-primary/30 bg-primary/5" : "border-border bg-secondary/30 hover:border-border/70")}>
      <button onClick={() => setOpen(!open)} className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left">
        <div className="flex items-center gap-3 min-w-0">
          <span className={cn("text-lg font-bold font-mono shrink-0", scoreColor(job.match_pct))}>{job.match_pct}%</span>
          <span className="font-semibold text-sm text-foreground truncate">{job.title}</span>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-xs text-muted-foreground hidden sm:block">${job.avg_salary_usd}</span>
          {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </div>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
            <div className="border-t border-border px-5 py-4 space-y-4">
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2 font-medium">Required Skills</p>
                <div className="flex flex-wrap gap-1.5">
                  {job.required_skills.map(s => <SkillTag key={s} label={s} variant="strength" />)}
                </div>
              </div>
              {job.missing_skills.length > 0 && (
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2 font-medium">Missing Skills</p>
                  <div className="flex flex-wrap gap-1.5">
                    {job.missing_skills.map(s => <SkillTag key={s} label={s} variant="gap" />)}
                  </div>
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                <span className="text-success font-medium">Salary:</span> ${job.avg_salary_usd}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function MarketAnalyzer() {
  const { resumeFile } = useResume();
  const [status, setStatus]   = useState("");
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData]       = useState<AnalysisResult | null>(null);

  // On mount: load last saved market analysis from DB (works after page refresh)
  useEffect(() => {
    fetch("/api/resume/market/analyze")
      .then(r => r.json())
      .then(res => { if (res.analysis) setData(res.analysis as AnalysisResult); })
      .catch(() => {});
  }, []);

  async function runAnalysis() {
    if (!resumeFile) return;
    setError(""); setData(null); setLoading(true);
    setStatus("Analysing your resume…");
    const form = new FormData();
    form.append("resume", resumeFile);
    try {
      // Route through Next.js API so result is saved to MongoDB
      const res  = await fetch("/api/resume/market/analyze", { method: "POST", body: form });
      const json = await res.json();
      if (!res.ok) throw new Error(json.detail || json.error || "Analysis failed.");
      setStatus("");
      setData(json);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setStatus("");
    } finally {
      setLoading(false);
    }
  }

  const highDemand = data?.skill_demand.filter(s => s.level === "high").length ?? 0;
  const avgMatch   = data?.job_matches.length
    ? Math.round(data.job_matches.reduce((a, j) => a + j.match_pct, 0) / data.job_matches.length) : 0;

  const demandData   = [...(data?.skill_demand   ?? [])].sort((a,b)=>b.demand_score-a.demand_score).map(s=>({name:s.skill,score:s.demand_score,level:s.level}));
  const trendingData = [...(data?.trending_skills ?? [])].sort((a,b)=>b.demand_score-a.demand_score).map(s=>({name:s.skill,score:s.demand_score}));
  const gapData      = [...(data?.skill_gaps      ?? [])].sort((a,b)=>b.demand_score-a.demand_score).map(s=>({name:s.skill,score:s.demand_score}));
  const jobData      = [...(data?.job_matches     ?? [])].sort((a,b)=>b.match_pct-a.match_pct).slice(0,8).map(j=>({name:j.title,score:j.match_pct}));

  // No resume yet
  if (!resumeFile) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="glass-card flex flex-col items-center justify-center gap-6 p-16 text-center">
        <div className="rounded-2xl bg-primary/10 p-5">
          <FileText className="h-10 w-10 text-primary" />
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-foreground">No resume uploaded yet</h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            Upload your resume first and we&apos;ll use it to analyse your market position.
          </p>
        </div>
        <Link href="/upload">
          <Button size="lg" className="gap-2">
            <FileText className="h-4 w-4" /> Upload Resume
          </Button>
        </Link>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6 pb-10">

      {/* Trigger card */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-primary/10 p-2.5">
            <TrendingUp className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0">
            <h3 className="text-base font-semibold text-foreground">Market Trend Analyzer</h3>
            <p className="text-sm text-muted-foreground truncate">
              Using: <span className="text-primary font-medium">{resumeFile.name}</span>
            </p>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2.5 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" /> {error}
          </div>
        )}
        {status && (
          <div className="flex items-center gap-2.5 rounded-xl border border-border bg-secondary/50 px-4 py-3 text-sm text-muted-foreground font-mono">
            <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-primary" />
            {status}
          </div>
        )}

        <Button onClick={runAnalysis} disabled={loading} className="w-full gap-2" size="lg">
          {loading
            ? <><span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />Analysing…</>
            : <><Search className="h-4 w-4" />Analyse Market</>
          }
        </Button>
      </motion.div>

      {/* Skeletons */}
      {loading && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{Array.from({length:4}).map((_,i)=><CardSkeleton key={i}/>)}</div>
          <div className="grid gap-6 lg:grid-cols-2"><CardSkeleton/><CardSkeleton/></div>
        </div>
      )}

      {/* Results */}
      {data && !loading && (
        <div className="space-y-6">

          {/* Summary banner */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border-l-4 border-primary bg-primary/5 px-5 py-4 text-sm text-foreground leading-relaxed">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-1.5">AI Market Assessment</p>
            {data.market_summary}
          </motion.div>

          {/* Metrics */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard icon={<Zap className="h-4 w-4 text-primary"/>} label="Skills Detected" value={data.skills.length} colorClass="text-primary" delay={0}/>
            <MetricCard icon={<TrendingUp className="h-4 w-4 text-primary"/>} label="High Demand" value={highDemand} colorClass={highDemand>=5?"text-success":highDemand>=3?"text-warning":"text-destructive"} delay={0.05}/>
            <MetricCard icon={<Target className="h-4 w-4 text-primary"/>} label="Avg Job Match" value={`${avgMatch}%`} colorClass={avgMatch>=75?"text-success":avgMatch>=50?"text-warning":"text-destructive"} delay={0.1}/>
            <MetricCard icon={<AlertTriangle className="h-4 w-4 text-primary"/>} label="Skill Gaps" value={data.skill_gaps.length} colorClass={data.skill_gaps.length>5?"text-destructive":"text-warning"} delay={0.15}/>
          </div>

          {/* Skill demand + Trending */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Section title="Your Skills vs Market Demand" icon={<Search className="h-4 w-4 text-primary"/>} delay={0.2}>
              <VBar
                data={demandData}
                tooltipLabel="Demand"
                getColor={(d) =>
                  (d as {name:string; score:number; level:string}).level === "high"   ? "hsl(var(--success))" :
                  (d as {name:string; score:number; level:string}).level === "medium" ? "hsl(var(--warning))" :
                  "hsl(var(--destructive))"
                }
              />
              {/* Pill legend */}
              <div className="grid grid-cols-3 gap-4 pt-1">
                {(["high","medium","low"] as const).map(lvl=>(
                  <div key={lvl}>
                    <p className={cn("text-xs font-semibold mb-2", lvl==="high"?"text-success":lvl==="medium"?"text-warning":"text-destructive")}>
                      {lvl==="high"?"🔥":lvl==="medium"?"⚡":"❄️"} {lvl.charAt(0).toUpperCase()+lvl.slice(1)}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {data.skill_demand.filter(s=>s.level===lvl).map(s=>(
                        <span key={s.skill} className={cn("rounded-full border px-2 py-0.5 text-xs font-medium",levelBadgeClass(lvl))}>{s.skill}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              {/* Insight rows */}
              <div className="space-y-2 pt-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Skill Insights</p>
                {[...data.skill_demand].sort((a,b)=>b.demand_score-a.demand_score).slice(0,5).map(s=>(
                  <div key={s.skill} className="flex items-start gap-3 rounded-xl bg-secondary/40 px-4 py-3">
                    <span className="font-mono text-xs text-success min-w-[90px] font-semibold shrink-0">{s.skill}</span>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground min-w-[72px] shrink-0">
                      <TrendIcon trend={s.trend}/>{s.trend.charAt(0).toUpperCase()+s.trend.slice(1)}
                    </span>
                    <span className="text-xs text-muted-foreground leading-relaxed">{s.market_comment}</span>
                  </div>
                ))}
              </div>
            </Section>

            {/* Trending */}
            <Section title="Top Trending Skills 2024–2025" icon={<TrendingUp className="h-4 w-4 text-primary"/>} delay={0.25}>
              <HBar data={trendingData} tooltipLabel="Demand"/>
              <div className="space-y-2 pt-1">
                {data.trending_skills.slice(0,4).map(s=>(
                  <div key={s.skill} className="flex items-start gap-3 rounded-xl bg-secondary/40 px-4 py-2.5">
                    <span className="font-mono text-xs text-primary min-w-[90px] font-semibold shrink-0">{s.skill}</span>
                    <span className="text-xs text-muted-foreground leading-relaxed">{s.why_trending}</span>
                  </div>
                ))}
              </div>
            </Section>
          </div>

          {/* Skill gaps */}
          <Section title="Critical Skill Gaps" icon={<AlertTriangle className="h-4 w-4 text-primary"/>} delay={0.3}>
            {data.skill_gaps.length===0
              ? <p className="text-sm text-success font-medium">🎉 No critical skill gaps found!</p>
              : <div className="grid gap-6 lg:grid-cols-2">
                  <HBar data={gapData} getColor={()=>"hsl(var(--destructive))"} tooltipLabel="Demand"/>
                  <div className="space-y-2.5">
                    {data.skill_gaps.map(g=>(
                      <div key={g.skill} className="flex items-start gap-3 rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3">
                        <span className="font-mono text-xs text-destructive font-semibold min-w-[110px] shrink-0">{g.skill}</span>
                        <span className="text-xs text-muted-foreground leading-relaxed">{g.why_needed}</span>
                      </div>
                    ))}
                  </div>
                </div>
            }
          </Section>

          {/* Job matches */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Section title="Best Matching Job Roles" icon={<Briefcase className="h-4 w-4 text-primary"/>} delay={0.35}>
              <HBar data={jobData} tooltipLabel="Match %"/>
            </Section>
            <Section title="Job Details" icon={<Briefcase className="h-4 w-4 text-primary"/>} delay={0.4}>
              <div className="space-y-2.5 max-h-[480px] overflow-y-auto pr-1">
                {[...data.job_matches].sort((a,b)=>b.match_pct-a.match_pct).map((job,i)=>(
                  <JobCard key={job.title} job={job} index={i}/>
                ))}
              </div>
            </Section>
          </div>

          {/* Learning path */}
          <Section title="Prioritised Learning Path" icon={<BookOpen className="h-4 w-4 text-primary"/>} delay={0.5}>
            <p className="text-sm text-muted-foreground -mt-2">Skills to learn for maximum career impact</p>
            <div className="grid gap-4 sm:grid-cols-2">
              {data.learning_path.map(item=>(
                <div key={item.skill} className="rounded-2xl border border-border bg-secondary/30 p-4 space-y-3 hover:border-primary/30 transition-colors">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-sm font-bold text-foreground uppercase tracking-wide">{item.skill}</span>
                    <span className={cn("rounded-full border px-2.5 py-0.5 text-xs font-semibold",priorityBadgeClass(item.priority))}>
                      {item.priority.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">📚 {item.resource}</p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>⏱ {item.estimated_time}</span>
                  </div>
                </div>
              ))}
            </div>
          </Section>

          {/* All detected skills */}
          <Section title="All Detected Skills" icon={<Zap className="h-4 w-4 text-primary"/>} delay={0.55}>
            <div className="flex flex-wrap gap-2">
              {data.skills.map(s=><SkillTag key={s} label={s}/>)}
            </div>
          </Section>

        </div>
      )}
    </div>
  );
}