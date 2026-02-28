"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, FileText, MessageSquare, TrendingUp,
  FileDown, Zap, ChevronLeft, Menu, User, LogOut, Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";
import { useSession, signOut } from "next-auth/react";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Overview", exact: true },
  { href: "/dashboard/resume", icon: FileText, label: "Resume Analyzer" },
  { href: "/dashboard/interview", icon: MessageSquare, label: "Interview Guide" },
  { href: "/dashboard/market", icon: TrendingUp, label: "Market Insights" },
  { href: "/dashboard/report", icon: FileDown, label: "Generate Report" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();

  const currentPage = navItems.find((n) =>
    n.exact ? pathname === n.href : pathname.startsWith(n.href) && !n.exact
  );

  const getInitials = (name?: string | null) => {
    if (!name) return "U";
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className={cn(
        "fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-border bg-card/50 backdrop-blur-xl transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}>
        <div className="flex h-16 items-center justify-between border-b border-border px-4">
          {!collapsed && (
            <Link href="/" className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              <span className="font-bold text-foreground">CareerPilot</span>
            </Link>
          )}
          <Button variant="ghost" size="icon" onClick={() => setCollapsed(!collapsed)} className="h-8 w-8 ml-auto">
            {collapsed ? <Menu className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>

        <nav className="flex-1 space-y-1 p-3">
          {navItems.map((item) => {
            const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                  isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}>
                <item.icon className="h-4 w-4 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Bottom section — theme toggle + user */}
        <div className="border-t border-border p-3 space-y-1">
          <ThemeToggle collapsed={collapsed} />

          {!collapsed && session?.user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex w-full items-center gap-3 rounded-xl p-2 hover:bg-secondary transition-colors">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={session.user.image ?? undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                      {getInitials(session.user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-sm font-medium text-foreground truncate">{session.user.name || "User"}</p>
                    <p className="text-xs text-muted-foreground truncate">{session.user.email}</p>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52 bg-card border-glass-border">
                <DropdownMenuItem onClick={() => router.push("/profile")} className="gap-2 cursor-pointer">
                  <User className="h-4 w-4" /> Profile
                </DropdownMenuItem>
                <DropdownMenuItem className="gap-2 cursor-pointer">
                  <Settings className="h-4 w-4" /> Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-border" />
                <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/" })} className="gap-2 cursor-pointer text-destructive focus:text-destructive">
                  <LogOut className="h-4 w-4" /> Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : collapsed ? (
            <Avatar className="h-8 w-8 mx-auto">
              <AvatarImage src={session?.user?.image ?? undefined} />
              <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                {getInitials(session?.user?.name)}
              </AvatarFallback>
            </Avatar>
          ) : null}
        </div>
      </aside>

      {/* Main Content */}
      <main className={cn("flex-1 transition-all duration-300", collapsed ? "ml-16" : "ml-64")}>
        {/* Top Bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/80 px-6 backdrop-blur-xl">
          <h2 className="text-lg font-semibold text-foreground">
            {currentPage?.label || "Dashboard"}
          </h2>
          <div className="flex items-center gap-3">
            <div className="rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
              Score: 78
            </div>
            <Link href="/profile">
              <Avatar className="h-8 w-8 cursor-pointer ring-2 ring-transparent hover:ring-primary/30 transition-all">
                <AvatarImage src={session?.user?.image ?? undefined} />
                <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                  {getInitials(session?.user?.name)}
                </AvatarFallback>
              </Avatar>
            </Link>
          </div>
        </header>

        <div className="p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}