import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { profile: true },
  });

  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  return NextResponse.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      image: user.image,
      profile: user.profile,
    },
  });
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { name, phone, targetCompany, yearsExperience, location, skills, onboarded } = body;

  // Update base user fields
  const userUpdate: Record<string, string> = {};
  if (name !== undefined) userUpdate.name = name;
  if (phone !== undefined) userUpdate.phone = phone;

  if (Object.keys(userUpdate).length > 0) {
    await prisma.user.update({
      where: { id: session.user.id },
      data: userUpdate,
    });
  }

  // Upsert career profile fields
  const profileFields: Record<string, unknown> = {};
  if (targetCompany !== undefined) profileFields.targetCompany = targetCompany;
  if (yearsExperience !== undefined) profileFields.yearsExperience = yearsExperience;
  if (location !== undefined) profileFields.location = location;
  if (skills !== undefined) profileFields.skills = skills;
  if (onboarded !== undefined) profileFields.onboarded = onboarded;

  if (Object.keys(profileFields).length > 0) {
    await prisma.userProfile.upsert({
      where: { userId: session.user.id },
      create: { userId: session.user.id, ...profileFields },
      update: profileFields,
    });
  }

  const updatedUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { profile: true },
  });

  return NextResponse.json({ user: updatedUser });
}