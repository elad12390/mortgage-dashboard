"use server";

import { db } from "@/db";
import { mortgages } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireUserId } from "@/lib/auth";

export async function getMortgage() {
  const userId = await requireUserId();

  const mortgage = await db.query.mortgages.findFirst({
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

  return mortgage ?? null;
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

  await db
    .update(mortgages)
    .set({
      propertyValue: propertyValue || null,
      loanAmount: loanAmount || null,
      mortgageTermYears: mortgageTermYears ? parseInt(mortgageTermYears, 10) : null,
      notes: notes || null,
      updatedAt: new Date(),
    })
    .where(and(eq(mortgages.id, id), eq(mortgages.userId, userId)));

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
