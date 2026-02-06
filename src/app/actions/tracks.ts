"use server";

import { db } from "@/db";
import { mortgageTracks, bankOffers } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireUserId, verifyOfferAccess } from "@/lib/auth";

export async function createTrack(offerId: string, formData: FormData) {
  const userId = await requireUserId();
  await verifyOfferAccess(offerId, userId);

  const trackType = formData.get("trackType") as string;
  const interestRate = formData.get("interestRate") as string;
  const amount = formData.get("amount") as string;
  const periodMonths = formData.get("periodMonths") as string;
  const notes = formData.get("notes") as string;

  await db.insert(mortgageTracks).values({
    offerId,
    trackType: trackType as typeof mortgageTracks.$inferInsert.trackType,
    interestRate,
    amount,
    periodMonths: parseInt(periodMonths, 10),
    notes: notes || null,
  });

  revalidatePath(`/offers/${offerId}`);
  revalidatePath("/offers");
  revalidatePath("/");
}

export async function updateTrack(
  trackId: string,
  offerId: string,
  formData: FormData
) {
  const userId = await requireUserId();
  await verifyOfferAccess(offerId, userId);

  const trackType = formData.get("trackType") as string;
  const interestRate = formData.get("interestRate") as string;
  const amount = formData.get("amount") as string;
  const periodMonths = formData.get("periodMonths") as string;
  const notes = formData.get("notes") as string;

  await db
    .update(mortgageTracks)
    .set({
      trackType: trackType as typeof mortgageTracks.$inferInsert.trackType,
      interestRate,
      amount,
      periodMonths: parseInt(periodMonths, 10),
      notes: notes || null,
    })
    .where(eq(mortgageTracks.id, trackId));

  revalidatePath(`/offers/${offerId}`);
  revalidatePath("/offers");
  revalidatePath("/");
}

export async function deleteTrack(trackId: string, offerId: string) {
  const userId = await requireUserId();
  await verifyOfferAccess(offerId, userId);

  await db.delete(mortgageTracks).where(eq(mortgageTracks.id, trackId));
  revalidatePath(`/offers/${offerId}`);
  revalidatePath("/offers");
  revalidatePath("/");
}
