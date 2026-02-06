"use server";

import { db } from "@/db";
import { mortgages, mortgageMembers } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireUserId, verifyMortgageAccess } from "@/lib/auth";
import { getActiveMortgageId } from "@/lib/active-mortgage";

export async function getMortgage(mortgageId?: string) {
  const userId = await requireUserId();

  if (mortgageId) {
    await verifyMortgageAccess(mortgageId, userId);
    const mortgage = await db.query.mortgages.findFirst({
      where: eq(mortgages.id, mortgageId),
      with: {
        bankOffers: {
          with: {
            tracks: true,
            contacts: true,
          },
        },
        contacts: true,
      },
    });
    return mortgage ?? null;
  }

  const activeMortgageId = await getActiveMortgageId();
  if (activeMortgageId) {
    try {
      await verifyMortgageAccess(activeMortgageId, userId);
      const mortgage = await db.query.mortgages.findFirst({
        where: eq(mortgages.id, activeMortgageId),
        with: {
          bankOffers: {
            with: {
              tracks: true,
              contacts: true,
            },
          },
          contacts: true,
        },
      });
      if (mortgage) return mortgage;
    } catch {
      // Cookie points to inaccessible mortgage, fall through
    }
  }

  const ownedMortgage = await db.query.mortgages.findFirst({
    where: eq(mortgages.userId, userId),
    with: {
      bankOffers: {
        with: {
          tracks: true,
          contacts: true,
        },
      },
      contacts: true,
    },
    orderBy: [desc(mortgages.createdAt)],
  });

  if (ownedMortgage) return ownedMortgage;

  const accessibleMortgages = await getUserMortgages(userId);
  if (accessibleMortgages.length === 0) return null;

  const firstAccessible = await db.query.mortgages.findFirst({
    where: eq(mortgages.id, accessibleMortgages[0].id),
    with: {
      bankOffers: {
        with: {
          tracks: true,
          contacts: true,
        },
      },
      contacts: true,
    },
  });

  return firstAccessible ?? null;
}

export async function createMortgage(formData: FormData) {
  const userId = await requireUserId();
  const propertyValue = formData.get("propertyValue") as string;
  const loanAmount = formData.get("loanAmount") as string;
  const mortgageTermYears = formData.get("mortgageTermYears") as string;
  const notes = formData.get("notes") as string;

  const [result] = await db
    .insert(mortgages)
    .values({
      userId,
      propertyValue: propertyValue || null,
      loanAmount: loanAmount || null,
      mortgageTermYears: mortgageTermYears ? parseInt(mortgageTermYears, 10) : null,
      notes: notes || null,
    })
    .returning({ id: mortgages.id });

  revalidatePath("/");
  return result;
}

export async function updateMortgage(id: string, formData: FormData) {
  const userId = await requireUserId();
  const propertyValue = formData.get("propertyValue") as string;
  const loanAmount = formData.get("loanAmount") as string;
  const mortgageTermYears = formData.get("mortgageTermYears") as string;
  const notes = formData.get("notes") as string;

  await verifyMortgageAccess(id, userId);

  await db
    .update(mortgages)
    .set({
      propertyValue: propertyValue || null,
      loanAmount: loanAmount || null,
      mortgageTermYears: mortgageTermYears ? parseInt(mortgageTermYears, 10) : null,
      notes: notes || null,
      updatedAt: new Date(),
    })
    .where(eq(mortgages.id, id));

  revalidatePath("/");
}

export async function getDashboardData() {
  const mortgage = await getMortgage();
  if (!mortgage) {
    return { mortgage: null, stats: null };
  }

  const offers = mortgage.bankOffers;
  const allTracks = offers.flatMap((o) => o.tracks);

  const totalOffers = offers.length;
  const activeOffers = offers.filter(
    (o) => o.status === "in_progress" || o.status === "offer_received"
  ).length;

  const totalTrackAmount = allTracks.reduce(
    (sum, t) => sum + parseFloat(t.amount),
    0
  );

  const weightedInterestRate =
    totalTrackAmount > 0
      ? allTracks.reduce(
          (sum, t) => sum + parseFloat(t.interestRate) * parseFloat(t.amount),
          0
        ) / totalTrackAmount
      : 0;

  return {
    mortgage,
    stats: {
      totalOffers,
      activeOffers,
      totalTrackAmount,
      weightedInterestRate,
    },
  };
}

export async function getUserMortgages(userId: string) {
  const ownedMortgages = await db.query.mortgages.findMany({
    where: eq(mortgages.userId, userId),
    with: {
      bankOffers: { columns: { id: true } },
    },
  });

  const memberships = await db.query.mortgageMembers.findMany({
    where: eq(mortgageMembers.userId, userId),
    with: {
      mortgage: {
        with: {
          bankOffers: { columns: { id: true } },
        },
      },
    },
  });

  const owned = ownedMortgages.map((m) => ({
    ...m,
    role: "owner" as const,
    offersCount: m.bankOffers.length,
  }));

  const member = memberships.map((membership) => ({
    ...membership.mortgage,
    role: "member" as const,
    offersCount: membership.mortgage.bankOffers.length,
  }));

  return [...owned, ...member];
}
