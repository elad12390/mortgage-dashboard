"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { acceptInvite } from "@/app/actions/invites";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export function InviteAcceptButton({ token }: { token: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAccept() {
    setLoading(true);
    setError(null);

    try {
      await acceptInvite(token);
      router.push("/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to accept invite");
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <Button onClick={handleAccept} disabled={loading} className="w-full">
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Join this mortgage
      </Button>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
