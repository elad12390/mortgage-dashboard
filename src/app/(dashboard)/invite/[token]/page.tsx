import { notFound } from "next/navigation";
import { db } from "@/db";
import { mortgageInvites, mortgages } from "@/db/schema";
import { eq, and, isNull, gt } from "drizzle-orm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { InviteAcceptButton } from "@/components/invite-accept";
import { clerkClient } from "@clerk/nextjs/server";

export default async function InviteAcceptPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const invite = await db.query.mortgageInvites.findFirst({
    where: and(
      eq(mortgageInvites.token, token),
      isNull(mortgageInvites.usedAt),
      gt(mortgageInvites.expiresAt, new Date())
    ),
    with: {
      mortgage: true,
    },
  });

  if (!invite) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Invalid Invite</CardTitle>
            <CardDescription>
              This invite link is invalid or has expired.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const clerk = await clerkClient();
  const ownerUser = await clerk.users.getUser(invite.createdByUserId).catch(() => null);
  const ownerName = ownerUser
    ? `${ownerUser.firstName ?? ""} ${ownerUser.lastName ?? ""}`.trim() || "Unknown User"
    : "Unknown User";

  const propertyValue = invite.mortgage.propertyValue
    ? new Intl.NumberFormat("he-IL", {
        style: "currency",
        currency: "ILS",
        minimumFractionDigits: 0,
      }).format(Number(invite.mortgage.propertyValue))
    : "Not set";

  const expiresAt = new Intl.DateTimeFormat("he-IL", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(invite.expiresAt);

  return (
    <div className="flex min-h-[400px] items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Join Mortgage</CardTitle>
          <CardDescription>
            You've been invited to collaborate on a mortgage
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground">Invited by</p>
            <p className="font-medium">{ownerName}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Property Value</p>
            <p className="font-medium">{propertyValue}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Expires</p>
            <p className="text-sm">{expiresAt}</p>
          </div>
          <InviteAcceptButton token={token} />
        </CardContent>
      </Card>
    </div>
  );
}
