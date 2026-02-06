"use server";

import { db } from "@/db";
import { mortgages, mortgageInvites, mortgageMembers } from "@/db/schema";
import { eq, and, isNull, gt } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireUserId, verifyMortgageAccess } from "@/lib/auth";
import { setActiveMortgageId } from "@/lib/active-mortgage";
import { clerkClient } from "@clerk/nextjs/server";

export async function createInvite(mortgageId: string) {
  const userId = await requireUserId();

  // Verify user is the OWNER (not just a member)
  const mortgage = await db.query.mortgages.findFirst({
    where: eq(mortgages.id, mortgageId),
    columns: { userId: true },
  });

  if (!mortgage || mortgage.userId !== userId) {
    throw new Error("Unauthorized - only owner can create invites");
  }

  // Invalidate any existing active invites
  await db
    .update(mortgageInvites)
    .set({ usedAt: new Date() })
    .where(
      and(
        eq(mortgageInvites.mortgageId, mortgageId),
        isNull(mortgageInvites.usedAt)
      )
    );

  // Generate new invite
  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  const [invite] = await db
    .insert(mortgageInvites)
    .values({
      mortgageId,
      token,
      createdByUserId: userId,
      expiresAt,
    })
    .returning();

  return { token: invite.token };
}

export async function getActiveInvite(mortgageId: string) {
  const userId = await requireUserId();

  // Verify user is the owner
  const mortgage = await db.query.mortgages.findFirst({
    where: eq(mortgages.id, mortgageId),
    columns: { userId: true },
  });

  if (!mortgage || mortgage.userId !== userId) {
    throw new Error("Unauthorized - only owner can view invites");
  }

  const invite = await db.query.mortgageInvites.findFirst({
    where: and(
      eq(mortgageInvites.mortgageId, mortgageId),
      isNull(mortgageInvites.usedAt),
      gt(mortgageInvites.expiresAt, new Date())
    ),
  });

  return invite ?? null;
}

export async function acceptInvite(token: string) {
  const userId = await requireUserId();

  // Find invite
  const invite = await db.query.mortgageInvites.findFirst({
    where: and(
      eq(mortgageInvites.token, token),
      isNull(mortgageInvites.usedAt),
      gt(mortgageInvites.expiresAt, new Date())
    ),
  });

  if (!invite) {
    throw new Error("Invalid or expired invite link");
  }

  // Cannot accept own invite
  if (userId === invite.createdByUserId) {
    throw new Error("Cannot accept your own invite");
  }

  // Check if already a member (idempotent)
  const existingMember = await db.query.mortgageMembers.findFirst({
    where: and(
      eq(mortgageMembers.mortgageId, invite.mortgageId),
      eq(mortgageMembers.userId, userId)
    ),
  });

  if (existingMember) {
    // Already a member - just set active and redirect
    await setActiveMortgageId(invite.mortgageId);
    return { mortgageId: invite.mortgageId };
  }

  // Insert membership
  await db.insert(mortgageMembers).values({
    mortgageId: invite.mortgageId,
    userId,
  });

  // Mark invite as used
  await db
    .update(mortgageInvites)
    .set({
      usedByUserId: userId,
      usedAt: new Date(),
    })
    .where(eq(mortgageInvites.id, invite.id));

  // Set as active mortgage
  await setActiveMortgageId(invite.mortgageId);

  revalidatePath("/");

  return { mortgageId: invite.mortgageId };
}

export async function getMembers(mortgageId: string) {
  const userId = await requireUserId();

  // Verify access (owner or member)
  await verifyMortgageAccess(mortgageId, userId);

  // Get mortgage owner
  const mortgage = await db.query.mortgages.findFirst({
    where: eq(mortgages.id, mortgageId),
    columns: { userId: true },
  });

  if (!mortgage) {
    throw new Error("Mortgage not found");
  }

  // Get all members
  const members = await db.query.mortgageMembers.findMany({
    where: eq(mortgageMembers.mortgageId, mortgageId),
  });

  // Fetch Clerk user info for all users (owner + members)
  const userIds = [mortgage.userId, ...members.map((m) => m.userId)];
  const clerk = await clerkClient();
  const usersPromises = userIds.map((id) =>
    clerk.users.getUser(id).catch(() => null)
  );
  const users = await Promise.all(usersPromises);

  // Build result
  const result = [];

  // Add owner
  const ownerUser = users[0];
  result.push({
    userId: mortgage.userId,
    firstName: ownerUser?.firstName ?? "Unknown",
    lastName: ownerUser?.lastName ?? "User",
    email: ownerUser?.emailAddresses[0]?.emailAddress ?? "",
    imageUrl: ownerUser?.imageUrl ?? "",
    role: "owner" as const,
    joinedAt: null, // Owner doesn't have joinedAt
  });

  // Add members
  members.forEach((member, idx) => {
    const user = users[idx + 1]; // +1 because owner is at index 0
    result.push({
      userId: member.userId,
      firstName: user?.firstName ?? "Unknown",
      lastName: user?.lastName ?? "User",
      email: user?.emailAddresses[0]?.emailAddress ?? "",
      imageUrl: user?.imageUrl ?? "",
      role: "member" as const,
      joinedAt: member.joinedAt,
    });
  });

  return result;
}

export async function removeMember(mortgageId: string, memberUserId: string) {
  const userId = await requireUserId();

  // Get mortgage to check ownership
  const mortgage = await db.query.mortgages.findFirst({
    where: eq(mortgages.id, mortgageId),
    columns: { userId: true },
  });

  if (!mortgage) {
    throw new Error("Mortgage not found");
  }

  const isOwner = mortgage.userId === userId;
  const isSelf = memberUserId === userId;

  // Authorization rules:
  // - Owner can remove any member (except themselves)
  // - Member can only remove themselves (leave)
  if (isOwner) {
    if (isSelf) {
      throw new Error("Owner cannot remove themselves");
    }
    // Owner removing a member - allowed
  } else {
    if (!isSelf) {
      throw new Error("Members can only remove themselves");
    }
    // Member removing themselves - allowed
  }

  // Delete membership
  await db
    .delete(mortgageMembers)
    .where(
      and(
        eq(mortgageMembers.mortgageId, mortgageId),
        eq(mortgageMembers.userId, memberUserId)
      )
    );

  revalidatePath("/");
  revalidatePath("/members");
}
