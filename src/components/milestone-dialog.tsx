"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
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
import { createMilestone, updateMilestone } from "@/app/actions/milestones";
import { milestoneTypePresets } from "@/lib/constants";
import { toast } from "sonner";
import { Plus, Pencil } from "lucide-react";
import type { PaymentMilestone } from "@/db/schema";

interface MilestoneDialogProps {
  mortgageId: string;
  milestone?: PaymentMilestone;
  children?: React.ReactNode;
}

export function MilestoneDialog({ mortgageId, milestone, children }: MilestoneDialogProps) {
  const [open, setOpen] = useState(false);
  const [namePreset, setNamePreset] = useState(
    milestone?.name && Object.values(milestoneTypePresets).includes(milestone.name)
      ? Object.keys(milestoneTypePresets).find(
          (key) => milestoneTypePresets[key as keyof typeof milestoneTypePresets] === milestone.name
        ) || "custom"
      : "custom"
  );
  const [customName, setCustomName] = useState(
    milestone?.name && !Object.values(milestoneTypePresets).includes(milestone.name)
      ? milestone.name
      : ""
  );
  const [amount, setAmount] = useState(milestone?.amount?.toString() ?? "");
  const [date, setDate] = useState(
    milestone?.date ? new Date(milestone.date).toISOString().split("T")[0] : ""
  );
  const [isPaid, setIsPaid] = useState(milestone?.isPaid === 1);
  const [notes, setNotes] = useState(milestone?.notes ?? "");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    try {
      const finalName =
        namePreset === "custom"
          ? customName
          : milestoneTypePresets[namePreset as keyof typeof milestoneTypePresets];

      if (!finalName) {
        toast.error("יש להזין שם לאבן הדרך");
        return;
      }

      const data = {
        name: finalName,
        amount,
        date: new Date(date),
        isPaid: isPaid ? 1 : 0,
        notes: notes || undefined,
      };

      if (milestone) {
        await updateMilestone(milestone.id, data);
      } else {
        await createMilestone(mortgageId, data);
      }

      toast.success("אבן הדרך נשמרה בהצלחה");
      setOpen(false);
    } catch {
      toast.error("שגיאה בשמירת אבן הדרך");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {milestone ? (
          children ? (
            children
          ) : (
            <Button variant="ghost" size="icon">
              <Pencil className="h-4 w-4" />
            </Button>
          )
        ) : (
          <Button size="sm">
            <Plus className="mr-2 h-4 w-4" />
            אבן דרך חדשה
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {milestone ? "עריכת אבן דרך" : "אבן דרך חדשה"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>סוג אבן דרך</Label>
            <Select
              value={namePreset}
              onValueChange={(value) => {
                setNamePreset(value);
                if (value !== "custom") {
                  setCustomName("");
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="בחר סוג אבן דרך" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(milestoneTypePresets).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {namePreset === "custom" && (
            <div className="space-y-2">
              <Label>שם מותאם אישית</Label>
              <Input
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="הזן שם אבן דרך"
                required
              />
            </div>
          )}

          <div className="space-y-2">
            <Label>סכום (₪)</Label>
            <Input
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>תאריך</Label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          <div className="flex items-center space-x-2 space-x-reverse">
            <Checkbox
              id="isPaid"
              checked={isPaid}
              onCheckedChange={(checked: boolean) => setIsPaid(checked === true)}
            />
            <Label htmlFor="isPaid" className="cursor-pointer">
              שולם
            </Label>
          </div>

          <div className="space-y-2">
            <Label>הערות</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="הערות נוספות (אופציונלי)"
              rows={3}
            />
          </div>

          <Button type="submit" className="w-full">
            שמור
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default MilestoneDialog;
