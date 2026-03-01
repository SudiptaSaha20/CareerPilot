"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FileText, Target, TrendingUp, Zap, Activity } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { DashboardCard } from "@/components/DashboardCard";
import { ProgressRing } from "@/components/ProgressRing";
import { AnimatedCounter } from "@/components/AnimatedCounter";
import { CardSkeleton } from "@/components/LoaderSkeleton";
import {
  mockDashboardStats,
  mockMarketTrends,
  mockMarketRoles,
  mockActivities,
  simulateDelay,
} from "@/lib/mock-data";

export default function DashboardOverview() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    simulateDelay(1200).then(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <DashboardCard title="Resume Score" icon={FileText} subtitle="+5 from last update">
          <div className="mt-3">
            <AnimatedCounter value={mockDashboardStats.resumeScore} suffix="%" className="text-3xl font-bold text-foreground" />
          </div>
        </DashboardCard>
        <DashboardCard title="Skill Match" icon={Target} subtitle="Based on target roles">
          <div className="mt-3">
            <AnimatedCounter value={mockDashboardStats.skillMatch} suffix="%" className="text-3xl font-bold text-foreground" />
          </div>
        </DashboardCard>
        <DashboardCard title="Interview Ready" icon={Zap} subtitle="Mock interview score">
          <div className="mt-3">
            <AnimatedCounter value={mockDashboardStats.interviewReadiness} suffix="%" className="text-3xl font-bold text-foreground" />
          </div>
        </DashboardCard>
        <DashboardCard title="Market Demand" icon={TrendingUp} subtitle="For your skill set">
          <div className="mt-3">
            <AnimatedCounter value={mockDashboardStats.marketDemand} suffix="%" className="text-3xl font-bold text-foreground" />
          </div>
        </DashboardCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card flex flex-col items-center justify-center p-8">
          <ProgressRing value={78} size={160} strokeWidth={10} label="Overall" />
          <p className="mt-4 text-sm text-muted-foreground">Resume Score</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card col-span-1 p-6 lg:col-span-2">
          <h3 className="mb-4 text-sm font-medium text-muted-foreground">Market Demand Trend</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={mockMarketTrends}>
              <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "0.75rem", color: "hsl(var(--foreground))" }} />
              <Line type="monotone" dataKey="demand" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass-card p-6">
          <h3 className="mb-4 text-sm font-medium text-muted-foreground">Suggested Roles</h3>
          <div className="space-y-3">
            {mockMarketRoles.slice(0, 4).map((role) => (
              <div key={role.id} className="flex items-center justify-between rounded-xl bg-secondary/50 px-4 py-3">
                <span className="text-sm font-medium text-foreground">{role.title}</span>
                <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">{role.matchPercentage}% match</span>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="glass-card p-6">
          <h3 className="mb-4 text-sm font-medium text-muted-foreground">Recent Activity</h3>
          <div className="space-y-3">
            {mockActivities.map((a) => (
              <div key={a.id} className="flex items-start gap-3">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary">
                  <Activity className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm text-foreground">{a.action}</p>
                  <p className="text-xs text-muted-foreground">{a.timestamp}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
