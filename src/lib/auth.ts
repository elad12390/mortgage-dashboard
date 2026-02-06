import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { mortgages, mortgageMembers, bankOffers } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function requireUserId(): Promise<string> {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }
  return userId;
}

export async function verifyMortgageAccess(mortgageId: string, userId: string) {
  // Check if user is the owner
  const mortgage = await db.query.mortgages.findFirst({
    where: eq(mortgages.id, mortgageId),
    columns: { id: true, userId: true },
  });

  if (!mortgage) {
    throw new Error("Unauthorized");
  }

  // If user is the owner, allow access
  if (mortgage.userId === userId) {
    return mortgage;
  }

  // If not owner, check if user is a member
  const member = await db.query.mortgageMembers.findFirst({
    where: and(
      eq(mortgageMembers.mortgageId, mortgageId),
      eq(mortgageMembers.userId, userId)
    ),
  });

  if (!member) {
    throw new Error("Unauthorized");
  }

  return mortgage;
}

export async function verifyOfferAccess(offerId: string, userId: string) {
  const offer = await db.query.bankOffers.findFirst({
    where: eq(bankOffers.id, offerId),
    with: { mortgage: { columns: { userId: true, id: true } } },
  });

  if (!offer) {
    throw new Error("Unauthorized");
  }

  // Verify access to the mortgage (owner or member)
  await verifyMortgageAccess(offer.mortgageId, userId);

  return offer;
}
