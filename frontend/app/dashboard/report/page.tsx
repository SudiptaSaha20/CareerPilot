"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Download, FileText, Target, MessageSquare,
  TrendingUp, CheckCircle, Loader2, Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProgressRing } from "@/components/ProgressRing";
import { SkillTag } from "@/components/SkillTag";
import { ScoreBar } from "@/components/ScoreBar";
import { useResume } from "@/context";
import Link from "next/link";
import { cn } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────────────────────────────
interface DbResume {
  filename:       string;
  jobDescription: string | null;
  semanticScore:  number | null;
  atsScore:       number | null;
  keywordDensity: number | null;
  resumeSkills:   string[];
  jdSkills:       string[];
  missingSkills:  string[];
  analysis:       Record<string, unknown> | null;
  createdAt:      string;
}

// ── No-resume prompt ───────────────────────────────────────────────────────────
function NoResumePrompt() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card flex flex-col items-center justify-center gap-6 p-20 text-center"
    >
      <div className="rounded-2xl bg-primary/10 p-5">
        <FileText className="h-10 w-10 text-primary" />
      </div>
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-foreground">No resume uploaded yet</h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          Upload your resume first to generate a personalised career report with your real scores, skill gaps and interview results.
        </p>
      </div>
      <Link href="/upload">
        <Button size="lg" className="gap-2">
          <Upload className="h-4 w-4" /> Upload Resume
        </Button>
      </Link>
    </motion.div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function ReportPage() {
  const { resumeFile, interviewResult } = useResume();
  const [downloading, setDownloading]   = useState(false);
  const [dbResume, setDbResume]         = useState<DbResume | null>(null);
  const [loading, setLoading]           = useState(true);

  // Load latest resume analysis from DB (works after page refresh)
  useEffect(() => {
    fetch("/api/resume/latest")
      .then(r => r.json())
      .then(data => { if (data.resume) setDbResume(data.resume); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Derived data — prefer DB values, they're persisted
  const hasResume     = !!dbResume || !!resumeFile;
  const filename      = dbResume?.filename      ?? resumeFile?.name      ?? "Your Resume";
  const semScore      = Math.round(dbResume?.semanticScore  ?? 0);
  const atsScore      = Math.round(dbResume?.atsScore        ?? 0);
  const kwScore       = Math.round(dbResume?.keywordDensity  ?? 0);
  const resumeSkills  = dbResume?.resumeSkills  ?? [];
  const missingSkills = dbResume?.missingSkills ?? [];
  const overallScore  = Math.round((semScore + atsScore + kwScore) / 3);

  const interview     = interviewResult;
  const hasFeedback   = !!interview?.feedback;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!hasResume) return <NoResumePrompt />;

  // ── PDF Download ─────────────────────────────────────────────────────────────
  const handleDownload = async () => {
    setDownloading(true);
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

      const pageW    = doc.internal.pageSize.getWidth();
      const pageH    = doc.internal.pageSize.getHeight();
      const margin   = 18;
      const contentW = pageW - margin * 2;
      let y = 0;

      // Sanitize text to remove problematic UTF-8 characters
      const sanitizeText = (text: string): string => {
        if (!text) return "";
        return text
          .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "")
          .replace(/[\u2018\u2019]/g, "'")
          .replace(/[\u201C\u201D]/g, '"')
          .replace(/[\uFFFD]/g, "?")
          .trim();
      };

      // Wrapper for doc.text that sanitizes automatically
      const addText = (text: string, x: number, y: number, options?: any) => {
        const sanitized = sanitizeText(text);
        return doc.text(sanitized, x, y, options);
      };

      const checkPageBreak = (neededH: number) => {
        if (y + neededH > pageH - 20) { doc.addPage(); y = 22; }
      };

      const drawSectionHeader = (title: string, emoji: string) => {
        checkPageBreak(16);
        doc.setFillColor(99, 102, 241);
        doc.roundedRect(margin, y, contentW, 10, 2, 2, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.text(`${emoji}  ${title}`, margin + 4, y + 6.8);
        y += 14;
        doc.setTextColor(30, 30, 40);
      };

      const drawScoreBar = (label: string, value: number) => {
        checkPageBreak(12);
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(80, 80, 100);
        doc.text(label, margin, y + 4);
        doc.text(`${value}%`, margin + contentW - 10, y + 4, { align: "right" });
        doc.setFillColor(230, 230, 245);
        doc.roundedRect(margin + 52, y, contentW - 62, 4, 1, 1, "F");
        const c: [number, number, number] = value >= 70 ? [34,197,94] : value >= 40 ? [234,179,8] : [239,68,68];
        doc.setFillColor(...c);
        doc.roundedRect(margin + 52, y, (contentW - 62) * (value / 100), 4, 1, 1, "F");
        y += 10;
      };

      const drawPill = (text: string, x: number, yy: number, variant: "green"|"red"|"blue"): number => {
        const w = doc.getTextWidth(text) + 6;
        const bg: Record<string,[number,number,number]> = { green:[220,252,231], red:[254,226,226], blue:[219,234,254] };
        const fg: Record<string,[number,number,number]> = { green:[22,101,52],   red:[153,27,27],   blue:[29,78,216]  };
        doc.setFillColor(...bg[variant]);
        doc.roundedRect(x, yy - 3.5, w, 5.5, 1.2, 1.2, "F");
        doc.setTextColor(...fg[variant]);
        doc.setFontSize(7.5);
        doc.setFont("helvetica", "normal");
        doc.text(text, x + 3, yy + 0.5);
        return w + 3;
      };

      const drawPillRow = (skills: string[], variant: "green"|"red"|"blue") => {
        let x = margin;
        for (const skill of skills) {
          const w = doc.getTextWidth(skill) + 9;
          if (x + w > margin + contentW) { x = margin; y += 9; checkPageBreak(9); }
          x += drawPill(skill, x, y, variant);
        }
        y += 10;
      };

      // ── Header ──────────────────────────────────────────────────────────────
      doc.setFillColor(79, 70, 229);
      doc.rect(0, 0, pageW * 0.55, 44, "F");
      doc.setFillColor(99, 102, 241);
      doc.rect(pageW * 0.55, 0, pageW * 0.45, 44, "F");

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.setFont("helvetica", "bold");
      doc.text("Career Report", margin, 20);
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text("Powered by CareerPilot AI", margin, 28);
      const now = new Date();
      doc.text(
        `Generated: ${now.toLocaleDateString("en-US", { year:"numeric", month:"long", day:"numeric" })}`,
        margin, 35
      );
      doc.setFontSize(8);
      doc.text(`Resume: ${filename}`, margin, 41);

      // Overall score badge
      doc.setFillColor(255, 255, 255);
      doc.circle(pageW - margin - 14, 22, 14, "F");
      doc.setTextColor(99, 102, 241);
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text(`${overallScore}`, pageW - margin - 14, 24.5, { align: "center" });
      doc.setFontSize(7);
      doc.text("/ 100", pageW - margin - 14, 30, { align: "center" });

      y = 54;
      doc.setTextColor(30, 30, 40);

      // ── Section 1: ATS Scores ────────────────────────────────────────────────
      drawSectionHeader("ATS Resume Analysis", "📊");

      const cards = [
        { label: "Semantic Match", value: semScore },
        { label: "ATS Score",      value: atsScore },
        { label: "Keyword Density", value: kwScore },
      ];
      const cardW = (contentW - 8) / 3;
      checkPageBreak(22);
      cards.forEach((card, i) => {
        const cx = margin + i * (cardW + 4);
        doc.setFillColor(245, 245, 255);
        doc.roundedRect(cx, y, cardW, 18, 2, 2, "F");
        const c: [number,number,number] = card.value >= 70 ? [34,197,94] : card.value >= 40 ? [234,179,8] : [239,68,68];
        doc.setTextColor(...c);
        doc.setFontSize(18);
        doc.setFont("helvetica", "bold");
        doc.text(`${card.value}%`, cx + cardW / 2, y + 11, { align: "center" });
        doc.setFontSize(7.5);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(100, 100, 120);
        doc.text(card.label, cx + cardW / 2, y + 16, { align: "center" });
      });
      y += 24;

      // Resume skills
      if (resumeSkills.length > 0) {
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(60, 60, 80);
        doc.text("Your Skills", margin, y);
        y += 6;
        drawPillRow(resumeSkills.slice(0, 20), "green");
      }

      // ── Section 2: Skill Gaps ────────────────────────────────────────────────
      if (missingSkills.length > 0) {
        drawSectionHeader("Skill Gaps", "❌");
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(80, 80, 100);
        doc.text("Skills in the job description not found in your resume:", margin, y);
        y += 7;
        drawPillRow(missingSkills, "red");
      }

      // ── Section 3: Interview Results (if available) ──────────────────────────
      if (hasFeedback && interview) {
        const fb = interview.feedback;
        drawSectionHeader(`Interview Results — ${interview.role}`, "🎯");

        drawScoreBar("Overall Score",    fb.overall_score);
        drawScoreBar("Communication",    fb.communication_score);
        drawScoreBar("Technical",        fb.technical_score);
        drawScoreBar("Confidence",       fb.confidence_score);
        y += 4;

        // Verdict
        checkPageBreak(16);
        const vc: [number,number,number] = fb.overall_score >= 70 ? [34,197,94] : fb.overall_score >= 50 ? [234,179,8] : [239,68,68];
        doc.setFillColor(...vc);
        doc.roundedRect(margin, y, contentW, 10, 2, 2, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        addText(`Verdict: ${fb.verdict}`, margin + 4, y + 6.5);
        y += 14;

        // Strengths
        if (fb.strengths.length > 0) {
          doc.setFontSize(9);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(60, 60, 80);
          doc.text("Strengths", margin, y);
          y += 5;
          for (const s of fb.strengths) {
            checkPageBreak(6);
            doc.setFontSize(8.5);
            doc.setFont("helvetica", "normal");
            doc.setTextColor(80, 80, 100);
            addText(`✓  ${s}`, margin + 2, y);
            y += 6;
          }
          y += 3;
        }

        // Q&A responses
        if (interview.questions.length > 0) {
          drawSectionHeader("Interview Q&A", "💬");
          for (let i = 0; i < interview.questions.length; i++) {
            const q   = interview.questions[i];
            const ans = interview.answers[i] || "[No answer given]";
            const pq  = fb.per_question.find(p => p.question_id === q.id);

            checkPageBreak(30);
            // Question box
            doc.setFillColor(245, 245, 255);
            doc.roundedRect(margin, y, contentW, 8, 2, 2, "F");
            doc.setFontSize(8.5);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(60, 60, 80);
            const qText = doc.splitTextToSize(sanitizeText(`Q${i+1}: ${q.question}`), contentW - 6);
            addText(qText[0], margin + 3, y + 5.5);
            y += 11;

            // Answer
            doc.setFontSize(8);
            doc.setFont("helvetica", "normal");
            doc.setTextColor(80, 80, 100);
            const ansLines = doc.splitTextToSize(sanitizeText(ans), contentW - 4);
            for (const line of ansLines.slice(0, 3)) {
              checkPageBreak(5);
              addText(line, margin + 2, y);
              y += 5;
            }

            // Score + comment
            if (pq) {
              checkPageBreak(8);
              const sc: [number,number,number] = pq.score >= 70 ? [34,197,94] : pq.score >= 50 ? [234,179,8] : [239,68,68];
              doc.setTextColor(...sc);
              doc.setFontSize(8);
              doc.setFont("helvetica", "bold");
              addText(`Score: ${pq.score}/100`, margin + 2, y);
              doc.setFont("helvetica", "normal");
              doc.setTextColor(100, 100, 120);
              const cLines = doc.splitTextToSize(sanitizeText(pq.comment), contentW - 30);
              addText(cLines[0] || "", margin + 28, y);
              y += 8;
            }
            y += 3;
          }
        }
      }

      // ── Footer ───────────────────────────────────────────────────────────────
      const totalPages: number = (doc.internal as unknown as { pages: unknown[] }).pages.length;
      for (let p = 1; p <= totalPages; p++) {
        doc.setPage(p);
        doc.setFillColor(245, 245, 255);
        doc.rect(0, pageH - 10, pageW, 10, "F");
        doc.setTextColor(160, 160, 180);
        doc.setFontSize(7.5);
        doc.setFont("helvetica", "normal");
        doc.text("CareerPilot  —  Confidential Career Report", margin, pageH - 3.5);
        doc.text(`Page ${p} of ${totalPages}`, pageW - margin, pageH - 3.5, { align: "right" });
      }

      doc.save(`CareerPilot_Report_${now.toISOString().slice(0, 10)}.pdf`);
    } catch (err) {
      console.error("PDF generation failed", err);
    } finally {
      setDownloading(false);
    }
  };

  // ── Preview sections ──────────────────────────────────────────────────────────
  return (
    <div className="mx-auto max-w-3xl space-y-6">

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h2 className="text-2xl font-bold text-foreground">Career Report</h2>
          <p className="text-sm text-muted-foreground">
            {filename} · {new Date().toLocaleDateString("en-US", { year:"numeric", month:"long", day:"numeric" })}
          </p>
        </div>
        <Button onClick={handleDownload} disabled={downloading} className="gap-2">
          {downloading
            ? <><Loader2 className="h-4 w-4 animate-spin" /> Generating…</>
            : <><Download className="h-4 w-4" /> Download PDF</>
          }
        </Button>
      </motion.div>

      {/* Overall score banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="glass-card p-6 flex items-center gap-6"
      >
        <ProgressRing value={overallScore} size={100} strokeWidth={8} label="Overall" />
        <div className="space-y-1">
          <p className="text-lg font-bold text-foreground">Overall Career Score: {overallScore}/100</p>
          <p className="text-sm text-muted-foreground">
            Based on ATS analysis of <span className="text-primary font-medium">{filename}</span>
            {dbResume?.jobDescription && " against your target JD"}
          </p>
          <div className="flex gap-2 flex-wrap pt-1">
            {[
              { label: "Semantic", value: semScore },
              { label: "ATS",      value: atsScore },
              { label: "Keywords", value: kwScore  },
            ].map(s => (
              <span key={s.label} className={cn(
                "text-xs font-mono rounded-full border px-2 py-0.5",
                s.value >= 70 ? "bg-success/10 border-success/30 text-success"
                  : s.value >= 40 ? "bg-warning/10 border-warning/30 text-warning"
                  : "bg-destructive/10 border-destructive/30 text-destructive"
              )}>
                {s.label}: {s.value}%
              </span>
            ))}
          </div>
        </div>
      </motion.div>

      {/* ATS Analysis */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card p-6"
      >
        <div className="mb-4 flex items-center gap-3">
          <div className="rounded-xl bg-primary/10 p-2"><FileText className="h-4 w-4 text-primary" /></div>
          <h3 className="text-base font-semibold text-foreground">ATS Resume Analysis</h3>
        </div>
        <div className="space-y-4">
          <ScoreBar label="Semantic Match"  value={semScore} />
          <ScoreBar label="ATS Score"       value={atsScore} />
          <ScoreBar label="Keyword Density" value={kwScore}  />
        </div>
        {resumeSkills.length > 0 && (
          <div className="mt-5">
            <p className="mb-2 text-xs font-medium text-muted-foreground">Your Skills ({resumeSkills.length})</p>
            <div className="flex flex-wrap gap-1.5">
              {resumeSkills.slice(0, 16).map(s => <SkillTag key={s} label={s} variant="strength" />)}
              {resumeSkills.length > 16 && (
                <span className="text-xs text-muted-foreground self-center">+{resumeSkills.length - 16} more</span>
              )}
            </div>
          </div>
        )}
      </motion.div>

      {/* Skill Gaps */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="glass-card p-6"
      >
        <div className="mb-4 flex items-center gap-3">
          <div className="rounded-xl bg-destructive/10 p-2"><Target className="h-4 w-4 text-destructive" /></div>
          <h3 className="text-base font-semibold text-foreground">Skill Gaps</h3>
        </div>
        {missingSkills.length > 0 ? (
          <>
            <p className="mb-3 text-sm text-muted-foreground">
              {missingSkills.length} skill{missingSkills.length > 1 ? "s" : ""} from the job description missing in your resume:
            </p>
            <div className="flex flex-wrap gap-1.5">
              {missingSkills.map(s => <SkillTag key={s} label={s} variant="gap" />)}
            </div>
          </>
        ) : (
          <p className="text-sm text-success font-medium">🎉 No skill gaps detected — great match!</p>
        )}
      </motion.div>

      {/* Interview Readiness */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-card p-6"
      >
        <div className="mb-4 flex items-center gap-3">
          <div className="rounded-xl bg-primary/10 p-2"><MessageSquare className="h-4 w-4 text-primary" /></div>
          <h3 className="text-base font-semibold text-foreground">Interview Readiness</h3>
          {hasFeedback && (
            <span className="ml-auto text-xs rounded-full bg-success/10 border border-success/30 text-success px-2 py-0.5">
              ✅ Completed — {interview!.role}
            </span>
          )}
        </div>

        {hasFeedback && interview ? (
          <div className="space-y-4">
            <ScoreBar label="Overall Score"  value={interview.feedback.overall_score} />
            <ScoreBar label="Communication"  value={interview.feedback.communication_score} />
            <ScoreBar label="Technical"      value={interview.feedback.technical_score} />
            <ScoreBar label="Confidence"     value={interview.feedback.confidence_score} />

            {/* Verdict */}
            <div className={cn(
              "rounded-xl border p-4 text-center",
              interview.feedback.overall_score >= 70 ? "border-success/30 bg-success/5"
                : interview.feedback.overall_score >= 50 ? "border-warning/30 bg-warning/5"
                : "border-destructive/30 bg-destructive/5"
            )}>
              <p className={cn("text-xl font-bold",
                interview.feedback.overall_score >= 70 ? "text-success"
                  : interview.feedback.overall_score >= 50 ? "text-warning" : "text-destructive"
              )}>
                {interview.feedback.overall_score >= 70 ? "✅" : interview.feedback.overall_score >= 50 ? "⚠️" : "❌"}{" "}
                {interview.feedback.verdict}
              </p>
              <p className="text-sm text-muted-foreground mt-1">{interview.feedback.summary}</p>
            </div>

            {/* Strengths / Weaknesses */}
            {(interview.feedback.strengths.length > 0 || interview.feedback.weaknesses.length > 0) && (
              <div className="grid sm:grid-cols-2 gap-4">
                {interview.feedback.strengths.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground">✅ Strengths</p>
                    {interview.feedback.strengths.map((s, i) => (
                      <div key={i} className="rounded-r-xl border-l-4 border-success bg-success/5 px-3 py-2 text-sm">{s}</div>
                    ))}
                  </div>
                )}
                {interview.feedback.weaknesses.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground">⚠️ Areas to Improve</p>
                    {interview.feedback.weaknesses.map((w, i) => (
                      <div key={i} className="rounded-r-xl border-l-4 border-warning bg-warning/5 px-3 py-2 text-sm">{w}</div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Q&A responses */}
            {interview.questions.length > 0 && (
              <div className="space-y-4 pt-2">
                <p className="text-sm font-semibold text-foreground">💬 Your Interview Responses</p>
                {interview.questions.map((q, i) => {
                  const ans = interview.answers[i] || "[No answer given]";
                  const pq  = interview.feedback.per_question.find(p => p.question_id === q.id);
                  return (
                    <div key={q.id} className="rounded-xl border border-border/50 bg-secondary/30 p-4 space-y-2">
                      <div className="flex items-start justify-between gap-2 flex-wrap">
                        <p className="text-sm font-medium text-foreground">
                          <span className="text-xs font-mono text-muted-foreground mr-2">Q{i + 1}</span>
                          {q.question}
                        </p>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className={cn(
                            "text-xs rounded-full border px-2 py-0.5 font-mono",
                            q.difficulty === "hard"   ? "border-destructive/30 bg-destructive/10 text-destructive"
                              : q.difficulty === "medium" ? "border-warning/30 bg-warning/10 text-warning"
                              : "border-success/30 bg-success/10 text-success"
                          )}>
                            {q.difficulty}
                          </span>
                          <span className="text-xs rounded-full border border-border bg-secondary px-2 py-0.5 text-muted-foreground">
                            {q.type}
                          </span>
                        </div>
                      </div>

                      {/* Answer */}
                      <div className="rounded-lg bg-background/50 border border-border/30 px-3 py-2">
                        <p className="text-xs font-mono text-muted-foreground mb-1">Your answer:</p>
                        <p className="text-sm text-foreground leading-relaxed">{ans}</p>
                      </div>

                      {/* Score + comment */}
                      {pq && (
                        <div className="flex items-start gap-3">
                          <span className={cn(
                            "text-sm font-bold font-mono shrink-0",
                            pq.score >= 70 ? "text-success" : pq.score >= 50 ? "text-warning" : "text-destructive"
                          )}>
                            {pq.score}/100
                          </span>
                          <p className="text-xs text-muted-foreground leading-relaxed">{pq.comment}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Next steps */}
            {interview.feedback.next_steps.length > 0 && (
              <div className="space-y-2 pt-2">
                <p className="text-xs font-semibold text-muted-foreground">📋 Next Steps</p>
                {interview.feedback.next_steps.map((s, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-foreground">
                    <span className="text-primary font-mono shrink-0">{i + 1}.</span> {s}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border p-6 text-center space-y-2">
            <MessageSquare className="h-8 w-8 text-muted-foreground mx-auto" />
            <p className="text-sm text-muted-foreground">No interview completed yet</p>
            <Link href="/dashboard/interview">
              <Button variant="outline" size="sm" className="mt-1">Start Mock Interview →</Button>
            </Link>
          </div>
        )}
      </motion.div>

      {/* Market Insights placeholder */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="glass-card p-6"
      >
        <div className="mb-4 flex items-center gap-3">
          <div className="rounded-xl bg-primary/10 p-2"><TrendingUp className="h-4 w-4 text-primary" /></div>
          <h3 className="text-base font-semibold text-foreground">Market Insights</h3>
        </div>
        <div className="rounded-xl border border-dashed border-border p-6 text-center space-y-2">
          <TrendingUp className="h-8 w-8 text-muted-foreground mx-auto" />
          <p className="text-sm text-muted-foreground">Run a market analysis to see job matches & salary data</p>
          <Link href="/dashboard/market">
            <Button variant="outline" size="sm" className="mt-1">View Market Analysis →</Button>
          </Link>
        </div>
      </motion.div>

      {/* Complete badge */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.35 }}
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