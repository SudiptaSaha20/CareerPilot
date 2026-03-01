"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, FileText, CheckCircle, Zap, AlignLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import Link from "next/link";
import { useResume } from "@/context";
import { toast } from "sonner";

const PARSING_STEPS = [
  "Extracting resume text...",
  "Building semantic index...",
  "Extracting skills from resume...",
  "Matching keywords against JD...",
  "Generating learning roadmap...",
];

export default function UploadPage() {
  const router = useRouter();
  const { setResumeFile, setJobDescription } = useResume();

  const [isDragging,  setIsDragging]  = useState(false);
  const [file,        setFile]        = useState<File | null>(null);
  const [jd,          setJd]          = useState("");
  const [progress,    setProgress]    = useState(0);
  const [parsingStep, setParsingStep] = useState(0);
  const [stage,       setStage]       = useState<"idle" | "jd" | "analyzing" | "done">("idle");

  const handleFile = useCallback((f: File) => {
    if (f.type !== "application/pdf") {
      toast.error("Only PDF files are supported");
      return;
    }
    setFile(f);
    setStage("jd");
  }, []);

  const handleAnalyze = async () => {
    if (!file || !jd.trim()) return;

    // ── Persist into context NOW so /resume and /market can read them ──────────
    setResumeFile(file);
    setJobDescription(jd);

    setStage("analyzing");
    setProgress(0);
    setParsingStep(0);

    let p = 0;
    const progressTimer = setInterval(() => {
      p += Math.random() * 8;
      if (p >= 88) { p = 88; clearInterval(progressTimer); }
      setProgress(p);
    }, 500);

    let step = 0;
    const stepTimer = setInterval(() => {
      step++;
      setParsingStep(step % PARSING_STEPS.length);
    }, 1200);

    try {
      const form = new FormData();
      form.append("resume", file);
      form.append("job_description", jd);

      // Next.js API → Python /ats/candidate → saves to MongoDB
      const res = await fetch("/api/resume/analyze", {
        method: "POST",
        body:   form,
      });

      clearInterval(progressTimer);
      clearInterval(stepTimer);

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Analysis failed");
      }

      setProgress(100);
      setStage("done");
      setTimeout(() => router.push("/dashboard"), 1200);
    } catch (e) {
      clearInterval(progressTimer);
      clearInterval(stepTimer);
      toast.error(e instanceof Error ? e.message : "Analysis failed — is the backend running?");
      setStage("jd");
      setProgress(0);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, [handleFile]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="absolute inset-0 animated-gradient-bg opacity-30" />

      <Link href="/" className="fixed top-6 left-6 flex items-center gap-2 z-10">
        <Zap className="h-5 w-5 text-primary" />
        <span className="font-bold text-foreground">CareerPilot</span>
      </Link>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative z-10 w-full max-w-lg"
      >
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm text-primary">
            <Zap className="h-3.5 w-3.5" />
            {stage === "jd" ? "Step 2 of 2" : "Step 1 of 2"}
          </div>
          <h1 className="text-3xl font-bold text-foreground">
            {stage === "jd" ? "Add Job Description" : "Upload Your Resume"}
          </h1>
          <p className="mt-2 text-muted-foreground">
            {stage === "jd"
              ? "Paste the JD for a tailored ATS analysis"
              : "PDF only — analysed against your target role."}
          </p>
        </div>

        <AnimatePresence mode="wait">

          {/* STEP 1 — Drop resume */}
          {stage === "idle" && (
            <motion.div key="drop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div
                onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => document.getElementById("file-input")?.click()}
                className={`glass-card cursor-pointer border-2 border-dashed p-16 text-center transition-colors ${
                  isDragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                }`}
              >
                <input
                  id="file-input"
                  type="file"
                  accept=".pdf"
                  className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
                />
                <Upload className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                <p className="text-lg font-medium text-foreground">Drag &amp; drop your resume</p>
                <p className="mt-1 text-sm text-muted-foreground">or click to browse</p>
                <p className="mt-4 text-xs text-muted-foreground">PDF only</p>
              </div>
              <div className="mt-6 text-center">
                <Button variant="ghost" onClick={() => router.push("/dashboard")} className="text-muted-foreground">
                  Skip — use demo data
                </Button>
              </div>
            </motion.div>
          )}

          {/* STEP 2 — Enter JD */}
          {stage === "jd" && (
            <motion.div
              key="jd"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="glass-card space-y-5 p-8"
            >
              <div className="flex items-center gap-3 rounded-xl border border-success/20 bg-success/5 px-4 py-3">
                <FileText className="h-5 w-5 text-success shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{file?.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {file ? `${(file.size / 1024).toFixed(1)} KB` : ""}
                  </p>
                </div>
                <CheckCircle className="h-4 w-4 text-success shrink-0 ml-auto" />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
                    <AlignLeft className="h-4 w-4 text-primary" />
                    Job Description
                  </label>
                  <span className={`text-xs ${jd.length > 5000 ? "text-destructive" : "text-muted-foreground"}`}>
                    {jd.length} chars
                  </span>
                </div>
                <Textarea
                  value={jd}
                  onChange={e => setJd(e.target.value)}
                  placeholder="Paste the full job description here. The more detail, the better the skill gap analysis."
                  className="bg-secondary border-none focus-visible:ring-primary/50 resize-none h-44 text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  This JD will be pre-filled across Resume Analyzer and Market pages.
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1 border-glass-border"
                  onClick={() => { setStage("idle"); setFile(null); setJd(""); }}
                >
                  ← Change File
                </Button>
                <Button
                  className="flex-1 gap-2"
                  onClick={handleAnalyze}
                  disabled={!jd.trim()}
                >
                  <Zap className="h-4 w-4" /> Analyze Resume
                </Button>
              </div>
            </motion.div>
          )}

          {/* STEP 3 — Analyzing */}
          {stage === "analyzing" && (
            <motion.div
              key="analyzing"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="glass-card space-y-6 p-8 text-center"
            >
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                <FileText className="h-8 w-8 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{file?.name}</p>
                <p className="mt-1 text-xs text-muted-foreground animate-pulse">
                  {PARSING_STEPS[parsingStep]}
                </p>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                <motion.div
                  className="h-2 rounded-full bg-gradient-to-r from-primary to-accent"
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
              <p className="text-xs text-muted-foreground">This takes 20–40 seconds…</p>
            </motion.div>
          )}

          {/* STEP 4 — Done */}
          {stage === "done" && (
            <motion.div
              key="done"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-card space-y-4 p-8 text-center"
            >
              <CheckCircle className="mx-auto h-16 w-16 text-success" />
              <p className="text-lg font-semibold text-foreground">Analysis Complete!</p>
              <p className="text-sm text-muted-foreground">Saved to your account. Redirecting…</p>
            </motion.div>
          )}

        </AnimatePresence>
      </motion.div>
    </div>
  );
}