"use server";

import { db } from "@/db";
import { bankOffers, mortgages, activityEvents } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUserId, verifyMortgageAccess, verifyOfferAccess } from "@/lib/auth";
import { STATUS_LABELS } from "@/lib/constants";

export async function getOffers(mortgageId: string) {
  const userId = await requireUserId();
  await verifyMortgageAccess(mortgageId, userId);

  const offers = await db.query.bankOffers.findMany({
    where: eq(bankOffers.mortgageId, mortgageId),
    with: {
      tracks: true,
      contacts: true,
    },
    orderBy: [desc(bankOffers.createdAt)],
  });

  return offers;
}

export async function getOfferById(id: string) {
  const userId = await requireUserId();
  const offer = await db.query.bankOffers.findFirst({
    where: eq(bankOffers.id, id),
    with: {
      tracks: true,
      contacts: true,
      mortgage: true,
    },
  });

  if (!offer) {
    return null;
  }

  try {
    await verifyMortgageAccess(offer.mortgageId, userId);
  } catch {
    return null;
  }

  return offer;
}

export async function createOffer(mortgageId: string, formData: FormData) {
  const userId = await requireUserId();
  await verifyMortgageAccess(mortgageId, userId);

  const bankName = formData.get("bankName") as string;
  const status = formData.get("status") as string;
  const notes = formData.get("notes") as string;

  const [result] = await db
    .insert(bankOffers)
    .values({
      mortgageId,
      bankName,
      status: status as typeof bankOffers.$inferInsert.status,
      notes: notes || null,
    })
    .returning({ id: bankOffers.id });

  await db.insert(activityEvents).values({
    mortgageId,
    offerId: result.id,
    eventType: "status_change",
    content: `Offer created with status: ${STATUS_LABELS[status] ?? status}`,
    metadata: { fromStatus: null, toStatus: status },
  });

  revalidatePath("/");
  revalidatePath("/offers");
  redirect(`/offers/${result.id}`);
}

export async function updateOffer(id: string, formData: FormData) {
  const userId = await requireUserId();
  await verifyOfferAccess(id, userId);

  const currentOffer = await db.query.bankOffers.findFirst({
    where: eq(bankOffers.id, id),
  });

  if (!currentOffer) {
    throw new Error("Offer not found");
  }

  const bankName = formData.get("bankName") as string;
  const status = formData.get("status") as string;
  const notes = formData.get("notes") as string;
  const oldStatus = currentOffer.status;

  await db
    .update(bankOffers)
    .set({
      bankName,
      status: status as typeof bankOffers.$inferInsert.status,
      notes: notes || null,
      updatedAt: new Date(),
    })
    .where(eq(bankOffers.id, id));

  if (status !== oldStatus) {
    await db.insert(activityEvents).values({
      mortgageId: currentOffer.mortgageId,
      offerId: id,
      eventType: "status_change",
      content: `Status changed: ${STATUS_LABELS[oldStatus] ?? oldStatus} → ${STATUS_LABELS[status] ?? status}`,
      metadata: { fromStatus: oldStatus, toStatus: status },
    });
  }

  revalidatePath("/");
  revalidatePath("/offers");
  revalidatePath(`/offers/${id}`);
}

export async function deleteOffer(id: string) {
  const userId = await requireUserId();
  await verifyOfferAccess(id, userId);

  await db.delete(bankOffers).where(eq(bankOffers.id, id));
  revalidatePath("/");
  revalidatePath("/offers");
  redirect("/offers");
}
