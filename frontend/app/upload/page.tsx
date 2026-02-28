"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, FileText, CheckCircle, Zap } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function UploadPage() {
  const router = useRouter();
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState<"idle" | "uploading" | "parsing" | "done">("idle");
  const [parsingStep, setParsingStep] = useState(0);

  const parsingSteps = [
    "Extracting text...",
    "Analyzing skills...",
    "Scoring resume...",
    "Generating insights...",
  ];

  const handleFile = useCallback(
    (f: File) => {
      setFile(f);
      setStage("uploading");
      let p = 0;
      const uploadTimer = setInterval(() => {
        p += Math.random() * 15;
        if (p >= 100) {
          p = 100;
          clearInterval(uploadTimer);
          setProgress(100);
          setStage("parsing");

          let step = 0;
          const stepTimer = setInterval(() => {
            step++;
            setParsingStep(step % parsingSteps.length);
          }, 800);

          setTimeout(() => {
            clearInterval(stepTimer);
            setStage("done");
            setTimeout(() => router.push("/dashboard"), 1200);
          }, 2500);
          return;
        }
        setProgress(Math.min(p, 100));
      }, 200);
    },
    [router, parsingSteps.length]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const f = e.dataTransfer.files[0];
      if (f) handleFile(f);
    },
    [handleFile]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      if (f) handleFile(f);
    },
    [handleFile]
  );

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="absolute inset-0 animated-gradient-bg opacity-30" />

      {/* Nav */}
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
            <Zap className="h-3.5 w-3.5" /> CareerPilot
          </div>
          <h1 className="text-3xl font-bold text-foreground">Upload Your Resume</h1>
          <p className="mt-2 text-muted-foreground">
            PDF or DOC format. We&apos;ll analyze it in seconds.
          </p>
        </div>

        <AnimatePresence mode="wait">
          {stage === "idle" && (
            <motion.div
              key="dropzone"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`glass-card cursor-pointer border-2 border-dashed p-16 text-center transition-colors ${
                isDragging
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
              }`}
              onClick={() => document.getElementById("file-input")?.click()}
            >
              <input
                id="file-input"
                type="file"
                accept=".pdf,.doc,.docx"
                className="hidden"
                onChange={handleInputChange}
              />
              <Upload className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
              <p className="text-lg font-medium text-foreground">
                Drag &amp; drop your resume
              </p>
              <p className="mt-1 text-sm text-muted-foreground">or click to browse</p>
              <p className="mt-4 text-xs text-muted-foreground">Supports PDF, DOC, DOCX</p>
            </motion.div>
          )}

          {(stage === "uploading" || stage === "parsing") && (
            <motion.div
              key="progress"
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
                <p className="mt-1 text-xs text-muted-foreground">
                  {stage === "uploading"
                    ? "Uploading..."
                    : parsingSteps[parsingStep]}
                </p>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                <motion.div
                  className="h-2 rounded-full bg-gradient-to-r from-primary to-accent"
                  animate={{
                    width: stage === "parsing" ? "100%" : `${progress}%`,
                  }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              {stage === "parsing" && (
                <div className="shimmer mx-auto h-4 w-48 rounded bg-secondary" />
              )}
            </motion.div>
          )}

          {stage === "done" && (
            <motion.div
              key="done"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-card space-y-4 p-8 text-center"
            >
              <CheckCircle className="mx-auto h-16 w-16 text-success" />
              <p className="text-lg font-semibold text-foreground">Analysis Complete!</p>
              <p className="text-sm text-muted-foreground">
                Redirecting to your dashboard...
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {stage === "idle" && (
          <div className="mt-6 text-center">
            <Button
              variant="ghost"
              onClick={() => router.push("/dashboard")}
              className="text-muted-foreground"
            >
              Skip — use demo data
            </Button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
