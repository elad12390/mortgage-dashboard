"use server";

import { db } from "@/db";
import { loans, activityEvents, type NewLoan } from "@/db/schema";
import { requireUserId, verifyMortgageAccess } from "@/lib/auth";
import { eq, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getLoans(mortgageId: string) {
  const userId = await requireUserId();
  await verifyMortgageAccess(mortgageId, userId);

  return db.query.loans.findMany({
    where: eq(loans.mortgageId, mortgageId),
    orderBy: [desc(loans.createdAt)],
  });
}

export async function getLoanById(loanId: string) {
  const userId = await requireUserId();
  const loan = await db.query.loans.findFirst({
    where: eq(loans.id, loanId),
  });

  if (!loan) {
    return null;
  }

  try {
    await verifyMortgageAccess(loan.mortgageId, userId);
  } catch {
    return null;
  }

  return loan;
}

export async function createLoan(mortgageId: string, data: Partial<NewLoan>) {
  const userId = await requireUserId();
  await verifyMortgageAccess(mortgageId, userId);

  const loanData = {
    ...data,
    mortgageId,
  } as NewLoan;

  const [loan] = await db
    .insert(loans)
    .values(loanData)
    .returning();

  revalidatePath("/");

  return loan;
}

export async function updateLoan(loanId: string, data: Partial<NewLoan>) {
  const userId = await requireUserId();
  const currentLoan = await db.query.loans.findFirst({
    where: eq(loans.id, loanId),
  });

  if (!currentLoan) {
    throw new Error("Loan not found");
  }

  await verifyMortgageAccess(currentLoan.mortgageId, userId);

  const oldStatus = currentLoan.status;
  const newStatus = data.status ?? oldStatus;

  await db
    .update(loans)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(loans.id, loanId));

  if (oldStatus !== newStatus) {
    await db.insert(activityEvents).values({
      mortgageId: currentLoan.mortgageId,
      loanId,
      eventType: "status_change",
      content: `Status changed: ${oldStatus} → ${newStatus}`,
      metadata: { oldStatus, newStatus },
    });
  }

  revalidatePath("/");
}

export async function deleteLoan(loanId: string) {
  const userId = await requireUserId();
  const loan = await db.query.loans.findFirst({
    where: eq(loans.id, loanId),
  });

  if (!loan) {
    throw new Error("Loan not found");
  }

  await verifyMortgageAccess(loan.mortgageId, userId);

  await db.delete(loans).where(eq(loans.id, loanId));
  revalidatePath("/");
}

export async function getLoanActivityEvents(loanId: string) {
  const userId = await requireUserId();
  const loan = await db.query.loans.findFirst({
    where: eq(loans.id, loanId),
  });

  if (!loan) {
    throw new Error("Loan not found");
  }

  await verifyMortgageAccess(loan.mortgageId, userId);

  return db.query.activityEvents.findMany({
    where: eq(activityEvents.loanId, loanId),
    orderBy: [desc(activityEvents.createdAt)],
  });
}

export async function addLoanMessage(
  loanId: string,
  content: string,
  createdAt?: Date
) {
  const userId = await requireUserId();
  const loan = await db.query.loans.findFirst({
    where: eq(loans.id, loanId),
  });

  if (!loan) {
    throw new Error("Loan not found");
  }

  await verifyMortgageAccess(loan.mortgageId, userId);

  await db.insert(activityEvents).values({
    mortgageId: loan.mortgageId,
    loanId,
    eventType: "message",
    content,
    createdAt: createdAt ?? new Date(),
  });

  revalidatePath("/");
}

export async function deleteLoanMessage(eventId: string) {
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

  if (!event.mortgageId) {
    throw new Error("Event is missing mortgageId");
  }

  await verifyMortgageAccess(event.mortgageId, userId);

  await db.delete(activityEvents).where(eq(activityEvents.id, eventId));
  revalidatePath("/");
}
