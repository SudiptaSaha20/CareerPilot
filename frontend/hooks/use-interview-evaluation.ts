import { useState, useCallback } from 'react';

export interface EvaluationResult {
  score: number;
  feedback: string;
  suggestions: string[];
  metrics: {
    communication: number;
    technical: number;
    confidence: number;
  };
}

export function useInterviewEvaluation() {
  const [evaluating, setEvaluating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<EvaluationResult | null>(null);

  const evaluateAnswer = useCallback(
    async (question: string, answer: string, sessionId: string, difficulty: string) => {
      setEvaluating(true);
      setError(null);

      try {
        const response = await fetch('/api/interview/evaluate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            question,
            answer,
            sessionId,
            difficulty,
          }),
        });

        if (!response.ok) {
          throw new Error(`API error: ${response.statusText}`);
        }

        const data = await response.json();
        setResult(data);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to evaluate answer';
        setError(errorMessage);
      } finally {
        setEvaluating(false);
      }
    },
    []
  );

  const resetEvaluation = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return {
    evaluating,
    error,
    result,
    evaluateAnswer,
    resetEvaluation,
  };
}
