"use server";

import { db } from "@/db";
import { mortgages, mortgageMembers, loans, extraCosts, paymentMilestones } from "@/db/schema";
import { requireUserId, verifyMortgageAccess } from "@/lib/auth";
import { eq, and, isNotNull, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
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

  const [allLoans, allCosts, allMilestones] = await Promise.all([
    db.query.loans.findMany({ where: eq(loans.mortgageId, mortgage.id) }),
    db.query.extraCosts.findMany({ where: eq(extraCosts.mortgageId, mortgage.id) }),
    db.query.paymentMilestones.findMany({ where: eq(paymentMilestones.mortgageId, mortgage.id) }),
  ]);

  const totalLoansAmount = allLoans.reduce((sum, loan) => sum + parseFloat(loan.amount), 0);
  const totalMonthlyRepayments = allLoans.reduce(
    (sum, loan) => sum + parseFloat(loan.monthlyRepayment || "0"),
    0
  );
  const activeLoansCount = allLoans.filter(
    (loan) => loan.status === "received" || loan.status === "repaying"
  ).length;

  const totalCostsAmount = allCosts.reduce((sum, cost) => sum + parseFloat(cost.amount), 0);
  const totalCostsPaid = allCosts.reduce((sum, cost) => sum + parseFloat(cost.paidAmount), 0);
  const costsRemaining = totalCostsAmount - totalCostsPaid;

  const today = new Date();
  const overdueCostsCount = allCosts.filter((cost) => {
    const isUnpaid = cost.status === "unpaid" || cost.status === "partially_paid";
    return isUnpaid && cost.dueDate && new Date(cost.dueDate) < today;
  }).length;

  const upcomingPayments = [
    ...allMilestones
      .filter((m) => m.isPaid === 0 && new Date(m.date) >= today)
      .map((m) => ({ date: new Date(m.date), amount: parseFloat(m.amount), name: m.name })),
    ...allCosts
      .filter((c) => {
        const isUnpaid = c.status === "unpaid" || c.status === "partially_paid";
        return isUnpaid && c.dueDate && new Date(c.dueDate) >= today;
      })
      .map((c) => ({
        date: new Date(c.dueDate!),
        amount: parseFloat(c.amount) - parseFloat(c.paidAmount),
        name: c.description || c.category,
      })),
  ].sort((a, b) => a.date.getTime() - b.date.getTime());

  const nextPaymentDue = upcomingPayments.length > 0 ? upcomingPayments[0] : null;

  return {
    mortgage,
    stats: {
      totalOffers,
      activeOffers,
      totalTrackAmount,
      weightedInterestRate,
      totalLoansAmount,
      totalMonthlyRepayments,
      activeLoansCount,
      totalCostsAmount,
      totalCostsPaid,
      costsRemaining,
      overdueCostsCount,
      nextPaymentDue,
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
