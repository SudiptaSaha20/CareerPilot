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
    const jd   = formData.get("job_description") as string | null;

    if (!file || !jd?.trim()) {
      return NextResponse.json(
        { error: "Resume file and job description are required" },
        { status: 400 }
      );
    }

    // Forward to Python /ats/candidate
    const pyForm = new FormData();
    pyForm.append("resume", file);
    pyForm.append("job_description", jd);

    const pyRes = await fetch(`${PYTHON_API}/ats/candidate`, {
      method: "POST",
      body: pyForm,
    });

    if (!pyRes.ok) {
      const err = await pyRes.json().catch(() => ({}));
      return NextResponse.json(
        { error: err.detail || "Python API analysis failed" },
        { status: 500 }
      );
    }

    const analysis = await pyRes.json();

    // Save to MongoDB
    const resume = await prisma.resume.create({
      data: {
        userId:         session.user.id,
        filename:       file.name,
        jobDescription: jd,
        semanticScore:  analysis.semantic_score  ?? null,
        atsScore:       analysis.ats_score        ?? null,
        keywordDensity: analysis.keyword_density  ?? null,
        resumeSkills:   analysis.resume_skills    ?? [],
        jdSkills:       analysis.jd_skills        ?? [],
        missingSkills:  analysis.missing_skills   ?? [],
        status:         "complete",
        analysis:       analysis,
      },
    });

    return NextResponse.json({ resumeId: resume.id, ...analysis });
  } catch (e) {
    console.error("[/api/resume/analyze]", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}