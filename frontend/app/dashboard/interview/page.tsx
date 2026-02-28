"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Mic, Timer, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChatBubble } from '@/components/ChatBubble';
import { ScoreBar } from '@/components/ScoreBar';
import { CardSkeleton } from '@/components/LoaderSkeleton';
import { mockInterviewQuestions, mockInterviewFeedback, simulateDelay } from '@/lib/mock-data';
import { cn } from '@/lib/utils';

export default function InterviewGuide() {
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState([
    { text: "Hi! I'm your AI Interview Coach. Ask me anything about preparing for your next interview, or start a mock session.", isAI: true },
  ]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [mockMode, setMockMode] = useState(false);
  const [currentQ, setCurrentQ] = useState(0);
  const [timer, setTimer] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);

  useEffect(() => {
    simulateDelay(1000).then(() => setLoading(false));
  }, []);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (timerActive) {
      interval = setInterval(() => setTimer(t => t + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [timerActive]);

  const sendMessage = () => {
    if (!input.trim()) return;
    setMessages(m => [...m, { text: input, isAI: false }]);
    setInput('');
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      setMessages(m => [...m, {
        text: "Great question! For behavioral interviews, use the STAR method: Situation, Task, Action, Result. This structure helps you give concise, impactful answers.",
        isAI: true,
      }]);
    }, 2000);
  };

  const startMock = () => {
    setMockMode(true);
    setCurrentQ(0);
    setTimer(0);
    setTimerActive(true);
    setShowFeedback(false);
  };

  const submitAnswer = () => {
    if (currentQ < mockInterviewQuestions.length - 1) {
      setCurrentQ(q => q + 1);
      setTimer(0);
    } else {
      setTimerActive(false);
      setShowFeedback(true);
    }
  };

  if (loading) return <div className="grid gap-6 lg:grid-cols-2"><CardSkeleton /><CardSkeleton /></div>;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Chat */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card flex flex-col" style={{ height: '70vh' }}>
        <div className="border-b border-border p-4">
          <h3 className="text-sm font-medium text-foreground">AI Interview Coach</h3>
        </div>
        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          {messages.map((m, i) => <ChatBubble key={i} message={m.text} isAI={m.isAI} />)}
          {typing && (
            <div className="flex items-center gap-1 px-4 py-2">
              <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: '0ms' }} />
              <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: '150ms' }} />
              <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: '300ms' }} />
            </div>
          )}
        </div>
        <div className="border-t border-border p-4">
          <div className="flex gap-2">
            <Input
              placeholder="Ask about interview prep..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMessage()}
              className="bg-secondary border-none"
            />
            <Button size="icon" onClick={sendMessage}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Right Panel */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <Tabs defaultValue="questions" className="space-y-4">
          <TabsList className="bg-secondary">
            <TabsTrigger value="questions">Questions</TabsTrigger>
            <TabsTrigger value="mock">Mock Interview</TabsTrigger>
            <TabsTrigger value="feedback">Feedback</TabsTrigger>
          </TabsList>

          <TabsContent value="questions" className="space-y-3">
            {mockInterviewQuestions.map(q => (
              <div key={q.id} className="glass-card-hover p-4">
                <div className="mb-2 flex items-center gap-2">
                  <span className={cn(
                    'rounded-full px-2 py-0.5 text-xs font-medium',
                    q.difficulty === 'Easy' && 'bg-success/10 text-success',
                    q.difficulty === 'Medium' && 'bg-warning/10 text-warning',
                    q.difficulty === 'Hard' && 'bg-destructive/10 text-destructive',
                  )}>{q.difficulty}</span>
                  <span className="text-xs text-muted-foreground">{q.category}</span>
                </div>
                <p className="text-sm text-foreground">{q.question}</p>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="mock" className="space-y-4">
            <AnimatePresence mode="wait">
              {!mockMode && !showFeedback && (
                <motion.div key="start" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="glass-card p-8 text-center">
                  <Play className="mx-auto mb-4 h-12 w-12 text-primary" />
                  <h3 className="mb-2 text-lg font-semibold text-foreground">Start Mock Interview</h3>
                  <p className="mb-6 text-sm text-muted-foreground">Answer questions under timed conditions.</p>
                  <Button onClick={startMock}>Begin Session</Button>
                </motion.div>
              )}

              {mockMode && !showFeedback && (
                <motion.div key="active" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Question {currentQ + 1}/{mockInterviewQuestions.length}</span>
                    <div className="flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-sm text-foreground">
                      <Timer className="h-3.5 w-3.5" />
                      {Math.floor(timer / 60)}:{String(timer % 60).padStart(2, '0')}
                    </div>
                  </div>
                  <div className="glass-card p-6">
                    <span className={cn(
                      'mb-3 inline-block rounded-full px-2 py-0.5 text-xs font-medium',
                      mockInterviewQuestions[currentQ].difficulty === 'Easy' && 'bg-success/10 text-success',
                      mockInterviewQuestions[currentQ].difficulty === 'Medium' && 'bg-warning/10 text-warning',
                      mockInterviewQuestions[currentQ].difficulty === 'Hard' && 'bg-destructive/10 text-destructive',
                    )}>
                      {mockInterviewQuestions[currentQ].difficulty}
                    </span>
                    <p className="text-foreground">{mockInterviewQuestions[currentQ].question}</p>
                  </div>
                  <div className="flex gap-3">
                    <Button variant="outline" className="flex-1 gap-2">
                      <Mic className="h-4 w-4" /> Record Answer
                    </Button>
                    <Button onClick={submitAnswer} className="flex-1">Submit</Button>
                  </div>
                </motion.div>
              )}

              {showFeedback && (
                <motion.div key="feedback" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-card space-y-6 p-6">
                  <h3 className="text-lg font-semibold text-foreground">Performance Feedback</h3>
                  <ScoreBar label="Communication" value={mockInterviewFeedback.communication} />
                  <ScoreBar label="Technical" value={mockInterviewFeedback.technical} />
                  <ScoreBar label="Confidence" value={mockInterviewFeedback.confidence} />
                  <div className="border-t border-border pt-4">
                    <ScoreBar label="Overall Score" value={mockInterviewFeedback.overall} />
                  </div>
                  <Button variant="outline" onClick={() => { setMockMode(false); setShowFeedback(false); }}>
                    Retake
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </TabsContent>

          <TabsContent value="feedback" className="glass-card space-y-6 p-6">
            <h3 className="text-sm font-medium text-muted-foreground">Latest Session Feedback</h3>
            <ScoreBar label="Communication" value={mockInterviewFeedback.communication} />
            <ScoreBar label="Technical" value={mockInterviewFeedback.technical} />
            <ScoreBar label="Confidence" value={mockInterviewFeedback.confidence} />
            <ScoreBar label="Overall" value={mockInterviewFeedback.overall} />
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}
