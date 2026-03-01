"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Download, FileText, Target, MessageSquare, TrendingUp, CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProgressRing } from '@/components/ProgressRing';
import { SkillTag } from '@/components/SkillTag';
import { ScoreBar } from '@/components/ScoreBar';
import { mockResumeData, mockInterviewFeedback, mockMarketRoles } from '@/lib/mock-data';

export default function ReportPage() {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

      const pageW = doc.internal.pageSize.getWidth();
      const pageH = doc.internal.pageSize.getHeight();
      const margin = 18;
      const contentW = pageW - margin * 2;
      let y = 0;

      const checkPageBreak = (neededH: number) => {
        if (y + neededH > pageH - 20) {
          doc.addPage();
          y = 20;
        }
      };

      const drawSectionHeader = (title: string, prefix: string) => {
        checkPageBreak(16);
        doc.setFillColor(99, 102, 241);
        doc.roundedRect(margin, y, contentW, 10, 2, 2, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text(`${prefix}  ${title}`, margin + 4, y + 6.8);
        y += 14;
        doc.setTextColor(30, 30, 40);
      };

      const drawScoreBar = (label: string, value: number) => {
        checkPageBreak(12);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(80, 80, 100);
        doc.text(label, margin, y + 4);
        doc.text(`${value}%`, margin + contentW - 10, y + 4, { align: 'right' });
        doc.setFillColor(230, 230, 245);
        doc.roundedRect(margin + 50, y, contentW - 60, 4, 1, 1, 'F');
        const barColor: [number,number,number] = value >= 80 ? [34, 197, 94] : value >= 60 ? [234, 179, 8] : [239, 68, 68];
        doc.setFillColor(...barColor);
        doc.roundedRect(margin + 50, y, (contentW - 60) * (value / 100), 4, 1, 1, 'F');
        y += 10;
      };

      const drawPill = (text: string, xPos: number, yPos: number, variant: 'green' | 'red' | 'blue'): number => {
        const pillW = doc.getTextWidth(text) + 6;
        const bgColors: Record<string, [number,number,number]> = { green: [220,252,231], red: [254,226,226], blue: [219,234,254] };
        const fgColors: Record<string, [number,number,number]> = { green: [22,101,52], red: [153,27,27], blue: [29,78,216] };
        doc.setFillColor(...bgColors[variant]);
        doc.roundedRect(xPos, yPos - 3.5, pillW, 5.5, 1.2, 1.2, 'F');
        doc.setTextColor(...fgColors[variant]);
        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'normal');
        doc.text(text, xPos + 3, yPos + 0.5);
        return pillW + 3;
      };

      const drawPillRow = (skills: string[], variant: 'green' | 'red' | 'blue') => {
        let xCursor = margin;
        for (const skill of skills) {
          const pillW = doc.getTextWidth(skill) + 9;
          if (xCursor + pillW > margin + contentW) {
            xCursor = margin;
            y += 9;
            checkPageBreak(9);
          }
          xCursor += drawPill(skill, xCursor, y, variant);
        }
        y += 10;
      };

      // ── Header block ──────────────────────────────────────────────────────
      doc.setFillColor(79, 70, 229);
      doc.rect(0, 0, pageW * 0.5, 42, 'F');
      doc.setFillColor(99, 102, 241);
      doc.rect(pageW * 0.5, 0, pageW * 0.5, 42, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.text('Career Report', margin, 20);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text('Powered by CareerPilot AI', margin, 28);
      const now = new Date();
      doc.text(`Generated on ${now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, margin, 35);

      // Score badge
      doc.setFillColor(255, 255, 255);
      doc.circle(pageW - margin - 14, 21, 14, 'F');
      doc.setTextColor(99, 102, 241);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text(`${mockResumeData.score}`, pageW - margin - 14, 23.5, { align: 'center' });
      doc.setFontSize(7);
      doc.text('/ 100', pageW - margin - 14, 29, { align: 'center' });

      y = 52;
      doc.setTextColor(30, 30, 40);

      // ── Section 1: Resume Analysis ────────────────────────────────────────
      drawSectionHeader('Resume Analysis', '[RESUME]');

      // Score cards
      const cardW = (contentW - 8) / 3;
      const scores = [
        { label: 'Resume Score', value: mockResumeData.score },
        { label: 'Skill Match', value: mockResumeData.matchPercentage },
        { label: 'Improvement', value: mockResumeData.improvementScore },
      ];
      checkPageBreak(22);
      scores.forEach((sc, i) => {
        const cx = margin + i * (cardW + 4);
        doc.setFillColor(245, 245, 255);
        doc.roundedRect(cx, y, cardW, 18, 2, 2, 'F');
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(99, 102, 241);
        doc.text(`${sc.value}%`, cx + cardW / 2, y + 11, { align: 'center' });
        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 100, 120);
        doc.text(sc.label, cx + cardW / 2, y + 16, { align: 'center' });
      });
      y += 22;

      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(60, 60, 80);
      doc.text('Top Skills', margin, y);
      y += 6;
      drawPillRow(mockResumeData.skills, 'green');

      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(60, 60, 80);
      doc.text('Strengths', margin, y);
      y += 5;
      for (const s of mockResumeData.strengths) {
        checkPageBreak(6);
        doc.setFontSize(8.5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(80, 80, 100);
        doc.text(`+  ${s}`, margin + 2, y);
        y += 6;
      }
      y += 4;

      // ── Section 2: Skill Gaps ─────────────────────────────────────────────
      drawSectionHeader('Skill Gaps', '[GAPS]');
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(80, 80, 100);
      doc.text('Key areas to improve for senior-level positions:', margin, y);
      y += 7;
      drawPillRow(mockResumeData.skillGaps, 'red');

      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(60, 60, 80);
      doc.text('Improvement Suggestions', margin, y);
      y += 6;

      for (const sug of mockResumeData.suggestions) {
        checkPageBreak(16);
        doc.setFillColor(250, 250, 255);
        doc.roundedRect(margin, y, contentW, 13, 2, 2, 'F');
        doc.setFontSize(8.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(60, 60, 80);
        doc.text(sug.title, margin + 4, y + 5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 100, 120);
        const wrapped = doc.splitTextToSize(sug.description, contentW - 8);
        doc.text(wrapped[0], margin + 4, y + 10);
        y += 16;
      }
      y += 2;

      // ── Section 3: Interview Readiness ────────────────────────────────────
      drawSectionHeader('Interview Readiness', '[INTERVIEW]');
      drawScoreBar('Communication', mockInterviewFeedback.communication);
      drawScoreBar('Technical', mockInterviewFeedback.technical);
      drawScoreBar('Confidence', mockInterviewFeedback.confidence);
      drawScoreBar('Overall Score', mockInterviewFeedback.overall);
      y += 4;

      // ── Section 4: Market Insights ────────────────────────────────────────
      drawSectionHeader('Market Insights', '[MARKET]');

      for (const role of mockMarketRoles.slice(0, 5)) {
        checkPageBreak(14);
        doc.setFillColor(245, 245, 255);
        doc.roundedRect(margin, y, contentW, 12, 2, 2, 'F');

        const matchColor: [number,number,number] =
          role.matchPercentage >= 85 ? [34,197,94] :
          role.matchPercentage >= 70 ? [234,179,8] : [239,68,68];
        doc.setFillColor(...matchColor);
        doc.roundedRect(margin + contentW - 20, y + 2, 18, 8, 2, 2, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.text(`${role.matchPercentage}%`, margin + contentW - 11, y + 7.2, { align: 'center' });

        doc.setTextColor(40, 40, 60);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text(role.title, margin + 4, y + 5.5);
        doc.setTextColor(100, 100, 120);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text(`${role.salaryRange}  -  Demand: ${role.demandLevel}`, margin + 4, y + 10);
        y += 14;
      }
      y += 4;

      // ── Footer on every page ─────────────────────────────────────────────
      const totalPages = (doc as any).internal.pages.length;
      for (let p = 1; p <= totalPages; p++) {
        doc.setPage(p);
        doc.setFillColor(245, 245, 255);
        doc.rect(0, pageH - 10, pageW, 10, 'F');
        doc.setTextColor(160, 160, 180);
        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'normal');
        doc.text('CareerPilot  -  Confidential Career Report', margin, pageH - 3.5);
        doc.text(`Page ${p} of ${totalPages}`, pageW - margin, pageH - 3.5, { align: 'right' });
      }

      doc.save(`CareerPilot_Report_${now.toISOString().slice(0, 10)}.pdf`);
    } catch (err) {
      console.error('PDF generation failed', err);
    } finally {
      setDownloading(false);
    }
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
          <ScoreBar label="Technical"     value={mockInterviewFeedback.technical} />
          <ScoreBar label="Confidence"    value={mockInterviewFeedback.confidence} />
          <ScoreBar label="Overall"       value={mockInterviewFeedback.overall} />
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
          <p className="text-sm text-muted-foreground">
            Generated on {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <Button onClick={handleDownload} disabled={downloading} className="gap-2">
          {downloading
            ? <><Loader2 className="h-4 w-4 animate-spin" /> Generating...</>
            : <><Download className="h-4 w-4" /> Download PDF</>
          }
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
        <p className="text-sm text-muted-foreground">
          Report preview complete. Click <strong>Download PDF</strong> to save your career report.
        </p>
      </motion.div>
    </div>
  );
}