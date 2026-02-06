"use server";

import { db } from "@/db";
import { extraCosts } from "@/db/schema";
import { requireUserId, verifyMortgageAccess } from "@/lib/auth";
import { asc, desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

type CostInput = {
  category: string;
  description?: string | null;
  amount: string | number;
  paidAmount?: string | number;
  dueDate?: Date | string | null;
  notes?: string | null;
};

type CostUpdateInput = Partial<CostInput>;
type CostInsert = typeof extraCosts.$inferInsert;

const toDate = (value: Date | string) =>
  value instanceof Date ? value : new Date(value);

const toNumber = (value: string | number) =>
  typeof value === "number" ? value : Number(value);

const getStatusFromAmounts = (amount: number, paidAmount: number) => {
  if (paidAmount <= 0) return "unpaid";
  if (paidAmount < amount) return "partially_paid";
  return "fully_paid";
};

export async function getCosts(mortgageId: string) {
  const userId = await requireUserId();
  await verifyMortgageAccess(mortgageId, userId);

  const costs = await db.query.extraCosts.findMany({
    where: eq(extraCosts.mortgageId, mortgageId),
    orderBy: [asc(extraCosts.dueDate), desc(extraCosts.createdAt)],
  });

  return costs;
}

export async function createCost(mortgageId: string, data: CostInput) {
  const userId = await requireUserId();
  await verifyMortgageAccess(mortgageId, userId);

  const amountValue = toNumber(data.amount);
  const paidAmountValue = toNumber(data.paidAmount ?? 0);
  const status = getStatusFromAmounts(amountValue, paidAmountValue);

  await db.insert(extraCosts).values({
    mortgageId,
    category: data.category,
    description: data.description ?? null,
    amount: String(data.amount),
    paidAmount: String(data.paidAmount ?? 0),
    dueDate: data.dueDate ? toDate(data.dueDate) : null,
    status: status as CostInsert["status"],
    notes: data.notes ?? null,
  });

  revalidatePath("/");
}

export async function updateCost(costId: string, data: CostUpdateInput) {
  const userId = await requireUserId();

  const cost = await db.query.extraCosts.findFirst({
    where: eq(extraCosts.id, costId),
    columns: { id: true, mortgageId: true, amount: true, paidAmount: true },
  });

  if (!cost) {
    throw new Error("Cost not found");
  }

  await verifyMortgageAccess(cost.mortgageId, userId);

  const nextAmount =
    data.amount !== undefined ? toNumber(data.amount) : toNumber(cost.amount);
  const nextPaidAmount =
    data.paidAmount !== undefined
      ? toNumber(data.paidAmount)
      : toNumber(cost.paidAmount);
  const status = getStatusFromAmounts(nextAmount, nextPaidAmount);

  const updateData: Partial<CostInsert> = {
    status: status as CostInsert["status"],
    updatedAt: new Date(),
  };

  if (data.category !== undefined) updateData.category = data.category;
  if (data.description !== undefined) updateData.description = data.description ?? null;
  if (data.amount !== undefined) updateData.amount = String(data.amount);
  if (data.paidAmount !== undefined) updateData.paidAmount = String(data.paidAmount);
  if (data.dueDate !== undefined) {
    updateData.dueDate = data.dueDate ? toDate(data.dueDate) : null;
  }
  if (data.notes !== undefined) updateData.notes = data.notes ?? null;

  await db.update(extraCosts).set(updateData).where(eq(extraCosts.id, costId));

  revalidatePath("/");
}

export async function deleteCost(costId: string) {
  const userId = await requireUserId();

  const cost = await db.query.extraCosts.findFirst({
    where: eq(extraCosts.id, costId),
    columns: { id: true, mortgageId: true },
  });

  if (!cost) {
    throw new Error("Cost not found");
  }

  await verifyMortgageAccess(cost.mortgageId, userId);

  await db.delete(extraCosts).where(eq(extraCosts.id, costId));

  revalidatePath("/");
}

export async function getCostsSummary(mortgageId: string) {
  const userId = await requireUserId();
  await verifyMortgageAccess(mortgageId, userId);

  const costs = await db.query.extraCosts.findMany({
    where: eq(extraCosts.mortgageId, mortgageId),
    columns: { amount: true, paidAmount: true, status: true, dueDate: true },
  });

  const today = new Date();
  const upcomingLimit = new Date(today);
  upcomingLimit.setDate(today.getDate() + 30);

  let totalCosts = 0;
  let totalPaid = 0;
  let totalRemaining = 0;
  let overdueCount = 0;
  let upcomingCount = 0;

  for (const cost of costs) {
    const amount = toNumber(cost.amount);
    const paidAmount = toNumber(cost.paidAmount);
    const remaining = amount - paidAmount;

    totalCosts += amount;
    totalPaid += paidAmount;
    totalRemaining += remaining;

    const isUnpaid = cost.status === "unpaid" || cost.status === "partially_paid";
    if (isUnpaid && cost.dueDate) {
      const dueDate = cost.dueDate as Date;
      if (dueDate < today) {
        overdueCount += 1;
      } else if (dueDate <= upcomingLimit) {
        upcomingCount += 1;
      }
    }
  }

  return {
    totalCosts,
    totalPaid,
    totalRemaining,
    overdueCount,
    upcomingCount,
  };
}
