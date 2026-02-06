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
import { getLoans } from "@/app/actions/loans";
import { loanStatusLabels, loanStatusColors } from "@/lib/constants";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { LoanDialog } from "@/components/loan-dialog";
import { redirect } from "next/navigation";

export default async function LoansPage() {
  const mortgage = await getMortgage();

  if (!mortgage) {
    redirect("/");
  }

  const loans = await getLoans(mortgage.id);

  // Calculate summary stats
  const totalAmount = loans.reduce((sum, loan) => sum + Number(loan.amount), 0);
  const totalMonthly = loans.reduce(
    (sum, loan) => sum + Number(loan.monthlyRepayment || 0),
    0
  );
  const activeCount = loans.filter(
    (loan) => loan.status === "received" || loan.status === "repaying"
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Loans</h2>
        <LoanDialog mortgageId={mortgage.id} />
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Loans</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₪{totalAmount.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Monthly Payment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₪{totalMonthly.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Loans</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Loans Table */}
      <Card>
        <CardContent className="p-0">
          {loans.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground">
              No loans yet. Create your first loan.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Lender</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Interest</TableHead>
                  <TableHead>Monthly Payment</TableHead>
                  <TableHead>Term</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Start Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loans.map((loan) => (
                  <TableRow key={loan.id}>
                    <TableCell>
                      <Link
                        href={`/loans/${loan.id}`}
                        className="font-medium hover:underline"
                      >
                        {loan.lenderName}
                      </Link>
                    </TableCell>
                    <TableCell>₪{Number(loan.amount).toLocaleString()}</TableCell>
                    <TableCell>
                      {loan.interestRate ? `${loan.interestRate}%` : "-"}
                    </TableCell>
                    <TableCell>
                      {loan.monthlyRepayment
                        ? `₪${Number(loan.monthlyRepayment).toLocaleString()}`
                        : "-"}
                    </TableCell>
                    <TableCell>
                      {loan.termMonths ? `${loan.termMonths} months` : "-"}
                    </TableCell>
                    <TableCell>
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
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {loan.startDate
                        ? new Date(loan.startDate).toLocaleDateString("he-IL")
                        : "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
