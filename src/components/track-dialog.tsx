"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createTrack, updateTrack } from "@/app/actions/tracks";
import { TRACK_TYPES, TRACK_TYPE_LABELS } from "@/lib/constants";
import { toast } from "sonner";
import { Plus, Pencil } from "lucide-react";
import type { MortgageTrack } from "@/db/schema";

interface TrackDialogProps {
  offerId: string;
  track?: MortgageTrack;
}

export function TrackDialog({ offerId, track }: TrackDialogProps) {
  const [open, setOpen] = useState(false);

  async function handleSubmit(formData: FormData) {
    try {
      if (track) {
        await updateTrack(track.id, offerId, formData);
        toast.success("Track updated");
      } else {
        await createTrack(offerId, formData);
        toast.success("Track added");
      }
      setOpen(false);
    } catch {
      toast.error("Something went wrong");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {track ? (
          <Button variant="ghost" size="icon">
            <Pencil className="h-4 w-4" />
          </Button>
        ) : (
          <Button size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Add Track
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{track ? "Edit Track" : "Add Track"}</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Track Type</Label>
            <Select
              name="trackType"
              defaultValue={track?.trackType ?? ""}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {TRACK_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {TRACK_TYPE_LABELS[type]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Interest Rate (%)</Label>
              <Input
                name="interestRate"
                type="number"
                step="0.001"
                defaultValue={track?.interestRate ?? ""}
                placeholder="e.g. 3.5"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Amount (₪)</Label>
              <Input
                name="amount"
                type="number"
                defaultValue={track?.amount ?? ""}
                placeholder="e.g. 500000"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Period (months)</Label>
            <Input
              name="periodMonths"
              type="number"
              defaultValue={track?.periodMonths ?? ""}
              placeholder="e.g. 240"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea
              name="notes"
              defaultValue={track?.notes ?? ""}
              placeholder="Additional notes..."
              rows={2}
            />
          </div>

          <Button type="submit" className="w-full">
            {track ? "Update" : "Add Track"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
