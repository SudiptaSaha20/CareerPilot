"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";

interface ResumeContextValue {
  resumeFile: File | null;
  setResumeFile: (file: File | null) => void;
  clearResume: () => void;
}

const ResumeContext = createContext<ResumeContextValue | null>(null);

export function ResumeProvider({ children }: { children: ReactNode }) {
  const [resumeFile, setResumeFileState] = useState<File | null>(null);

  const setResumeFile = useCallback((file: File | null) => {
    setResumeFileState(file);
  }, []);

  const clearResume = useCallback(() => {
    setResumeFileState(null);
  }, []);

  return (
    <ResumeContext.Provider value={{ resumeFile, setResumeFile, clearResume }}>
      {children}
    </ResumeContext.Provider>
  );
}

export function useResume() {
  const ctx = useContext(ResumeContext);
  if (!ctx) throw new Error("useResume must be used inside <ResumeProvider>");
  return ctx;
}