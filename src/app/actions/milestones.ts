"use server";

import { db } from "@/db";
import { extraCosts, loans, paymentMilestones } from "@/db/schema";
import { requireUserId, verifyMortgageAccess } from "@/lib/auth";
import { and, asc, eq, isNotNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";

type MilestoneInput = {
  name: string;
  amount: string | number;
  date: Date | string;
  isPaid?: number;
  notes?: string | null;
};

type MilestoneUpdateInput = Partial<MilestoneInput>;
type MilestoneInsert = typeof paymentMilestones.$inferInsert;

type TimelineEntry = {
  id: string;
  type: "milestone" | "cost" | "loan_start";
  date: Date;
  name: string;
  amount: string | number;
  isPaid: number | null;
  status: string | null;
  sourceId: string;
};

const toDate = (value: Date | string) =>
  value instanceof Date ? value : new Date(value);

export async function getMilestones(mortgageId: string) {
  const userId = await requireUserId();
  await verifyMortgageAccess(mortgageId, userId);

  const milestones = await db.query.paymentMilestones.findMany({
    where: eq(paymentMilestones.mortgageId, mortgageId),
    orderBy: [asc(paymentMilestones.date)],
  });

  return milestones;
}

export async function createMilestone(mortgageId: string, data: MilestoneInput) {
  const userId = await requireUserId();
  await verifyMortgageAccess(mortgageId, userId);

  await db.insert(paymentMilestones).values({
    mortgageId,
    name: data.name,
    amount: String(data.amount),
    date: toDate(data.date),
    isPaid: data.isPaid ?? 0,
    notes: data.notes ?? null,
  });

  revalidatePath("/");
}

export async function updateMilestone(milestoneId: string, data: MilestoneUpdateInput) {
  const userId = await requireUserId();

  const milestone = await db.query.paymentMilestones.findFirst({
    where: eq(paymentMilestones.id, milestoneId),
    columns: { id: true, mortgageId: true },
  });

  if (!milestone) {
    throw new Error("Milestone not found");
  }

  await verifyMortgageAccess(milestone.mortgageId, userId);

  const updateData: Partial<MilestoneInsert> = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.amount !== undefined) updateData.amount = String(data.amount);
  if (data.date !== undefined) updateData.date = toDate(data.date);
  if (data.isPaid !== undefined) updateData.isPaid = data.isPaid;
  if (data.notes !== undefined) updateData.notes = data.notes;

  await db.update(paymentMilestones).set(updateData).where(eq(paymentMilestones.id, milestoneId));

  revalidatePath("/");
}

export async function deleteMilestone(milestoneId: string) {
  const userId = await requireUserId();

  const milestone = await db.query.paymentMilestones.findFirst({
    where: eq(paymentMilestones.id, milestoneId),
    columns: { id: true, mortgageId: true },
  });

  if (!milestone) {
    throw new Error("Milestone not found");
  }

  await verifyMortgageAccess(milestone.mortgageId, userId);

  await db.delete(paymentMilestones).where(eq(paymentMilestones.id, milestoneId));

  revalidatePath("/");
}

export async function getTimelineData(mortgageId: string): Promise<TimelineEntry[]> {
  const userId = await requireUserId();
  await verifyMortgageAccess(mortgageId, userId);

  const [milestones, costs, loanStarts] = await Promise.all([
    db.query.paymentMilestones.findMany({
      where: eq(paymentMilestones.mortgageId, mortgageId),
    }),
    db.query.extraCosts.findMany({
      where: and(eq(extraCosts.mortgageId, mortgageId), isNotNull(extraCosts.dueDate)),
    }),
    db.query.loans.findMany({
      where: and(eq(loans.mortgageId, mortgageId), isNotNull(loans.startDate)),
    }),
  ]);

  const timeline: TimelineEntry[] = [
    ...milestones.map((milestone) => ({
      id: `milestone-${milestone.id}`,
      type: "milestone" as const,
      date: milestone.date,
      name: milestone.name,
      amount: milestone.amount,
      isPaid: milestone.isPaid,
      status: null,
      sourceId: milestone.id,
    })),
    ...costs.map((cost) => ({
      id: `cost-${cost.id}`,
      type: "cost" as const,
      date: cost.dueDate as Date,
      name: cost.description ?? cost.category,
      amount: cost.amount,
      isPaid: null,
      status: cost.status,
      sourceId: cost.id,
    })),
    ...loanStarts.map((loan) => ({
      id: `loan_start-${loan.id}`,
      type: "loan_start" as const,
      date: loan.startDate as Date,
      name: loan.lenderName,
      amount: loan.amount,
      isPaid: null,
      status: loan.status,
      sourceId: loan.id,
    })),
  ];

  timeline.sort((a, b) => a.date.getTime() - b.date.getTime());

  return timeline;
}
