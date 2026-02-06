"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { addMessage, deleteMessage } from "@/app/actions/activity";
import { addLoanMessage, deleteLoanMessage } from "@/app/actions/loans";
import { STATUS_LABELS, STATUS_COLORS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Send, X, ArrowRight, Clock } from "lucide-react";
import type { ActivityEvent } from "@/db/schema";

interface ActivityTimelineProps {
  mortgageId?: string;
  offerId?: string;
  loanId?: string;
  events: ActivityEvent[];
}

function formatTimestamp(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1 && diffMs >= 0) return "just now";
  if (diffMins < 60 && diffMins >= 0) return `${diffMins}m ago`;
  if (diffHours < 24 && diffHours >= 0) return `${diffHours}h ago`;
  if (diffDays < 7 && diffDays >= 0) return `${diffDays}d ago`;

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  }) + " " + date.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function toLocalDatetimeString(date: Date): string {
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function ActivityTimeline({
  mortgageId,
  offerId,
  loanId,
  events,
}: ActivityTimelineProps) {
  const [message, setMessage] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [customDate, setCustomDate] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = message.trim();
    if (!trimmed) return;

    setIsPending(true);
    try {
      if (loanId) {
        await addLoanMessage(
          loanId,
          trimmed,
          customDate ? new Date(customDate) : undefined
        );
      } else {
        await addMessage(
          { mortgageId, offerId },
          trimmed,
          customDate || undefined
        );
      }
      setMessage("");
      setCustomDate("");
      setShowDatePicker(false);
    } finally {
      setIsPending(false);
    }
  }

  async function handleDelete(eventId: string) {
    setIsPending(true);
    try {
      if (loanId) {
        await deleteLoanMessage(eventId);
      } else {
        await deleteMessage(eventId);
      }
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="space-y-3">
      <form onSubmit={handleSubmit} className="space-y-2">
        <div className="flex items-center gap-2">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Add a note..."
            disabled={isPending}
            className="flex-1"
          />
          <Button
            type="button"
            variant={showDatePicker ? "secondary" : "ghost"}
            size="icon"
            onClick={() => {
              setShowDatePicker(!showDatePicker);
              if (showDatePicker) setCustomDate("");
            }}
            title="Set custom date/time"
          >
            <Clock className="h-4 w-4" />
          </Button>
          <Button
            type="submit"
            size="icon"
            disabled={isPending || !message.trim()}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        {showDatePicker && (
          <div className="flex items-center gap-2">
            <Input
              type="datetime-local"
              value={customDate || toLocalDatetimeString(new Date())}
              onChange={(e) => setCustomDate(e.target.value)}
              className="w-auto text-sm"
            />
            <span className="text-xs text-muted-foreground">
              Backdate this entry
            </span>
          </div>
        )}
      </form>

      <div className="max-h-80 space-y-2 overflow-y-auto">
        {events.length === 0 && (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No activity yet.
          </p>
        )}

        {events.map((event) => {
          if (event.eventType === "status_change") {
            const meta = event.metadata as {
              fromStatus: string | null;
              toStatus: string;
            } | null;

            return (
              <div
                key={event.id}
                className="flex items-center justify-center gap-2 py-2"
              >
                <div className="flex items-center gap-1.5 rounded-full bg-muted/50 px-3 py-1 text-xs text-muted-foreground">
                  {meta?.fromStatus && (
                    <>
                      <Badge
                        variant="secondary"
                        className={cn(
                          "text-[10px] px-1.5 py-0",
                          STATUS_COLORS[meta.fromStatus]
                        )}
                      >
                        {STATUS_LABELS[meta.fromStatus] ?? meta.fromStatus}
                      </Badge>
                      <ArrowRight className="h-3 w-3 shrink-0" />
                    </>
                  )}
                  <Badge
                    variant="secondary"
                    className={cn(
                      "text-[10px] px-1.5 py-0",
                      meta?.toStatus ? STATUS_COLORS[meta.toStatus] : ""
                    )}
                  >
                    {meta?.toStatus
                      ? (STATUS_LABELS[meta.toStatus] ?? meta.toStatus)
                      : event.content}
                  </Badge>
                  <span className="ml-1 text-[10px] opacity-60">
                    {formatTimestamp(event.createdAt)}
                  </span>
                </div>
              </div>
            );
          }

          return (
            <div
              key={event.id}
              className="group flex items-start gap-2"
            >
              <div className="flex-1 rounded-lg bg-muted/40 px-3 py-2">
                <p className="text-sm whitespace-pre-wrap">{event.content}</p>
                <span className="mt-1 block text-[10px] text-muted-foreground">
                  {formatTimestamp(event.createdAt)}
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                onClick={() => handleDelete(event.id)}
                disabled={isPending}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
