"use client";

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp } from 'lucide-react';
import { CardSkeleton } from '@/components/LoaderSkeleton';
import { mockMarketTrends, mockMarketRoles, simulateDelay } from '@/lib/mock-data';
import { cn } from '@/lib/utils';

export default function MarketAnalyzer() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    simulateDelay(1300).then(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <CardSkeleton />
        <div className="grid gap-6 md:grid-cols-2"><CardSkeleton /><CardSkeleton /></div>
      </div>
    );
  }

  const chartStyle = {
    backgroundColor: 'hsl(var(--card))',
    border: '1px solid hsl(var(--border))',
    borderRadius: '0.75rem',
    color: 'hsl(var(--foreground))',
  };

  return (
    <div className="space-y-6">
      {/* Summary */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-primary/10 p-2.5">
            <TrendingUp className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">Skills vs Market</h3>
            <p className="text-sm text-muted-foreground">Your profile matches 72% of high-demand roles. Focus on System Design and DevOps to unlock senior positions.</p>
          </div>
        </div>
      </motion.div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-6">
          <h3 className="mb-4 text-sm font-medium text-muted-foreground">Demand Trend</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={mockMarketTrends}>
              <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={chartStyle} />
              <Line type="monotone" dataKey="demand" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-6">
          <h3 className="mb-4 text-sm font-medium text-muted-foreground">Salary Insights (avg $k)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={mockMarketTrends}>
              <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={chartStyle} />
              <Bar dataKey="salary" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Role Cards */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <h3 className="mb-4 text-sm font-medium text-muted-foreground">Role Suggestions</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {mockMarketRoles.map(role => (
            <div key={role.id} className="glass-card-hover p-5">
              <div className="mb-3 flex items-center justify-between">
                <h4 className="text-sm font-semibold text-foreground">{role.title}</h4>
                <span className={cn(
                  'rounded-full px-2 py-0.5 text-xs font-medium',
                  role.demandLevel === 'High' && 'bg-success/10 text-success',
                  role.demandLevel === 'Medium' && 'bg-warning/10 text-warning',
                  role.demandLevel === 'Low' && 'bg-destructive/10 text-destructive',
                )}>{role.demandLevel}</span>
              </div>
              <div className="space-y-1.5 text-sm text-muted-foreground">
                <div className="flex justify-between">
                  <span>Match</span>
                  <span className="font-medium text-primary">{role.matchPercentage}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Salary</span>
                  <span className="font-medium text-foreground">{role.salaryRange}</span>
                </div>
              </div>
              <div className="mt-3 h-1.5 w-full rounded-full bg-secondary">
                <div className="h-1.5 rounded-full bg-primary transition-all" style={{ width: `${role.matchPercentage}%` }} />
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
