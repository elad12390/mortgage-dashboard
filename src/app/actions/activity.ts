"use server";

import { db } from "@/db";
import { activityEvents, mortgages, bankOffers } from "@/db/schema";
import { eq, and, desc, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireUserId } from "@/lib/auth";

async function verifyMortgageOwnership(mortgageId: string, userId: string) {
  const mortgage = await db.query.mortgages.findFirst({
    where: and(eq(mortgages.id, mortgageId), eq(mortgages.userId, userId)),
    columns: { id: true },
  });
  if (!mortgage) {
    throw new Error("Unauthorized");
  }
  return mortgage;
}

async function verifyOfferOwnership(offerId: string, userId: string) {
  const offer = await db.query.bankOffers.findFirst({
    where: eq(bankOffers.id, offerId),
    with: { mortgage: { columns: { userId: true } } },
  });
  if (!offer || offer.mortgage.userId !== userId) {
    throw new Error("Unauthorized");
  }
  return offer;
}

export async function getActivityEvents(params: {
  mortgageId?: string;
  offerId?: string;
}) {
  const userId = await requireUserId();

  if (params.offerId) {
    await verifyOfferOwnership(params.offerId, userId);
    return db.query.activityEvents.findMany({
      where: eq(activityEvents.offerId, params.offerId),
      orderBy: [desc(activityEvents.createdAt)],
    });
  }

  if (params.mortgageId) {
    await verifyMortgageOwnership(params.mortgageId, userId);
    return db.query.activityEvents.findMany({
      where: and(
        eq(activityEvents.mortgageId, params.mortgageId),
        isNull(activityEvents.offerId)
      ),
      orderBy: [desc(activityEvents.createdAt)],
    });
  }

  return [];
}

export async function addMessage(
  params: { mortgageId?: string; offerId?: string },
  content: string,
  customDate?: string
) {
  const userId = await requireUserId();
  const createdAt = customDate ? new Date(customDate) : new Date();

  if (params.offerId) {
    const offer = await verifyOfferOwnership(params.offerId, userId);
    await db.insert(activityEvents).values({
      mortgageId: offer.mortgageId,
      offerId: params.offerId,
      eventType: "message",
      content,
      createdAt,
    });
    revalidatePath(`/offers/${params.offerId}`);
  } else if (params.mortgageId) {
    await verifyMortgageOwnership(params.mortgageId, userId);
    await db.insert(activityEvents).values({
      mortgageId: params.mortgageId,
      eventType: "message",
      content,
      createdAt,
    });
    revalidatePath("/");
  }
}

export async function deleteMessage(eventId: string) {
  const userId = await requireUserId();

  const event = await db.query.activityEvents.findFirst({
    where: eq(activityEvents.id, eventId),
  });

  if (!event) {
    throw new Error("Event not found");
  }

  if (event.eventType !== "message") {
    throw new Error("Cannot delete status change events");
  }

  if (event.offerId) {
    await verifyOfferOwnership(event.offerId, userId);
  } else if (event.mortgageId) {
    await verifyMortgageOwnership(event.mortgageId, userId);
  }

  await db.delete(activityEvents).where(eq(activityEvents.id, eventId));

  if (event.offerId) {
    revalidatePath(`/offers/${event.offerId}`);
  }
  revalidatePath("/");
}
