import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getDashboardData } from "@/app/actions/mortgage";
import { getActivityEvents } from "@/app/actions/activity";
import { MortgageSetup } from "@/components/mortgage-setup";
import { ComparisonGrid } from "@/components/comparison-grid";
import { EditMortgageToggle } from "@/components/edit-mortgage-toggle";
import { ActivityTimeline } from "@/components/activity-timeline";
import { Building2, TrendingUp, DollarSign, Activity, Landmark, Receipt, CalendarDays, AlertCircle, Home } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

export default async function DashboardPage() {
  const { mortgage, stats } = await getDashboardData();

  if (!mortgage) {
    return (
      <div className="mx-auto max-w-2xl space-y-8 animate-fade-in">
        <div className="text-center space-y-4 pt-8">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
            <Home className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Welcome to Mortgage Compare</h2>
            <p className="text-muted-foreground mt-2 text-lg">
              Track offers, compare rates, and manage your mortgage journey — all in one place.
            </p>
          </div>
        </div>
        <Card className="border-primary/20 shadow-sm">
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
      color: "text-emerald-600 bg-emerald-50",
    },
    {
      title: "Weighted Avg Rate",
      value:
        stats!.weightedInterestRate > 0
          ? `${stats!.weightedInterestRate.toFixed(2)}%`
          : "N/A",
      icon: TrendingUp,
      color: "text-amber-600 bg-amber-50",
    },
    {
      title: "Total Track Amount",
      value:
        stats!.totalTrackAmount > 0
          ? `₪${stats!.totalTrackAmount.toLocaleString()}`
          : "₪0",
      icon: DollarSign,
      color: "text-blue-600 bg-blue-50",
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
      </div>

      <EditMortgageToggle mortgage={mortgage}>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card>
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
          <Card>
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
            <Card>
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
            <Card>
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

      <Card>
        <CardHeader>
          <CardTitle>Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <ActivityTimeline mortgageId={mortgage.id} events={mortgageEvents} />
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card, i) => (
          <Card key={card.title} className="transition-all hover:shadow-md" style={{ animationDelay: `${i * 75}ms` }}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.title}
              </CardTitle>
              <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${card.color}`}>
                <card.icon className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold tracking-tight">Financing & Costs</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Link href="/loans">
            <Card className="cursor-pointer transition-all hover:shadow-md hover:border-primary/30">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Active Loans
                </CardTitle>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg text-primary bg-primary/10">
                  <Landmark className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats!.activeLoansCount}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  ₪{stats!.totalMonthlyRepayments.toLocaleString()}/mo
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/loans">
            <Card className="cursor-pointer transition-all hover:shadow-md hover:border-primary/30">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Loans
                </CardTitle>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg text-blue-600 bg-blue-50">
                  <DollarSign className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ₪{stats!.totalLoansAmount.toLocaleString()}
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/costs">
            <Card className="cursor-pointer transition-all hover:shadow-md hover:border-primary/30">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Remaining Costs
                </CardTitle>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg text-amber-600 bg-amber-50">
                  <Receipt className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ₪{stats!.costsRemaining.toLocaleString()}
                </div>
                {stats!.overdueCostsCount > 0 && (
                  <Badge variant="destructive" className="mt-1">
                    {stats!.overdueCostsCount} overdue
                  </Badge>
                )}
              </CardContent>
            </Card>
          </Link>

          <Link href="/timeline">
            <Card className="cursor-pointer transition-all hover:shadow-md hover:border-primary/30">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Next Payment
                </CardTitle>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg text-emerald-600 bg-emerald-50">
                  <CalendarDays className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                {stats!.nextPaymentDue ? (
                  <>
                    <div className="text-2xl font-bold">
                      ₪{stats!.nextPaymentDue.amount.toLocaleString()}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {stats!.nextPaymentDue.date.toLocaleDateString("en-US")}
                    </p>
                  </>
                ) : (
                  <div className="text-sm text-muted-foreground">No upcoming payments</div>
                )}
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>

      <ComparisonGrid offers={mortgage.bankOffers} />
    </div>
  );
}
