import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const resume = await prisma.resume.findFirst({
    where:   { userId: session.user.id, status: "complete" },
    orderBy: { createdAt: "desc" },
    select: {
      id:             true,
      filename:       true,
      jobDescription: true,
      semanticScore:  true,
      atsScore:       true,
      keywordDensity: true,
      resumeSkills:   true,
      jdSkills:       true,
      missingSkills:  true,
      analysis:       true,
      createdAt:      true,
    },
  });

  return NextResponse.json({ resume: resume ?? null });
}