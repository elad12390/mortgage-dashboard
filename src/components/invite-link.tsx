"use client";

import { useState } from "react";
import { createInvite } from "@/app/actions/invites";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, Copy, Loader2 } from "lucide-react";
import type { MortgageInvite } from "@/db/schema";

export function InviteLink({
  mortgageId,
  activeInvite,
}: {
  mortgageId: string;
  activeInvite: MortgageInvite | null;
}) {
  const [invite, setInvite] = useState<MortgageInvite | null>(activeInvite);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  async function handleGenerate() {
    setLoading(true);
    try {
      const result = await createInvite(mortgageId);
      const inviteUrl = `${window.location.origin}/invite/${result.token}`;
      setInvite({
        id: "",
        mortgageId,
        token: result.token,
        createdByUserId: "",
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        usedByUserId: null,
        usedAt: null,
        createdAt: new Date(),
      });
    } catch (error) {
      console.error("Failed to create invite:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    if (!invite) return;
    const inviteUrl = `${window.location.origin}/invite/${invite.token}`;
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (!invite) {
    return (
      <Button onClick={handleGenerate} disabled={loading}>
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Generate Invite Link
      </Button>
    );
  }

  const inviteUrl = `${window.location.origin}/invite/${invite.token}`;
  const expiresAt = new Intl.DateTimeFormat("he-IL", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(invite.expiresAt);

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input value={inviteUrl} readOnly className="font-mono text-sm" />
        <Button onClick={handleCopy} variant="outline" size="icon">
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        </Button>
      </div>
      <div className="flex items-center justify-between text-sm">
        <p className="text-muted-foreground">Expires: {expiresAt}</p>
        <Button onClick={handleGenerate} variant="ghost" size="sm" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Generate New
        </Button>
      </div>
    </div>
  );
}
