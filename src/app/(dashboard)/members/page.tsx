import { getMortgage } from "@/app/actions/mortgage";
import { getMembers, getActiveInvite } from "@/app/actions/invites";
import { requireUserId } from "@/lib/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { InviteLink } from "@/components/invite-link";
import { MembersList } from "@/components/members-list";
import { redirect } from "next/navigation";

export default async function MembersPage() {
  const userId = await requireUserId();
  const mortgage = await getMortgage();

  if (!mortgage) {
    redirect("/");
  }

  const members = await getMembers(mortgage.id);
  const isOwner = mortgage.userId === userId;
  const activeInvite = isOwner ? await getActiveInvite(mortgage.id) : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Members</h1>
        <p className="text-muted-foreground">
          Manage who has access to this mortgage
        </p>
      </div>

      {isOwner && (
        <Card>
          <CardHeader>
            <CardTitle>Invite Link</CardTitle>
            <CardDescription>
              Share this link with someone to give them access
            </CardDescription>
          </CardHeader>
          <CardContent>
            <InviteLink mortgageId={mortgage.id} activeInvite={activeInvite} />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Current Members</CardTitle>
          <CardDescription>
            {members.length} {members.length === 1 ? "person has" : "people have"} access
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MembersList
            members={members}
            mortgageId={mortgage.id}
            currentUserId={userId}
            isOwner={isOwner}
          />
        </CardContent>
      </Card>
    </div>
  );
}
