"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, SkipForward, RotateCcw, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ChatBubble } from "@/components/ChatBubble";
import { ScoreBar } from "@/components/ScoreBar";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Question {
  id: number;
  type: string;
  question: string;
  hint: string;
  difficulty: "easy" | "medium" | "hard";
}

interface FeedbackData {
  overall_score: number;
  communication_score: number;
  technical_score: number;
  confidence_score: number;
  verdict: string;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  per_question: {
    question_id: number;
    score: number;
    comment: string;
    ideal_answer_hint: string;
  }[];
  next_steps: string[];
}

interface ChatMessage { role: "ai" | "user"; text: string; }

// ─── Constants ────────────────────────────────────────────────────────────────
const API = process.env.NEXT_PUBLIC_INTERVIEW_API_URL || "http://localhost:8000";

const FOCUS_OPTIONS = [
  "Machine Learning","System Design","Data Structures","Behavioral",
  "Leadership","Frontend","Backend","DevOps","Cloud","SQL","Python",
];

const EXPERIENCE_OPTIONS = [
  "Entry Level (0-2 yrs)",
  "Mid Level (2-5 yrs)",
  "Senior Level (5-8 yrs)",
  "Lead / Principal (8+ yrs)",
];

const TYPE_COLORS: Record<string, string> = {
  technical: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  behavioral: "bg-success/10 text-success border-success/20",
  "system design": "bg-warning/10 text-warning border-warning/20",
  situational: "bg-orange-400/10 text-orange-400 border-orange-400/20",
};

const DIFF_COLORS: Record<string, string> = {
  easy: "text-success border-success/30 bg-success/10",
  medium: "text-warning border-warning/30 bg-warning/10",
  hard: "text-destructive border-destructive/30 bg-destructive/10",
};

function scoreColor(v: number) {
  return v >= 75 ? "text-success" : v >= 50 ? "text-warning" : "text-destructive";
}

type Stage = "setup" | "questions" | "simulation" | "feedback";

