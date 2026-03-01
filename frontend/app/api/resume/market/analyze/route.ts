import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const PYTHON_API = process.env.PYTHON_API_URL || "http://localhost:8000";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("resume") as File | null;

    if (!file) {
      return NextResponse.json({ error: "Resume file is required" }, { status: 400 });
    }

    const pyForm = new FormData();
    pyForm.append("resume", file);

    const pyRes = await fetch(`${PYTHON_API}/market/analyze`, {
      method: "POST",
      body: pyForm,
    });

    if (!pyRes.ok) {
      const err = await pyRes.json().catch(() => ({}));
      return NextResponse.json(
        { error: err.detail || "Market analysis failed" },
        { status: 500 }
      );
    }

    const analysis = await pyRes.json();

    // Save to MongoDB
    await prisma.marketAnalysis.create({
      data: {
        userId:         session.user.id,
        resumeFilename: file.name,
        skills:         analysis.skills ?? [],
        analysis:       analysis,
      },
    });

    return NextResponse.json(analysis);
  } catch (e) {
    console.error("[/api/market/analyze]", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// GET — latest market analysis for this user
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const latest = await prisma.marketAnalysis.findFirst({
    where:   { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ analysis: latest?.analysis ?? null });
}