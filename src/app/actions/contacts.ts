"use server";

import { db } from "@/db";
import { contacts, mortgages, bankOffers } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireUserId, verifyMortgageAccess, verifyOfferAccess } from "@/lib/auth";

async function verifyContactOwnership(contactId: string, userId: string) {
  const contact = await db.query.contacts.findFirst({
    where: eq(contacts.id, contactId),
    with: {
      mortgage: { columns: { id: true } },
      offer: { with: { mortgage: { columns: { id: true } } } },
    },
  });
  if (!contact) {
    throw new Error("Unauthorized");
  }
  if (contact.mortgage) {
    try {
      await verifyMortgageAccess(contact.mortgage.id, userId);
    } catch {
      throw new Error("Unauthorized");
    }
  }
  if (contact.offer) {
    try {
      await verifyMortgageAccess(contact.offer.mortgage.id, userId);
    } catch {
      throw new Error("Unauthorized");
    }
  }
}

interface CreateContactParams {
  mortgageId?: string;
  offerId?: string;
}

export async function createContact(
  params: CreateContactParams,
  formData: FormData
) {
  const userId = await requireUserId();

  if (params.mortgageId) {
    await verifyMortgageAccess(params.mortgageId, userId);
  }
  if (params.offerId) {
    await verifyOfferAccess(params.offerId, userId);
  }

  const name = formData.get("name") as string;
  const role = formData.get("role") as string;
  const phone = formData.get("phone") as string;
  const email = formData.get("email") as string;
  const notes = formData.get("notes") as string;

  await db.insert(contacts).values({
    mortgageId: params.mortgageId ?? null,
    offerId: params.offerId ?? null,
    name,
    role: role || null,
    phone: phone || null,
    email: email || null,
    notes: notes || null,
  });

  if (params.offerId) {
    revalidatePath(`/offers/${params.offerId}`);
  }
  revalidatePath("/contacts");
  revalidatePath("/");
}

export async function updateContact(contactId: string, formData: FormData) {
  const userId = await requireUserId();
  await verifyContactOwnership(contactId, userId);

  const name = formData.get("name") as string;
  const role = formData.get("role") as string;
  const phone = formData.get("phone") as string;
  const email = formData.get("email") as string;
  const notes = formData.get("notes") as string;

  await db
    .update(contacts)
    .set({
      name,
      role: role || null,
      phone: phone || null,
      email: email || null,
      notes: notes || null,
    })
    .where(eq(contacts.id, contactId));

  revalidatePath("/contacts");
  revalidatePath("/offers");
  revalidatePath("/");
}

export async function deleteContact(contactId: string) {
  const userId = await requireUserId();
  await verifyContactOwnership(contactId, userId);

  await db.delete(contacts).where(eq(contacts.id, contactId));
  revalidatePath("/contacts");
  revalidatePath("/offers");
  revalidatePath("/");
}

export async function getGlobalContacts(mortgageId: string) {
  const userId = await requireUserId();
  await verifyMortgageAccess(mortgageId, userId);

  const result = await db.query.contacts.findMany({
    where: eq(contacts.mortgageId, mortgageId),
  });
  return result;
}
