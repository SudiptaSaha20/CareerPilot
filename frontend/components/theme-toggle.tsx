"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Sun, Moon, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface ThemeToggleProps {
  collapsed?: boolean;   // sidebar mode — shows icon only when collapsed
  iconOnly?: boolean;    // navbar mode — always just an icon button
}

export function ThemeToggle({ collapsed = false, iconOnly = false }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  const CurrentIcon =
    theme === "light" ? Sun :
    theme === "dark"  ? Moon :
    Monitor;

  const showIconOnly = iconOnly || collapsed;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size={showIconOnly ? "icon" : "sm"}
          className={cn(
            "text-muted-foreground hover:text-foreground",
            !showIconOnly && "gap-2 w-full justify-start px-3"
          )}
        >
          <CurrentIcon className="h-4 w-4" />
          {!showIconOnly && (
            <span className="text-sm capitalize">
              {theme === "system" ? "System" : theme}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-card border-glass-border">
        {[
          { value: "light",  label: "Light",  Icon: Sun },
          { value: "dark",   label: "Dark",   Icon: Moon },
          { value: "system", label: "System", Icon: Monitor },
        ].map(({ value, label, Icon }) => (
          <DropdownMenuItem
            key={value}
            onClick={() => setTheme(value)}
            className={cn("gap-2 cursor-pointer", theme === value && "text-primary")}
          >
            <Icon className="h-4 w-4" />
            {label}
            {theme === value && <span className="ml-auto text-xs text-primary">✓</span>}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}