// ─── Main Component ───────────────────────────────────────────────────────────
export default function InterviewGuide() {
  // Left panel — chat coach
  const [chatMessages, setChatMessages] = useState<{ text: string; isAI: boolean }[]>([
    { text: "Hi! I'm your AI Interview Coach. Ask me anything about interview prep, or use the Interview Agent on the right to run a full mock session.", isAI: true },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [chatTyping, setChatTyping] = useState(false);

  // Right panel — interview agent state
  const [stage, setStage] = useState<Stage>("setup");
  const [role, setRole] = useState("");
  const [experience, setExperience] = useState("Senior Level (5-8 yrs)");
  const [focus, setFocus] = useState<string[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [answerInput, setAnswerInput] = useState("");
  const [simChatLog, setSimChatLog] = useState<ChatMessage[]>([]);
  const [chatHistory, setChatHistory] = useState<{ question: string; answer: string }[]>([]);
  const [feedback, setFeedback] = useState<FeedbackData | null>(null);
  const [loading, setLoading] = useState(false);
  const [expandedQ, setExpandedQ] = useState<number | null>(null);

  const chatLogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatLogRef.current) {
      chatLogRef.current.scrollTop = chatLogRef.current.scrollHeight;
    }
  }, [simChatLog]);

  // ── Left panel chat ──────────────────────────────────────────────────────
  const sendChat = () => {
    if (!chatInput.trim()) return;
    setChatMessages(m => [...m, { text: chatInput, isAI: false }]);
    setChatInput("");
    setChatTyping(true);
    setTimeout(() => {
      setChatTyping(false);
      setChatMessages(m => [...m, {
        text: "Great question! Use the STAR method for behavioral questions: Situation, Task, Action, Result. For technical questions, think out loud and explain your reasoning as you go.",
        isAI: true,
      }]);
    }, 1800);
  };

  // ── Step 1 — Generate questions ──────────────────────────────────────────
  const generateQuestions = async () => {
    if (!role.trim()) { toast.error("Please enter a job role"); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API}/generate-questions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: role.trim(), experience, focus }),
      });
      if (!res.ok) throw new Error((await res.json()).detail);
      const data = await res.json();
      setQuestions(data.questions);
      setStage("questions");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to generate questions");
    } finally {
      setLoading(false);
    }
  };

  const regenQuestions = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/generate-questions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, experience, focus }),
      });
      if (!res.ok) throw new Error((await res.json()).detail);
      setQuestions((await res.json()).questions);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to regenerate");
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2 — Simulation ──────────────────────────────────────────────────
  const startSimulation = () => {
    setAnswers([]);
    setSimChatLog([]);
    setChatHistory([]);
    setCurrentIdx(0);
    setAnswerInput("");
    setStage("simulation");
  };

  const addBubble = (role: "ai" | "user", text: string) => {
    setSimChatLog(prev => [...prev, { role, text }]);
  };

  const submitAnswer = async () => {
    const answer = answerInput.trim();
    if (!answer) { toast.error("Please type an answer"); return; }

    const q = questions[currentIdx];
    addBubble("ai", q.question);
    addBubble("user", answer);
    setAnswers(prev => [...prev, answer]);
    setAnswerInput("");
    setLoading(true);

    if (currentIdx < questions.length - 1) {
      try {
        const res = await fetch(`${API}/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            role,
            question: q.question,
            answer,
            history: chatHistory,
          }),
        });
        if (!res.ok) throw new Error((await res.json()).detail);
        const { followup } = await res.json();
        addBubble("ai", followup);
      } catch (e) {
        toast.error("Could not get interviewer response");
      }
    }

    setChatHistory(prev => [...prev, { question: q.question, answer }]);
    setLoading(false);
    setCurrentIdx(prev => prev + 1);
  };

  const skipQuestion = () => {
    const q = questions[currentIdx];
    addBubble("ai", q.question);
    addBubble("user", "[Skipped]");
    setAnswers(prev => [...prev, "[Skipped]"]);
    setChatHistory(prev => [...prev, { question: q.question, answer: "[Skipped]" }]);
    setCurrentIdx(prev => prev + 1);
  };

  // ── Step 3 — Feedback ────────────────────────────────────────────────────
  const getFeedback = async () => {
    setStage("feedback");
    setLoading(true);
    try {
      const res = await fetch(`${API}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, questions, answers }),
      });
      if (!res.ok) throw new Error((await res.json()).detail);
      setFeedback(await res.json());
    } catch (e) {
      toast.error("Could not generate feedback");
    } finally {
      setLoading(false);
    }
  };

  const resetAll = () => {
    setStage("setup");
    setRole("");
    setFocus([]);
    setQuestions([]);
    setAnswers([]);
    setSimChatLog([]);
    setChatHistory([]);
    setFeedback(null);
    setCurrentIdx(0);
    setAnswerInput("");
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="grid gap-6 lg:grid-cols-2 h-full">

      {/* ── LEFT — Chat Coach ─────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="glass-card flex flex-col" style={{ height: "75vh" }}>
        <div className="border-b border-border p-4">
          <h3 className="text-sm font-semibold text-foreground">AI Interview Coach</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Ask anything about interview prep</p>
        </div>
        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          {chatMessages.map((m, i) => <ChatBubble key={i} message={m.text} isAI={m.isAI} />)}
          {chatTyping && (
            <div className="flex items-center gap-1 px-4 py-2">
              {[0, 150, 300].map(d => (
                <span key={d} className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground"
                  style={{ animationDelay: `${d}ms` }} />
              ))}
            </div>
          )}
        </div>
        <div className="border-t border-border p-4">
          <div className="flex gap-2">
            <Input placeholder="Ask about interview prep..."
              value={chatInput} onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && sendChat()}
              className="bg-secondary border-none" />
            <Button size="icon" onClick={sendChat}><Send className="h-4 w-4" /></Button>
          </div>
        </div>
      </motion.div>

      {/* ── RIGHT — Interview Agent ───────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }} className="glass-card flex flex-col overflow-hidden" style={{ height: "75vh" }}>

        {/* Step indicator */}
        <div className="grid grid-cols-4 border-b border-border shrink-0">
          {(["setup","questions","simulation","feedback"] as Stage[]).map((s, i) => (
            <div key={s} className={cn(
              "py-2.5 text-center text-xs font-semibold tracking-widest uppercase border-b-2 transition-colors",
              stage === s ? "text-primary border-primary" :
              ["setup","questions","simulation","feedback"].indexOf(stage) > i
                ? "text-muted-foreground border-primary/30"
                : "text-muted-foreground/40 border-transparent"
            )}>
              {i + 1}·{s === "setup" ? "Setup" : s === "questions" ? "Qs" : s === "simulation" ? "Mock" : "Feedback"}
            </div>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          <AnimatePresence mode="wait">

            {/* ── SETUP ─────────────────────────────────────────────── */}
            {stage === "setup" && (
              <motion.div key="setup" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                className="space-y-4">
                <div>
                  <h3 className="text-base font-bold text-foreground mb-1">Setup Interview</h3>
                  <p className="text-xs text-muted-foreground">Configure your mock interview session</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Job Role / Position</label>
                  <Input value={role} onChange={e => setRole(e.target.value)}
                    placeholder="e.g. Senior Data Scientist, Frontend Engineer..."
                    className="bg-secondary border-none"
                    onKeyDown={e => e.key === "Enter" && generateQuestions()} />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Experience Level</label>
                  <select value={experience} onChange={e => setExperience(e.target.value)}
                    className="w-full rounded-lg bg-secondary text-foreground text-sm px-3 py-2 border-none outline-none focus:ring-1 focus:ring-primary/50">
                    {EXPERIENCE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Focus Areas (optional)</label>
                  <div className="flex flex-wrap gap-1.5">
                    {FOCUS_OPTIONS.map(f => (
                      <button key={f} onClick={() => setFocus(prev =>
                        prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f]
                      )}
                        className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium border transition-all",
                          focus.includes(f)
                            ? "bg-primary/10 border-primary/50 text-primary"
                            : "border-glass-border text-muted-foreground hover:border-primary/30"
                        )}>
                        {f}
                      </button>
                    ))}
                  </div>
                </div>

                <Button className="w-full gap-2" onClick={generateQuestions} disabled={loading}>
                  {loading ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    : "🎯"} Start Interview Prep
                </Button>
              </motion.div>
            )}

            {/* ── QUESTIONS ─────────────────────────────────────────── */}
            {stage === "questions" && (
              <motion.div key="questions" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                className="space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-base font-bold text-foreground">{role}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">Review your 7 AI-generated questions</p>
                  </div>
                  <button onClick={regenQuestions} disabled={loading}
                    className="text-xs text-primary hover:underline flex items-center gap-1 shrink-0">
                    <RotateCcw className="h-3 w-3" /> Regenerate
                  </button>
                </div>

                <div className="space-y-2">
                  {questions.map(q => (
                    <div key={q.id} className="rounded-xl bg-secondary/50 p-3 space-y-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-mono text-primary">Q{q.id}</span>
                        <span className={cn("text-xs px-1.5 py-0.5 rounded-full border font-medium",
                          TYPE_COLORS[q.type?.toLowerCase()] || "bg-muted text-muted-foreground border-border")}>
                          {q.type?.toUpperCase()}
                        </span>
                        <span className={cn("text-xs px-1.5 py-0.5 rounded-full border font-medium",
                          DIFF_COLORS[q.difficulty?.toLowerCase()] || "")}>
                          {q.difficulty?.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-foreground leading-relaxed">{q.question}</p>
                      <p className="text-xs text-muted-foreground font-mono">💡 {q.hint}</p>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2 pt-1">
                  <Button variant="outline" className="flex-1 border-glass-border text-xs"
                    onClick={() => setStage("setup")}>← Back</Button>
                  <Button className="flex-1 gap-1.5 text-xs" onClick={startSimulation}>
                    ▶ Start Mock Interview
                  </Button>
                </div>
              </motion.div>
            )}

            {/* ── SIMULATION ─────────────────────────────────────────── */}
            {stage === "simulation" && (
              <motion.div key="simulation" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                className="space-y-4">

                {/* Progress */}
                <div>
                  <div className="flex justify-between text-xs text-muted-foreground font-mono mb-1.5">
                    <span>Question {Math.min(currentIdx + 1, questions.length)} of {questions.length}</span>
                    <span>{Math.round((currentIdx / questions.length) * 100)}% complete</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
                    <div className="h-full bg-primary rounded-full transition-all duration-500"
                      style={{ width: `${(currentIdx / questions.length) * 100}%` }} />
                  </div>
                </div>

                {/* Chat log */}
                {simChatLog.length > 0 && (
                  <div ref={chatLogRef} className="space-y-2 max-h-48 overflow-y-auto">
                    {simChatLog.map((m, i) => (
                      <div key={i} className={cn("rounded-xl px-3.5 py-2.5 text-sm leading-relaxed max-w-[92%]",
                        m.role === "ai"
                          ? "bg-secondary/80 text-foreground"
                          : "bg-primary/10 border border-primary/20 text-foreground ml-auto text-right"
                      )}>
                        <p className="text-xs font-mono text-muted-foreground mb-1">
                          {m.role === "ai" ? "🤖 Interviewer" : "👤 You"}
                        </p>
                        {m.text}
                      </div>
                    ))}
                    {loading && (
                      <div className="bg-secondary/80 rounded-xl px-3.5 py-2.5 max-w-[70%]">
                        <p className="text-xs font-mono text-muted-foreground mb-1">🤖 Interviewer</p>
                        <div className="flex gap-1">
                          {[0,150,300].map(d => (
                            <span key={d} className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce"
                              style={{ animationDelay: `${d}ms` }} />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* All done */}
                {currentIdx >= questions.length ? (
                  <div className="rounded-xl border border-success/20 bg-success/5 p-6 text-center space-y-3">
                    <div className="text-3xl">🎉</div>
                    <p className="font-bold text-foreground">Interview Complete!</p>
                    <p className="text-xs text-muted-foreground">
                      You answered {answers.filter(a => a !== "[Skipped]").length} of {questions.length} questions
                    </p>
                    <Button className="w-full gap-2" onClick={getFeedback}>
                      📊 Get Performance Feedback
                    </Button>
                  </div>
                ) : (
                  /* Current question */
                  <div className="space-y-3">
                    <div className="rounded-xl border-l-2 border-primary bg-primary/5 p-4 space-y-2">
                      <div className="flex items-center gap-1.5 text-xs font-mono text-primary">
                        QUESTION {currentIdx + 1} ·{" "}
                        {questions[currentIdx]?.type?.toUpperCase()} ·{" "}
                        {questions[currentIdx]?.difficulty?.toUpperCase()}
                      </div>
                      <p className="text-sm font-semibold text-foreground leading-relaxed">
                        {questions[currentIdx]?.question}
                      </p>
                    </div>

                    <Textarea value={answerInput} onChange={e => setAnswerInput(e.target.value)}
                      placeholder="Type your answer here... Take your time, think it through."
                      rows={4} className="bg-secondary border-none resize-none text-sm" />

                    <div className="flex gap-2">
                      <Button className="flex-1 gap-1.5" onClick={submitAnswer} disabled={loading}>
                        📨 Submit Answer
                      </Button>
                      <Button variant="outline" className="gap-1.5 border-glass-border"
                        onClick={skipQuestion} disabled={loading}>
                        <SkipForward className="h-4 w-4" /> Skip
                      </Button>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* ── FEEDBACK ─────────────────────────────────────────── */}
            {stage === "feedback" && (
              <motion.div key="feedback" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                className="space-y-4">

                {loading && !feedback && (
                  <div className="flex flex-col items-center justify-center py-12 gap-3">
                    <span className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    <p className="text-sm text-muted-foreground">Analyzing your performance...</p>
                  </div>
                )}

                {feedback && (
                  <>
                    {/* Verdict */}
                    {(() => {
                      const v = feedback.verdict;
                      const isStrong = v.includes("Strong");
                      const isGood = v.includes("Good");
                      const color = isStrong ? "success" : isGood ? "warning" : "destructive";
                      return (
                        <div className={cn("rounded-xl border p-4 text-center",
                          `bg-${color}/5 border-${color}/20`)}>
                          <p className="text-xs font-mono text-muted-foreground mb-1">VERDICT</p>
                          <p className={cn("text-lg font-bold", `text-${color}`)}>{v}</p>
                          <p className="text-xs text-muted-foreground mt-1">{feedback.summary}</p>
                        </div>
                      );
                    })()}

                    {/* Score cards */}
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        ["Overall", feedback.overall_score],
                        ["Communication", feedback.communication_score],
                        ["Technical", feedback.technical_score],
                        ["Confidence", feedback.confidence_score],
                      ].map(([label, val]) => (
                        <div key={label} className="rounded-xl bg-secondary/60 p-3 text-center">
                          <div className={cn("text-2xl font-bold font-mono", scoreColor(val as number))}>
                            {val}
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
                        </div>
                      ))}
                    </div>

                    {/* Score bars */}
                    <div className="rounded-xl bg-secondary/40 p-4 space-y-3">
                      <ScoreBar label="Communication" value={feedback.communication_score} />
                      <ScoreBar label="Technical" value={feedback.technical_score} />
                      <ScoreBar label="Confidence" value={feedback.confidence_score} />
                      <ScoreBar label="Overall" value={feedback.overall_score} />
                    </div>

                    {/* Strengths / Weaknesses / Suggestions */}
                    <div className="grid grid-cols-1 gap-2">
                      {[
                        { label: "✅ Strengths", items: feedback.strengths, color: "success" },
                        { label: "❌ Areas to Improve", items: feedback.weaknesses, color: "destructive" },
                        { label: "💡 Suggestions", items: feedback.suggestions, color: "warning" },
                      ].map(({ label, items, color }) => (
                        <div key={label} className="rounded-xl bg-secondary/40 p-3">
                          <p className="text-xs font-mono text-muted-foreground mb-2">{label}</p>
                          <ul className="space-y-1">
                            {items.map((item, i) => (
                              <li key={i} className={cn("text-xs pl-2 border-l-2 py-0.5", `border-${color} text-foreground`)}>
                                {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>

                    {/* Per question breakdown */}
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-2">📝 Question Breakdown</p>
                      <div className="space-y-1.5">
                        {feedback.per_question.map((item) => {
                          const qObj = questions[item.question_id - 1];
                          const ans = answers[item.question_id - 1];
                          const isOpen = expandedQ === item.question_id;
                          return (
                            <div key={item.question_id} className="rounded-xl bg-secondary/40 overflow-hidden">
                              <button className="w-full flex items-center justify-between px-3 py-2.5 text-left"
                                onClick={() => setExpandedQ(isOpen ? null : item.question_id)}>
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className="text-xs font-mono text-primary shrink-0">Q{item.question_id}</span>
                                  <span className="text-xs text-foreground truncate">
                                    {qObj?.question?.slice(0, 50)}...
                                  </span>
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0">
                                  <span className={cn("text-xs font-mono font-bold", scoreColor(item.score))}>
                                    {item.score}/100
                                  </span>
                                  {isOpen ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
                                    : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
                                </div>
                              </button>
                              {isOpen && (
                                <div className="px-3 pb-3 space-y-2 border-t border-border/50 pt-2">
                                  <div>
                                    <p className="text-xs font-mono text-muted-foreground mb-1">QUESTION</p>
                                    <p className="text-xs font-semibold text-foreground">{qObj?.question}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs font-mono text-muted-foreground mb-1">YOUR ANSWER</p>
                                    <p className="text-xs text-muted-foreground bg-secondary/60 rounded-lg p-2">{ans}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs font-mono text-muted-foreground mb-1">FEEDBACK</p>
                                    <p className="text-xs text-foreground">{item.comment}</p>
                                  </div>
                                  <div className="border-l-2 border-warning pl-2">
                                    <p className="text-xs text-warning">💡 {item.ideal_answer_hint}</p>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Next steps */}
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-2">🎯 Next Steps</p>
                      <div className="space-y-1.5">
                        {feedback.next_steps.map((step, i) => (
                          <div key={i} className="flex items-start gap-2.5 rounded-xl bg-secondary/40 px-3 py-2.5">
                            <span className="text-xs font-mono text-primary shrink-0">
                              {String(i + 1).padStart(2, "0")}
                            </span>
                            <span className="text-xs text-foreground">{step}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <Button variant="outline" className="w-full border-glass-border gap-2" onClick={resetAll}>
                      <RotateCcw className="h-4 w-4" /> Start New Interview
                    </Button>
                  </>
                )}
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}