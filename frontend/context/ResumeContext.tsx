"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";

// ── Interview types ───────────────────────────────────────────────────────────
export interface InterviewQuestion {
  id: number;
  type: string;
  question: string;
  hint: string;
  difficulty: "easy" | "medium" | "hard";
}

export interface InterviewFeedback {
  overall_score:       number;
  communication_score: number;
  technical_score:     number;
  confidence_score:    number;
  verdict:             string;
  summary:             string;
  strengths:           string[];
  weaknesses:          string[];
  suggestions:         string[];
  per_question:        { question_id: number; score: number; comment: string; ideal_answer_hint: string }[];
  next_steps:          string[];
}

export interface InterviewResult {
  role:      string;
  questions: InterviewQuestion[];
  answers:   string[];
  feedback:  InterviewFeedback;
}

// ── Context type ──────────────────────────────────────────────────────────────
interface ResumeContextValue {
  resumeFile:         File | null;
  jobDescription:     string;
  interviewResult:    InterviewResult | null;
  setResumeFile:      (file: File | null) => void;
  setJobDescription:  (jd: string) => void;
  setInterviewResult: (result: InterviewResult | null) => void;
  clearResume:        () => void;
}

const ResumeContext = createContext<ResumeContextValue | null>(null);

export function ResumeProvider({ children }: { children: ReactNode }) {
  const [resumeFile,      setResumeFileState]      = useState<File | null>(null);
  const [jobDescription,  setJobDescriptionState]  = useState<string>("");
  const [interviewResult, setInterviewResultState] = useState<InterviewResult | null>(null);

  const setResumeFile      = useCallback((file: File | null)         => setResumeFileState(file),    []);
  const setJobDescription  = useCallback((jd: string)                => setJobDescriptionState(jd),  []);
  const setInterviewResult = useCallback((r: InterviewResult | null) => setInterviewResultState(r),  []);

  const clearResume = useCallback(() => {
    setResumeFileState(null);
    setJobDescriptionState("");
    setInterviewResultState(null);
  }, []);

  return (
    <ResumeContext.Provider value={{
      resumeFile,
      jobDescription,
      interviewResult,
      setResumeFile,
      setJobDescription,
      setInterviewResult,
      clearResume,
    }}>
      {children}
    </ResumeContext.Provider>
  );
}

export function useResume() {
  const ctx = useContext(ResumeContext);
  if (!ctx) throw new Error("useResume must be used inside <ResumeProvider>");
  return ctx;
}