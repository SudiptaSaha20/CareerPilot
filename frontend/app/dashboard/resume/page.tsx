"use client";

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { ProgressRing } from '@/components/ProgressRing';
import { SkillTag } from '@/components/SkillTag';
import { ScoreBar } from '@/components/ScoreBar';
import { CardSkeleton } from '@/components/LoaderSkeleton';
import { mockResumeData, mockIndustryComparison, simulateDelay } from '@/lib/mock-data';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

export default function ResumeAnalyzer() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    simulateDelay(1500).then(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-6 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <CardSkeleton /> <CardSkeleton />
        </div>
      </div>
    );
  }

  const d = mockResumeData;

  return (
    <div className="space-y-6">
      {/* Top Stats */}
      <div className="grid gap-6 md:grid-cols-3">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card flex flex-col items-center p-8">
          <ProgressRing value={d.score} size={140} strokeWidth={10} label="Resume" />
          <p className="mt-3 text-sm font-medium text-muted-foreground">Resume Score</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card flex flex-col items-center p-8">
          <ProgressRing value={d.improvementScore} size={140} strokeWidth={10} label="Potential" color="hsl(var(--accent))" />
          <p className="mt-3 text-sm font-medium text-muted-foreground">Improvement Potential</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card flex flex-col items-center p-8">
          <ProgressRing value={d.matchPercentage} size={140} strokeWidth={10} label="Match" color="hsl(var(--success))" />
          <p className="mt-3 text-sm font-medium text-muted-foreground">Role Match</p>
        </motion.div>
      </div>

      {/* Two Column */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left - Breakdown */}
        <div className="space-y-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card p-6">
            <h3 className="mb-4 text-sm font-medium text-muted-foreground">Skills</h3>
            <div className="flex flex-wrap gap-2">
              {d.skills.map(s => <SkillTag key={s} label={s} variant="strength" />)}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass-card p-6">
            <h3 className="mb-4 text-sm font-medium text-muted-foreground">Experience</h3>
            <div className="space-y-3">
              {d.experience.map(e => (
                <div key={e.company} className="flex items-center justify-between rounded-xl bg-secondary/50 px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">{e.title}</p>
                    <p className="text-xs text-muted-foreground">{e.company}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">{e.years}y</span>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }} className="glass-card p-6">
            <h3 className="mb-3 text-sm font-medium text-muted-foreground">Strengths</h3>
            <ul className="space-y-2">
              {d.strengths.map(s => (
                <li key={s} className="flex items-center gap-2 text-sm text-foreground">
                  <span className="h-1.5 w-1.5 rounded-full bg-success" />
                  {s}
                </li>
              ))}
            </ul>
          </motion.div>
        </div>

        {/* Right */}
        <div className="space-y-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card p-6">
            <h3 className="mb-4 text-sm font-medium text-muted-foreground">Skill Gaps</h3>
            <div className="flex flex-wrap gap-2">
              {d.skillGaps.map(s => <SkillTag key={s} label={s} variant="gap" />)}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass-card p-6">
            <h3 className="mb-4 text-sm font-medium text-muted-foreground">Industry Comparison</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={mockIndustryComparison}>
                <XAxis dataKey="skill" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '0.75rem', color: 'hsl(var(--foreground))' }} />
                <Bar dataKey="you" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="industry" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-3 flex items-center justify-center gap-6 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-primary" /> You</span>
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-accent" /> Industry Avg</span>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="glass-card p-6">
            <h3 className="mb-4 text-sm font-medium text-muted-foreground">Suggested Improvements</h3>
            <Accordion type="single" collapsible className="space-y-2">
              {d.suggestions.map((s, i) => (
                <AccordionItem key={i} value={`item-${i}`} className="rounded-xl border-none bg-secondary/50">
                  <AccordionTrigger className="px-4 py-3 text-sm font-medium text-foreground hover:no-underline">
                    {s.title}
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-3 text-sm text-muted-foreground">
                    {s.description}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
