"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface OtpInputProps {
  email: string;
  onVerified: () => void;
}

export function OtpInput({ email, onVerified }: OtpInputProps) {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [verified, setVerified] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(""));
      inputRefs.current[5]?.focus();
    }
  };

  const handleVerify = async () => {
    const code = otp.join("");
    if (code.length < 6) {
      toast.error("Please enter the full 6-digit code");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      const data = await res.json();
      if (res.ok) {
        setVerified(true);
        setTimeout(() => onVerified(), 800);
      } else {
        toast.error(data.error || "Invalid code");
        setOtp(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
      }
    } catch {
      toast.error("Verification failed");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, type: "verify" }),
      });
      if (res.ok) {
        toast.success("New code sent!");
        setOtp(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
      } else {
        toast.error("Failed to resend code");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setResending(false);
    }
  };

  if (verified) {
    return (
      <div className="flex flex-col items-center py-6 gap-3">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-success/10">
          <CheckCircle className="h-7 w-7 text-success" />
        </div>
        <p className="text-sm font-medium text-foreground">Verified!</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* OTP Boxes */}
      <div className="flex gap-2 justify-center" onPaste={handlePaste}>
        {otp.map((digit, i) => (
          <input
            key={i}
            ref={(el) => { inputRefs.current[i] = el; }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            className={cn(
              "h-12 w-11 rounded-xl border text-center text-lg font-bold transition-all outline-none",
              "bg-secondary text-foreground",
              digit
                ? "border-primary/60 shadow-[0_0_0_2px_hsl(var(--primary)/0.2)]"
                : "border-glass-border focus:border-primary/60 focus:shadow-[0_0_0_2px_hsl(var(--primary)/0.2)]"
            )}
          />
        ))}
      </div>

      <Button
        onClick={handleVerify}
        className="w-full"
        disabled={loading || otp.join("").length < 6}
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
        Verify Code
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Didn&apos;t receive the code?{" "}
        <button
          onClick={handleResend}
          disabled={resending}
          className="text-primary hover:underline font-medium disabled:opacity-50"
        >
          {resending ? "Sending..." : "Resend"}
        </button>
      </p>
    </div>
  );
}
