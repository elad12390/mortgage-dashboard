import { redirect } from "next/navigation";
import { getMortgage } from "@/app/actions/mortgage";
import { getTimelineData, getMilestones, deleteMilestone } from "@/app/actions/milestones";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MilestoneDialog } from "@/components/milestone-dialog";
import { Pencil, Trash2 } from "lucide-react";
import { revalidatePath } from "next/cache";

export default async function TimelinePage() {
  const mortgage = await getMortgage();

  if (!mortgage) {
    redirect("/");
  }

  const timeline = await getTimelineData(mortgage.id);
  const milestones = await getMilestones(mortgage.id);

  const today = new Date();
  const upcomingEntries = timeline.filter((entry) => {
    const entryDate = new Date(entry.date);
    const isUnpaid =
      entry.type === "milestone"
        ? entry.isPaid === 0
        : entry.status === "unpaid" || entry.status === "partially_paid";
    return entryDate >= today && isUnpaid;
  });

  const completedEntries = timeline.filter((entry) => {
    return entry.type === "milestone"
      ? entry.isPaid === 1
      : entry.status === "fully_paid";
  });

  const nextPayment = upcomingEntries.length > 0 ? upcomingEntries[0] : null;
  const totalUpcoming = upcomingEntries.reduce(
    (sum, entry) => sum + parseFloat(String(entry.amount)),
    0
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Timeline</h2>
        <MilestoneDialog mortgageId={mortgage.id} />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Next Payment</CardTitle>
          </CardHeader>
          <CardContent>
            {nextPayment ? (
              <div>
                <div className="text-2xl font-bold">
                  ₪{parseFloat(String(nextPayment.amount)).toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(nextPayment.date).toLocaleDateString("en-US")} -{" "}
                  {nextPayment.name}
                </p>
              </div>
            ) : (
                <div className="text-sm text-muted-foreground">No upcoming payments</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₪{totalUpcoming.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {upcomingEntries.length} payments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedEntries.length}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
              <CardTitle>Milestones</CardTitle>
        </CardHeader>
        <CardContent>
          {milestones.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-muted-foreground mb-4">No milestones yet</p>
              <MilestoneDialog mortgageId={mortgage.id} />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Amount (₪)</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-left">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {milestones.map((milestone) => (
                  <TableRow key={milestone.id}>
                    <TableCell className="font-medium">{milestone.name}</TableCell>
                    <TableCell>
                      ₪{parseFloat(milestone.amount).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(milestone.date).toLocaleDateString("en-US")}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={milestone.isPaid === 1 ? "default" : "secondary"}
                      >
                          {milestone.isPaid === 1 ? "Paid" : "Unpaid"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <MilestoneDialog
                          mortgageId={mortgage.id}
                          milestone={milestone}
                        >
                          <Button variant="ghost" size="icon">
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </MilestoneDialog>

                        <form
                          action={async () => {
                            "use server";
                            await deleteMilestone(milestone.id);
                            revalidatePath("/timeline");
                          }}
                        >
                          <Button type="submit" variant="ghost" size="icon">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </form>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
              <CardTitle>All Events</CardTitle>
        </CardHeader>
        <CardContent>
          {timeline.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
                No timeline events
            </div>
          ) : (
            <div className="space-y-4">
              {timeline.map((entry) => {
                const entryDate = new Date(entry.date);
                const isOverdue = entryDate < today;
                const isPaid =
                  entry.type === "milestone"
                    ? entry.isPaid === 1
                    : entry.status === "fully_paid";

                return (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <div className="text-2xl">
                        {entry.type === "milestone" && "🏠"}
                        {entry.type === "cost" && "💰"}
                        {entry.type === "loan_start" && "🏦"}
                      </div>
                      <div>
                        <div className="font-medium">{entry.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {entryDate.toLocaleDateString("en-US")}
                        </div>
                      </div>
                    </div>
                    <div className="text-left">
                      <div className="font-bold">
                        ₪{parseFloat(String(entry.amount)).toLocaleString()}
                      </div>
                      <Badge
                        variant={
                          isPaid ? "default" : isOverdue ? "destructive" : "secondary"
                        }
                        className="mt-1"
                      >
                        {isPaid ? "Paid" : isOverdue ? "Overdue" : "Upcoming"}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
