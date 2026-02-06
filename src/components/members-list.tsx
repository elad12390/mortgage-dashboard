"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { removeMember } from "@/app/actions/invites";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Loader2 } from "lucide-react";

type Member = {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  imageUrl: string;
  role: "owner" | "member";
  joinedAt: Date | null;
};

export function MembersList({
  members,
  mortgageId,
  currentUserId,
  isOwner,
}: {
  members: Member[];
  mortgageId: string;
  currentUserId: string;
  isOwner: boolean;
}) {
  const router = useRouter();
  const [removing, setRemoving] = useState<string | null>(null);

  async function handleRemove(memberUserId: string) {
    setRemoving(memberUserId);
    try {
      await removeMember(mortgageId, memberUserId);
      router.refresh();
    } catch (error) {
      console.error("Failed to remove member:", error);
    } finally {
      setRemoving(null);
    }
  }

  return (
    <div className="space-y-4">
      {members.map((member) => {
        const isSelf = member.userId === currentUserId;
        const canRemove = isOwner ? member.role !== "owner" : isSelf;
        const buttonLabel = isSelf ? "Leave" : "Remove";

        return (
          <div key={member.userId} className="flex items-center gap-4">
            <Avatar>
              <AvatarImage src={member.imageUrl} alt={member.firstName} />
              <AvatarFallback>
                {member.firstName[0]}
                {member.lastName[0]}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="font-medium">
                  {member.firstName} {member.lastName}
                </p>
                {member.role === "owner" && (
                  <Badge variant="secondary">Owner</Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{member.email}</p>
              {member.joinedAt && (
                <p className="text-xs text-muted-foreground">
                  Joined{" "}
                  {new Intl.DateTimeFormat("en-US", {
                    dateStyle: "medium",
                  }).format(member.joinedAt)}
                </p>
              )}
            </div>
            {canRemove && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={removing === member.userId}
                  >
                    {removing === member.userId && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    {buttonLabel}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      {isSelf ? "Leave this mortgage?" : "Remove member?"}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      {isSelf
                        ? "You will lose access to this mortgage and all its data."
                        : `${member.firstName} ${member.lastName} will lose access to this mortgage.`}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => handleRemove(member.userId)}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {isSelf ? "Leave" : "Remove"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        );
      })}
    </div>
  );
}
