import { notFound } from "next/navigation";
import Link from "next/link";
import { getLoanById, deleteLoan } from "@/app/actions/loans";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { DeleteButton } from "@/components/delete-button";
import { ActivityTimeline } from "@/components/activity-timeline";
import { loanStatusLabels, loanStatusColors } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function LoanDetailPage({ params }: PageProps) {
  const { id } = await params;
  const loan = await getLoanById(id);

  if (!loan) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/loans">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold">{loan.lenderName}</h2>
          <div className="flex items-center gap-2 mt-1">
            <Badge
              variant="secondary"
              className={cn(
                loanStatusColors[loan.status] === "gray" &&
                  "bg-gray-100 text-gray-800",
                loanStatusColors[loan.status] === "blue" &&
                  "bg-blue-100 text-blue-800",
                loanStatusColors[loan.status] === "green" &&
                  "bg-green-100 text-green-800",
                loanStatusColors[loan.status] === "yellow" &&
                  "bg-yellow-100 text-yellow-800",
                loanStatusColors[loan.status] === "purple" &&
                  "bg-purple-100 text-purple-800"
              )}
            >
              {loanStatusLabels[loan.status]}
            </Badge>
            <span className="text-sm text-muted-foreground">
              נוצר {loan.createdAt.toLocaleDateString("he-IL")}
            </span>
          </div>
        </div>
        <DeleteButton
          onDelete={async () => {
            "use server";
            await deleteLoan(id);
          }}
          label="מחק הלוואה"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              סכום הלוואה
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">
              ₪{Number(loan.amount).toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              ריבית שנתית
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">
              {loan.interestRate ? `${loan.interestRate}%` : "—"}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              תשלום חודשי
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">
              {loan.monthlyRepayment
                ? `₪${Number(loan.monthlyRepayment).toLocaleString()}`
                : "—"}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              תקופה
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">
              {loan.termMonths ? `${loan.termMonths} חודשים` : "—"}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="activity">
        <TabsList>
          <TabsTrigger value="activity">פעילות</TabsTrigger>
          <TabsTrigger value="details">פרטים</TabsTrigger>
        </TabsList>

        <TabsContent value="activity" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>פעילות</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">
                Activity timeline for loans coming soon
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="details" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>פרטי הלוואה</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">
                    שם מלווה
                  </div>
                  <div>{loan.lenderName}</div>
                </div>

                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">
                    סטטוס
                  </div>
                  <div>{loanStatusLabels[loan.status]}</div>
                </div>

                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">
                    סכום
                  </div>
                  <div>₪{Number(loan.amount).toLocaleString()}</div>
                </div>

                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">
                    ריבית שנתית
                  </div>
                  <div>{loan.interestRate ? `${loan.interestRate}%` : "—"}</div>
                </div>

                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">
                    תשלום חודשי
                  </div>
                  <div>
                    {loan.monthlyRepayment
                      ? `₪${Number(loan.monthlyRepayment).toLocaleString()}`
                      : "—"}
                  </div>
                </div>

                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">
                    תקופה
                  </div>
                  <div>
                    {loan.termMonths ? `${loan.termMonths} חודשים` : "—"}
                  </div>
                </div>

                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">
                    תאריך התחלה
                  </div>
                  <div>
                    {loan.startDate
                      ? new Date(loan.startDate).toLocaleDateString("he-IL")
                      : "—"}
                  </div>
                </div>

                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">
                    נוצר
                  </div>
                  <div>{loan.createdAt.toLocaleDateString("he-IL")}</div>
                </div>
              </div>


            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
