import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  STATUS_LABELS,
  STATUS_COLORS,
  TRACK_TYPE_LABELS,
  getBankParent,
} from "@/lib/constants";
import { cn } from "@/lib/utils";
import Link from "next/link";
import type { BankOffer, MortgageTrack, Contact } from "@/db/schema";

interface OfferWithTracks extends BankOffer {
  tracks: MortgageTrack[];
  contacts: Contact[];
}

interface ComparisonGridProps {
  offers: OfferWithTracks[];
}

function calculateWeightedRate(tracks: MortgageTrack[]): number {
  const totalAmount = tracks.reduce((sum, t) => sum + parseFloat(t.amount), 0);
  if (totalAmount === 0) return 0;
  return (
    tracks.reduce(
      (sum, t) => sum + parseFloat(t.interestRate) * parseFloat(t.amount),
      0
    ) / totalAmount
  );
}

function calculateTotalAmount(tracks: MortgageTrack[]): number {
  return tracks.reduce((sum, t) => sum + parseFloat(t.amount), 0);
}

function estimateMonthlyPayment(
  principal: number,
  annualRate: number,
  months: number
): number {
  if (annualRate === 0 || months === 0) return 0;
  const monthlyRate = annualRate / 100 / 12;
  return (
    (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) /
    (Math.pow(1 + monthlyRate, months) - 1)
  );
}

function calculateEstimatedPayment(tracks: MortgageTrack[]): number {
  return tracks.reduce((sum, t) => {
    return (
      sum +
      estimateMonthlyPayment(
        parseFloat(t.amount),
        parseFloat(t.interestRate),
        t.periodMonths
      )
    );
  }, 0);
}

export function ComparisonGrid({ offers }: ComparisonGridProps) {
  if (offers.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          No bank offers yet.{" "}
          <Link href="/offers/new" className="text-primary underline">
            Add your first bank offer
          </Link>{" "}
          to start comparing.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="card-hover">
      <CardHeader>
        <CardTitle>Bank Comparison</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table className="table-polished">
          <TableHeader>
            <TableRow>
              <TableHead>Bank</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Tracks</TableHead>
              <TableHead className="text-left">Total Amount</TableHead>
              <TableHead className="text-left">Avg Rate</TableHead>
              <TableHead className="text-left">Est. Monthly</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {offers.map((offer) => {
              const totalAmount = calculateTotalAmount(offer.tracks);
              const weightedRate = calculateWeightedRate(offer.tracks);
              const monthlyPayment = calculateEstimatedPayment(offer.tracks);

              return (
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
                  <TableCell>
                    {offer.tracks.length > 0 ? (
                      <div className="space-y-1">
                        {offer.tracks.map((track) => (
                          <div key={track.id} className="text-xs">
                            {TRACK_TYPE_LABELS[track.trackType]}{" "}
                            <span className="text-muted-foreground">
                              {track.interestRate}%
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        No tracks
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-left">
                    {totalAmount > 0
                      ? `₪${totalAmount.toLocaleString()}`
                      : "—"}
                  </TableCell>
                  <TableCell className="text-left">
                    {weightedRate > 0 ? `${weightedRate.toFixed(2)}%` : "—"}
                  </TableCell>
                  <TableCell className="text-left">
                    {monthlyPayment > 0
                      ? `₪${Math.round(monthlyPayment).toLocaleString()}`
                      : "—"}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
