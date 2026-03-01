"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";

interface ResumeContextValue {
  resumeFile:       File | null;
  jobDescription:   string;
  setResumeFile:    (file: File | null) => void;
  setJobDescription:(jd: string) => void;
  clearResume:      () => void;
}

const ResumeContext = createContext<ResumeContextValue | null>(null);

export function ResumeProvider({ children }: { children: ReactNode }) {
  const [resumeFile,     setResumeFileState]     = useState<File | null>(null);
  const [jobDescription, setJobDescriptionState] = useState<string>("");

  const setResumeFile    = useCallback((file: File | null) => setResumeFileState(file),  []);
  const setJobDescription = useCallback((jd: string)       => setJobDescriptionState(jd), []);
  const clearResume       = useCallback(() => {
    setResumeFileState(null);
    setJobDescriptionState("");
  }, []);

  return (
    <ResumeContext.Provider value={{
      resumeFile,
      jobDescription,
      setResumeFile,
      setJobDescription,
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