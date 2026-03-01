import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const resumes = await prisma.resume.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      filename: true,
      semanticScore: true,
      atsScore: true,
      keywordDensity: true,
      resumeSkills: true,
      missingSkills: true,
      status: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ resumes });
}