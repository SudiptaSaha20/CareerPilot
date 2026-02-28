"use client";

import { motion } from 'framer-motion';
import { Download, FileText, Target, MessageSquare, TrendingUp, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProgressRing } from '@/components/ProgressRing';
import { SkillTag } from '@/components/SkillTag';
import { ScoreBar } from '@/components/ScoreBar';
import { mockResumeData, mockInterviewFeedback, mockMarketRoles } from '@/lib/mock-data';
import { toast } from 'sonner';

export default function ReportPage() {
  

  const handleDownload = () => {
    toast.success('Report Downloaded', {
      description: 'Your career report has been saved as PDF.',
    });
  };

  const sections = [
    {
      icon: FileText,
      title: 'Resume Analysis',
      content: (
        <div className="space-y-4">
          <div className="flex items-center gap-6">
            <ProgressRing value={mockResumeData.score} size={100} strokeWidth={8} />
            <div className="space-y-1">
              <p className="text-sm text-foreground">Your resume scores <strong>{mockResumeData.score}/100</strong></p>
              <p className="text-xs text-muted-foreground">Above average for your target roles</p>
            </div>
          </div>
          <div>
            <p className="mb-2 text-xs font-medium text-muted-foreground">Top Skills</p>
            <div className="flex flex-wrap gap-1.5">
              {mockResumeData.skills.slice(0, 5).map(s => <SkillTag key={s} label={s} variant="strength" />)}
            </div>
          </div>
        </div>
      ),
    },
    {
      icon: Target,
      title: 'Skill Gaps',
      content: (
        <div>
          <p className="mb-3 text-sm text-muted-foreground">Key areas to improve for senior-level positions:</p>
          <div className="flex flex-wrap gap-1.5">
            {mockResumeData.skillGaps.map(s => <SkillTag key={s} label={s} variant="gap" />)}
          </div>
        </div>
      ),
    },
    {
      icon: MessageSquare,
      title: 'Interview Readiness',
      content: (
        <div className="space-y-4">
          <ScoreBar label="Communication" value={mockInterviewFeedback.communication} />
          <ScoreBar label="Technical" value={mockInterviewFeedback.technical} />
          <ScoreBar label="Confidence" value={mockInterviewFeedback.confidence} />
          <ScoreBar label="Overall" value={mockInterviewFeedback.overall} />
        </div>
      ),
    },
    {
      icon: TrendingUp,
      title: 'Market Insights',
      content: (
        <div className="space-y-3">
          {mockMarketRoles.slice(0, 3).map(r => (
            <div key={r.id} className="flex items-center justify-between rounded-xl bg-secondary/50 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-foreground">{r.title}</p>
                <p className="text-xs text-muted-foreground">{r.salaryRange}</p>
              </div>
              <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                {r.matchPercentage}%
              </span>
            </div>
          ))}
        </div>
      ),
    },
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Career Report</h2>
          <p className="text-sm text-muted-foreground">Generated on Feb 28, 2026</p>
        </div>
        <Button onClick={handleDownload} className="gap-2">
          <Download className="h-4 w-4" /> Download PDF
        </Button>
      </motion.div>

      {sections.map((s, i) => (
        <motion.div
          key={s.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
          className="glass-card p-6"
        >
          <div className="mb-4 flex items-center gap-3">
            <div className="rounded-xl bg-primary/10 p-2">
              <s.icon className="h-4 w-4 text-primary" />
            </div>
            <h3 className="text-base font-semibold text-foreground">{s.title}</h3>
          </div>
          {s.content}
        </motion.div>
      ))}

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="glass-card flex items-center gap-3 p-4"
      >
        <CheckCircle className="h-5 w-5 text-success" />
        <p className="text-sm text-muted-foreground">Report preview complete. Download to save as PDF.</p>
      </motion.div>
    </div>
  );
}
