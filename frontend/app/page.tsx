"use client";

import { ThemeToggle } from "@/components/theme-toggle";
import { motion } from "framer-motion";
import {
  ArrowRight,
  FileText,
  MessageSquare,
  TrendingUp,
  Upload,
  Sparkles,
  Zap,
  Target,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AuthModal } from "@/components/auth/auth-modal";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

const features = [
  {
    icon: FileText,
    title: "Resume Analyzer",
    description:
      "AI-powered resume scoring with actionable improvement suggestions tailored to your target roles.",
  },
  {
    icon: MessageSquare,
    title: "Interview Guide",
    description:
      "Practice with an AI interview coach. Get real-time feedback on your answers and presentation.",
  },
  {
    icon: TrendingUp,
    title: "Market Analyzer",
    description:
      "Discover salary trends, skill demand, and the best-fit roles based on your profile.",
  },
];

const steps = [
  {
    icon: Upload,
    title: "Upload",
    description: "Drop your resume and let our AI parse it instantly.",
  },
  {
    icon: Sparkles,
    title: "Analyze",
    description: "Get deep insights on skills, gaps, and market fit.",
  },
  {
    icon: Target,
    title: "Improve & Apply",
    description:
      "Follow personalized recommendations and land interviews.",
  },
];

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.15 } },
};

const item = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

export default function LandingPage() {
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const { data: session } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (session) {
      router.replace("/upload");
    }
  }, [session, router]);

  const handleGetStarted = () => {
    if (session) {
      router.push("/upload");
    } else {
      setAuthMode("signup");
      setAuthOpen(true);
    }
  };

  const handleSignIn = () => {
    setAuthMode("login");
    setAuthOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="fixed top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2">
            <Zap className="h-6 w-6 text-primary" />
            <span className="text-lg font-bold text-foreground">CareerPilot</span>
          </Link>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            {session ? (
              <Link href="/dashboard">
                <Button size="sm">Dashboard</Button>
              </Link>
            ) : (
              <>
                <Button variant="ghost" size="sm" onClick={handleSignIn}>
                  Sign In
                </Button>
                <Button size="sm" onClick={handleGetStarted}>
                  Get Started
                </Button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative flex min-h-screen items-center overflow-hidden pt-16">
        <div className="absolute inset-0 animated-gradient-bg opacity-60" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />

        <div className="relative z-10 mx-auto grid max-w-7xl gap-12 px-6 lg:grid-cols-2 lg:gap-16">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="flex flex-col justify-center"
          >
            <div className="mb-4 inline-flex w-fit items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              AI-Powered Career Intelligence
            </div>
            <h1 className="mb-6 text-4xl font-extrabold leading-tight text-foreground sm:text-5xl lg:text-6xl">
              Stop Applying Blindly.{" "}
              <span className="gradient-text">Apply Strategically.</span>
            </h1>
            <p className="mb-8 max-w-lg text-lg text-muted-foreground">
              CareerPilot analyzes your resume, prepares you for interviews, and
              reveals market insights — so every application counts.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button
                size="lg"
                className="gap-2 text-base animate-pulse-glow"
                onClick={handleGetStarted}
              >
                {session ? "Go to Dashboard" : "Upload Resume"} <ArrowRight className="h-4 w-4" />
              </Button>
              {!session && (
                <Button variant="outline" size="lg" className="text-base" onClick={handleSignIn}>
                  Sign In
                </Button>
              )}
              {!session && (
                <Link href="/dashboard">
                  <Button variant="ghost" size="lg" className="text-base text-muted-foreground hover:text-foreground">
                    Try Demo →
                  </Button>
                </Link>
              )}
            </div>
          </motion.div>

          {/* Floating UI Preview */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="hidden items-center justify-center lg:flex"
          >
            <div className="relative">
              <motion.div
                animate={{ y: [-10, 10, -10] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                className="glass-card w-80 space-y-4 p-6 shadow-2xl shadow-primary/10"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Resume Score</p>
                    <p className="text-xs text-muted-foreground">Analysis complete</p>
                  </div>
                </div>
                <div className="h-2 w-full rounded-full bg-secondary">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: "78%" }}
                    transition={{ duration: 2, delay: 1 }}
                    className="h-2 rounded-full bg-gradient-to-r from-primary to-accent"
                  />
                </div>
                <p className="text-right text-sm font-bold text-primary">78/100</p>
              </motion.div>

              <motion.div
                animate={{ y: [10, -10, 10] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                className="glass-card absolute -bottom-16 -left-20 w-64 space-y-3 p-5 shadow-2xl shadow-accent/10"
              >
                <p className="text-xs font-semibold text-foreground">Top Match</p>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Frontend Engineer</span>
                  <span className="rounded-full bg-success/10 px-2 py-0.5 text-xs font-medium text-success">92%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Fullstack Dev</span>
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">85%</span>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-16 text-center"
          >
            <h2 className="mb-4 text-3xl font-bold text-foreground sm:text-4xl">
              Your AI Career <span className="gradient-text">Command Center</span>
            </h2>
            <p className="mx-auto max-w-2xl text-muted-foreground">
              Three powerful modules working together to accelerate your job search.
            </p>
          </motion.div>

          <motion.div
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="grid gap-6 md:grid-cols-3"
          >
            {features.map((f) => (
              <motion.div key={f.title} variants={item} className="glass-card-hover p-8">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
                  <f.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mb-2 text-xl font-semibold text-foreground">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24">
        <div className="mx-auto max-w-5xl px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-16 text-center"
          >
            <h2 className="mb-4 text-3xl font-bold text-foreground sm:text-4xl">
              How It <span className="gradient-text">Works</span>
            </h2>
          </motion.div>

          <motion.div
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="grid gap-8 md:grid-cols-3"
          >
            {steps.map((s, i) => (
              <motion.div key={s.title} variants={item} className="relative text-center">
                <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 ring-1 ring-primary/20">
                  <s.icon className="h-7 w-7 text-primary" />
                </div>
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 rounded-full bg-primary px-2.5 py-0.5 text-xs font-bold text-primary-foreground">
                  {i + 1}
                </div>
                <h3 className="mb-2 text-lg font-semibold text-foreground">{s.title}</h3>
                <p className="text-sm text-muted-foreground">{s.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="glass-card p-12"
          >
            <h2 className="mb-4 text-3xl font-bold text-foreground">
              Ready to land your <span className="gradient-text">dream job</span>?
            </h2>
            <p className="mb-8 text-muted-foreground">
              Upload your resume and get actionable insights in under 60 seconds.
            </p>
            <Button
              size="lg"
              className="gap-2 text-base animate-pulse-glow"
              onClick={handleGetStarted}
            >
              Start Free Analysis <ArrowRight className="h-4 w-4" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="mx-auto max-w-7xl px-6 text-center text-sm text-muted-foreground">
          © 2026 CareerPilot. Built with AI.
        </div>
      </footer>

      {/* Auth Modal */}
      <AuthModal
        open={authOpen}
        onOpenChange={setAuthOpen}
        defaultMode={authMode}
      />
    </div>
  );
}
