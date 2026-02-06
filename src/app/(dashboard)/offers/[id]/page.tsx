import { notFound } from "next/navigation";
import Link from "next/link";
import { getOfferById, deleteOffer } from "@/app/actions/offers";
import { getActivityEvents } from "@/app/actions/activity";
import { deleteTrack } from "@/app/actions/tracks";
import { deleteContact } from "@/app/actions/contacts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { OfferForm } from "@/components/offer-form";
import { TrackDialog } from "@/components/track-dialog";
import { ContactDialog } from "@/components/contact-dialog";
import { DeleteButton } from "@/components/delete-button";
import { ActivityTimeline } from "@/components/activity-timeline";
import {
  STATUS_LABELS,
  STATUS_COLORS,
  TRACK_TYPE_LABELS,
  getBankParent,
} from "@/lib/constants";
import { cn } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function OfferDetailPage({ params }: PageProps) {
  const { id } = await params;
  const [offer, events] = await Promise.all([
    getOfferById(id),
    getActivityEvents({ offerId: id }),
  ]);

  if (!offer) {
    notFound();
  }

  const totalTrackAmount = offer.tracks.reduce(
    (sum: number, t: { amount: string }) => sum + parseFloat(t.amount),
    0
  );

  const weightedRate =
    totalTrackAmount > 0
      ? offer.tracks.reduce(
          (sum: number, t: { interestRate: string; amount: string }) =>
            sum + parseFloat(t.interestRate) * parseFloat(t.amount),
          0
        ) / totalTrackAmount
      : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/offers">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold">{offer.bankName}</h2>
          {getBankParent(offer.bankName) && (
            <span className="text-sm text-muted-foreground">
              שייך ל{getBankParent(offer.bankName)}
            </span>
          )}
          <div className="flex items-center gap-2 mt-1">
            <Badge
              variant="secondary"
              className={cn(STATUS_COLORS[offer.status])}
            >
              {STATUS_LABELS[offer.status]}
            </Badge>
            <span className="text-sm text-muted-foreground">
              Created {offer.createdAt.toLocaleDateString("he-IL")}
            </span>
          </div>
        </div>
        <DeleteButton
          onDelete={async () => {
            "use server";
            await deleteOffer(id);
          }}
          label="Delete Offer"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Track Amount
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">
              {totalTrackAmount > 0
                ? `₪${totalTrackAmount.toLocaleString()}`
                : "—"}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Weighted Avg Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">
              {weightedRate > 0 ? `${weightedRate.toFixed(2)}%` : "—"}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="tracks">
        <TabsList>
          <TabsTrigger value="tracks">
            Tracks ({offer.tracks.length})
          </TabsTrigger>
          <TabsTrigger value="contacts">
            Contacts ({offer.contacts.length})
          </TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="edit">Edit Details</TabsTrigger>
        </TabsList>

        <TabsContent value="tracks" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>מסלולים (Tracks)</CardTitle>
              <TrackDialog offerId={id} />
            </CardHeader>
            <CardContent className="p-0">
              {offer.tracks.length === 0 ? (
                <div className="p-6 text-center text-muted-foreground">
                  No tracks added yet.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Interest Rate</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Period</TableHead>
                      <TableHead>Notes</TableHead>
                      <TableHead className="w-20" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {offer.tracks.map((track) => (
                      <TableRow key={track.id}>
                        <TableCell className="font-medium">
                          {TRACK_TYPE_LABELS[track.trackType]}
                        </TableCell>
                        <TableCell>{track.interestRate}%</TableCell>
                        <TableCell>
                          ₪{parseFloat(track.amount).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          {track.periodMonths} months (
                          {Math.round(track.periodMonths / 12)} yrs)
                        </TableCell>
                        <TableCell className="text-muted-foreground max-w-[200px] truncate">
                          {track.notes || "—"}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <TrackDialog offerId={id} track={track} />
                            <DeleteButton
                              iconOnly
                              onDelete={async () => {
                                "use server";
                                await deleteTrack(track.id, id);
                              }}
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contacts" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Contacts</CardTitle>
              <ContactDialog offerId={id} />
            </CardHeader>
            <CardContent className="p-0">
              {offer.contacts.length === 0 ? (
                <div className="p-6 text-center text-muted-foreground">
                  No contacts added yet.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Notes</TableHead>
                      <TableHead className="w-20" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {offer.contacts.map((contact) => (
                      <TableRow key={contact.id}>
                        <TableCell className="font-medium">
                          {contact.name}
                        </TableCell>
                        <TableCell>{contact.role || "—"}</TableCell>
                        <TableCell>{contact.phone || "—"}</TableCell>
                        <TableCell>{contact.email || "—"}</TableCell>
                        <TableCell className="text-muted-foreground max-w-[200px] truncate">
                          {contact.notes || "—"}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <ContactDialog
                              offerId={id}
                              contact={contact}
                            />
                            <DeleteButton
                              iconOnly
                              onDelete={async () => {
                                "use server";
                                await deleteContact(contact.id);
                              }}
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <ActivityTimeline offerId={id} events={events} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="edit" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Edit Offer</CardTitle>
            </CardHeader>
            <CardContent>
              <OfferForm mortgageId={offer.mortgageId} offer={offer} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

    </div>
  );
}
