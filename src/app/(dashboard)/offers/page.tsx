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
import { Card, CardContent } from "@/components/ui/card";
import { getMortgage } from "@/app/actions/mortgage";
import { getOffers } from "@/app/actions/offers";
import { STATUS_LABELS, STATUS_COLORS, getBankParent } from "@/lib/constants";
import { Plus, Building2 } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { redirect } from "next/navigation";

export default async function OffersPage() {
  const mortgage = await getMortgage();

  if (!mortgage) {
    redirect("/");
  }

  const offers = await getOffers(mortgage.id);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h2 className="text-[length:var(--step-2)] font-bold tracking-tight">Bank Offers</h2>
        <Button asChild>
          <Link href="/offers/new">
            <Plus className="mr-2 h-4 w-4" />
            New Offer
          </Link>
        </Button>
      </div>

      <Card className="card-hover">
        <CardContent className="p-0">
          {offers.length === 0 ? (
            <div className="p-12 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
                <Building2 className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-lg font-medium">No bank offers yet</p>
              <p className="mt-1 text-sm text-muted-foreground">Create your first one to start comparing.</p>
            </div>
          ) : (
            <Table className="table-polished">
              <TableHeader>
                <TableRow>
                  <TableHead>Bank</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Tracks</TableHead>
                  <TableHead>Contacts</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {offers.map((offer) => (
                  <TableRow key={offer.id}>
                    <TableCell>
                      <Link
                        href={`/offers/${offer.id}`}
                        className="font-medium hover:underline"
                      >
                        {offer.bankName}
                      </Link>
                      {getBankParent(offer.bankName) && (
                        <div className="text-xs text-muted-foreground">
                          Subsidiary of {getBankParent(offer.bankName)}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={cn(STATUS_COLORS[offer.status])}
                      >
                        {STATUS_LABELS[offer.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>{offer.tracks.length}</TableCell>
                    <TableCell>{offer.contacts.length}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {offer.createdAt.toLocaleDateString("en-US")}
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
