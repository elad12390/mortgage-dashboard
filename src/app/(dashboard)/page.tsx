import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getDashboardData } from "@/app/actions/mortgage";
import { getActivityEvents } from "@/app/actions/activity";
import { MortgageSetup } from "@/components/mortgage-setup";
import { ComparisonGrid } from "@/components/comparison-grid";
import { EditMortgageToggle } from "@/components/edit-mortgage-toggle";
import { ActivityTimeline } from "@/components/activity-timeline";
import { Building2, TrendingUp, DollarSign, Activity, Landmark, Receipt, CalendarDays, Home, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

export default async function DashboardPage() {
  const { mortgage, stats } = await getDashboardData();

  if (!mortgage) {
    return (
      <div className="mx-auto max-w-2xl space-y-8 animate-fade-in">
        <div className="text-center space-y-5 pt-12 pb-2">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-primary/20 to-primary/5 ring-1 ring-primary/10">
            <Home className="h-10 w-10 text-primary" />
          </div>
          <div className="space-y-2">
            <h2 className="text-[length:var(--step-2)] font-bold tracking-tight">
              Welcome to Mortgage Compare
            </h2>
            <p className="text-muted-foreground text-lg max-w-md mx-auto leading-relaxed">
              Track offers, compare rates, and manage your mortgage journey — all in one place.
            </p>
          </div>
        </div>
        <Card className="gradient-border-top shadow-[var(--shadow-2)] overflow-hidden">
          <CardHeader>
            <CardTitle>Get Started</CardTitle>
            <p className="text-sm text-muted-foreground">
              Enter your mortgage details to start comparing bank offers.
            </p>
          </CardHeader>
          <CardContent>
            <MortgageSetup />
          </CardContent>
        </Card>
      </div>
    );
  }

  const mortgageEvents = await getActivityEvents({ mortgageId: mortgage.id });

  const ltvRatio =
    mortgage.propertyValue && mortgage.loanAmount
      ? ((parseFloat(mortgage.loanAmount) / parseFloat(mortgage.propertyValue)) * 100).toFixed(1)
      : null;

  const cards = [
    {
      title: "Bank Offers",
      value: stats!.totalOffers,
      icon: Building2,
      color: "text-primary bg-primary/10",
    },
    {
      title: "Active Offers",
      value: stats!.activeOffers,
      icon: Activity,
      color: "text-emerald-600 bg-emerald-500/10 dark:text-emerald-400 dark:bg-emerald-400/10",
    },
    {
      title: "Weighted Avg Rate",
      value:
        stats!.weightedInterestRate > 0
          ? `${stats!.weightedInterestRate.toFixed(2)}%`
          : "N/A",
      icon: TrendingUp,
      color: "text-amber-600 bg-amber-500/10 dark:text-amber-400 dark:bg-amber-400/10",
    },
    {
      title: "Total Track Amount",
      value:
        stats!.totalTrackAmount > 0
          ? `₪${stats!.totalTrackAmount.toLocaleString()}`
          : "₪0",
      icon: DollarSign,
      color: "text-blue-600 bg-blue-500/10 dark:text-blue-400 dark:bg-blue-400/10",
    },
  ];

  const financeCards = [
    {
      title: "Active Loans",
      value: stats!.activeLoansCount,
      subtitle: `₪${stats!.totalMonthlyRepayments.toLocaleString()}/mo`,
      icon: Landmark,
      color: "text-primary bg-primary/10",
      href: "/loans",
    },
    {
      title: "Total Loans",
      value: `₪${stats!.totalLoansAmount.toLocaleString()}`,
      icon: DollarSign,
      color: "text-blue-600 bg-blue-500/10 dark:text-blue-400 dark:bg-blue-400/10",
      href: "/loans",
    },
    {
      title: "Remaining Costs",
      value: `₪${stats!.costsRemaining.toLocaleString()}`,
      icon: Receipt,
      color: "text-amber-600 bg-amber-500/10 dark:text-amber-400 dark:bg-amber-400/10",
      href: "/costs",
      badge: stats!.overdueCostsCount > 0 ? `${stats!.overdueCostsCount} overdue` : null,
    },
    {
      title: "Next Payment",
      value: stats!.nextPaymentDue
        ? `₪${stats!.nextPaymentDue.amount.toLocaleString()}`
        : null,
      subtitle: stats!.nextPaymentDue
        ? stats!.nextPaymentDue.date.toLocaleDateString("en-US")
        : null,
      icon: CalendarDays,
      color: "text-emerald-600 bg-emerald-500/10 dark:text-emerald-400 dark:bg-emerald-400/10",
      href: "/timeline",
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <h2 className="text-[length:var(--step-2)] font-bold tracking-tight">Dashboard</h2>
      </div>

      <EditMortgageToggle mortgage={mortgage}>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 stagger-children">
          <Card className="card-hover">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Property Value
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold">
                {mortgage.propertyValue
                  ? `₪${parseFloat(mortgage.propertyValue).toLocaleString()}`
                  : "—"}
              </div>
            </CardContent>
          </Card>
          <Card className="card-hover">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Loan Amount
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold">
                {mortgage.loanAmount
                  ? `₪${parseFloat(mortgage.loanAmount).toLocaleString()}`
                  : "—"}
              </div>
            </CardContent>
          </Card>
          {ltvRatio && (
            <Card className="card-hover">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  LTV Ratio
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold">{ltvRatio}%</div>
              </CardContent>
            </Card>
          )}
          {mortgage.mortgageTermYears && (
            <Card className="card-hover">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Mortgage Term
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold">{mortgage.mortgageTermYears} years</div>
              </CardContent>
            </Card>
          )}
        </div>
      </EditMortgageToggle>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 stagger-children">
        {cards.map((card) => (
          <Card key={card.title} className="card-hover">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.title}
              </CardTitle>
              <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${card.color}`}>
                <card.icon className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold tracking-tight">{card.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="card-hover">
        <CardHeader>
          <CardTitle>Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <ActivityTimeline mortgageId={mortgage.id} events={mortgageEvents} />
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h3 className="text-[length:var(--step-1)] font-semibold tracking-tight">Financing & Costs</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 stagger-children">
          {financeCards.map((card) => (
            <Link key={card.title} href={card.href}>
              <Card className="group cursor-pointer card-hover gradient-border-top h-full">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {card.title}
                  </CardTitle>
                  <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${card.color}`}>
                    <card.icon className="h-4 w-4" />
                  </div>
                </CardHeader>
                <CardContent>
                  {card.value ? (
                    <>
                      <div className="text-2xl font-bold tracking-tight">{card.value}</div>
                      {card.subtitle && (
                        <p className="text-xs text-muted-foreground mt-1">{card.subtitle}</p>
                      )}
                      {card.badge && (
                        <Badge variant="destructive" className="mt-1.5">
                          {card.badge}
                        </Badge>
                      )}
                    </>
                  ) : (
                    <div className="text-sm text-muted-foreground">No upcoming payments</div>
                  )}
                  <ArrowUpRight className="h-4 w-4 text-muted-foreground/0 group-hover:text-muted-foreground transition-all absolute top-4 right-4" />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      <ComparisonGrid offers={mortgage.bankOffers} />
    </div>
  );
}
