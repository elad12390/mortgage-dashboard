import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getDashboardData } from "@/app/actions/mortgage";
import { getActivityEvents } from "@/app/actions/activity";
import { MortgageSetup } from "@/components/mortgage-setup";
import { ComparisonGrid } from "@/components/comparison-grid";
import { EditMortgageToggle } from "@/components/edit-mortgage-toggle";
import { ActivityTimeline } from "@/components/activity-timeline";
import { Building2, TrendingUp, DollarSign, Activity } from "lucide-react";

export default async function DashboardPage() {
  const { mortgage, stats } = await getDashboardData();

  if (!mortgage) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <h2 className="text-2xl font-bold">Welcome to Mortgage Compare</h2>
        <p className="text-muted-foreground">
          Set up your mortgage details to start comparing bank offers.
        </p>
        <Card>
          <CardHeader>
            <CardTitle>Mortgage Details</CardTitle>
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
    },
    {
      title: "Active Offers",
      value: stats!.activeOffers,
      icon: Activity,
    },
    {
      title: "Weighted Avg Rate",
      value:
        stats!.weightedInterestRate > 0
          ? `${stats!.weightedInterestRate.toFixed(2)}%`
          : "N/A",
      icon: TrendingUp,
    },
    {
      title: "Total Track Amount",
      value:
        stats!.totalTrackAmount > 0
          ? `₪${stats!.totalTrackAmount.toLocaleString()}`
          : "₪0",
      icon: DollarSign,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Dashboard</h2>
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
        {cards.map((card) => (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.title}
              </CardTitle>
              <card.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <ComparisonGrid offers={mortgage.bankOffers} />
    </div>
  );
}
