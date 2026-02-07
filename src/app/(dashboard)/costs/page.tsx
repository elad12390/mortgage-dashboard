import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getMortgage } from "@/app/actions/mortgage";
import { getCosts, getCostsSummary, updateCost, deleteCost } from "@/app/actions/costs";
import { costCategoryLabels, costPaymentStatusLabels, costPaymentStatusColors } from "@/lib/constants";
import { Plus, Pencil, Trash2, Receipt } from "lucide-react";
import { cn } from "@/lib/utils";
import { redirect } from "next/navigation";
import { CostDialog } from "@/components/cost-dialog";
import { DeleteButton } from "@/components/delete-button";
import { revalidatePath } from "next/cache";
import type { ExtraCost } from "@/db/schema";

export default async function CostsPage() {
  const mortgage = await getMortgage();

  if (!mortgage) {
    redirect("/");
  }

  const costs = await getCosts(mortgage.id);
  const summary = await getCostsSummary(mortgage.id);

  const isOverdue = (cost: ExtraCost) => {
    if (cost.status === "fully_paid") return false;
    if (!cost.dueDate) return false;
    return new Date(cost.dueDate) < new Date();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h2 className="text-[length:var(--step-2)] font-bold tracking-tight">Extra Costs</h2>
        <CostDialog mortgageId={mortgage.id} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 stagger-children">
        <Card className="card-hover">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Costs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₪{summary.totalCosts.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paid</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₪{summary.totalPaid.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Remaining</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₪{summary.totalRemaining.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-2">
              {summary.overdueCount}
              {summary.overdueCount > 0 && (
                <Badge variant="destructive" className="ml-2">
                  !
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="card-hover">
        <CardContent className="p-0">
          {costs.length === 0 ? (
            <div className="p-12 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
                <Receipt className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-lg font-medium">No extra costs yet</p>
              <p className="mt-1 mb-4 text-sm text-muted-foreground">Track fees, taxes, and other expenses.</p>
              <CostDialog mortgageId={mortgage.id} />
            </div>
          ) : (
            <Table className="table-polished">
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Amount (₪)</TableHead>
                  <TableHead>Paid (₪)</TableHead>
                  <TableHead>Remaining (₪)</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-left">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {costs.map((cost) => {
                  const amountNum = parseFloat(cost.amount);
                  const paidNum = parseFloat(cost.paidAmount);
                  const remaining = amountNum - paidNum;

                  return (
                    <TableRow
                      key={cost.id}
                      className={cn(
                        isOverdue(cost) && "border-l-4 border-l-red-500"
                      )}
                    >
                      <TableCell className="font-medium">
                        {costCategoryLabels[cost.category as keyof typeof costCategoryLabels] ||
                          cost.category}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {cost.description || "-"}
                      </TableCell>
                      <TableCell>₪{amountNum.toLocaleString()}</TableCell>
                      <TableCell>₪{paidNum.toLocaleString()}</TableCell>
                      <TableCell>₪{remaining.toFixed(2)}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {cost.dueDate
                          ? new Date(cost.dueDate).toLocaleDateString("en-US")
                          : "-"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={cn(
                            costPaymentStatusColors[cost.status] === "red" &&
                              "bg-red-100 text-red-800",
                            costPaymentStatusColors[cost.status] === "yellow" &&
                              "bg-yellow-100 text-yellow-800",
                            costPaymentStatusColors[cost.status] === "green" &&
                              "bg-green-100 text-green-800"
                          )}
                        >
                          {costPaymentStatusLabels[cost.status]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <CostDialog mortgageId={mortgage.id} cost={cost}>
                            <Button variant="ghost" size="icon">
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </CostDialog>

                          {cost.status !== "fully_paid" && (
                            <form
                              action={async () => {
                                "use server";
                                await updateCost(cost.id, {
                                  paidAmount: cost.amount,
                                });
                                revalidatePath("/costs");
                              }}
                            >
                              <Button
                                type="submit"
                                variant="outline"
                                size="sm"
                              >
                                Mark as Paid
                              </Button>
                            </form>
                          )}

                          <form
                            action={async () => {
                              "use server";
                              await deleteCost(cost.id);
                              revalidatePath("/costs");
                            }}
                          >
                            <Button
                              type="submit"
                              variant="ghost"
                              size="icon"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </form>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
