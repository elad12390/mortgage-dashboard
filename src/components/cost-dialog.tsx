"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { createCost, updateCost } from "@/app/actions/costs";
import { costCategoryLabels, costPaymentStatusLabels } from "@/lib/constants";
import { toast } from "sonner";
import { Plus, Pencil } from "lucide-react";
import type { ExtraCost } from "@/db/schema";

interface CostDialogProps {
  mortgageId: string;
  cost?: ExtraCost;
  children?: React.ReactNode;
}

export function CostDialog({ mortgageId, cost, children }: CostDialogProps) {
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState(cost?.category ?? "");
  const [customCategory, setCustomCategory] = useState("");
  const [description, setDescription] = useState(cost?.description ?? "");
  const [amount, setAmount] = useState(cost?.amount?.toString() ?? "");
  const [paidAmount, setPaidAmount] = useState(
    cost?.paidAmount?.toString() ?? "0"
  );
  const [dueDate, setDueDate] = useState(
    cost?.dueDate ? new Date(cost.dueDate).toISOString().split("T")[0] : ""
  );
  const [notes, setNotes] = useState(cost?.notes ?? "");

  const getStatus = () => {
    const amountNum = parseFloat(amount) || 0;
    const paidNum = parseFloat(paidAmount) || 0;
    
    if (paidNum <= 0) return "unpaid";
    if (paidNum < amountNum) return "partially_paid";
    return "fully_paid";
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    try {
      const data = {
        category: category === "other" ? customCategory : category,
        description: description || undefined,
        amount: amount as string | number,
        paidAmount: paidAmount || "0",
        dueDate: dueDate ? new Date(dueDate) : undefined,
        notes: notes || undefined,
      };

      if (cost) {
        await updateCost(cost.id, data);
      } else {
        await createCost(mortgageId, data);
      }

      toast.success("Cost saved successfully");
      setOpen(false);
    } catch {
      toast.error("Error saving cost");
    }
  }

  const status = getStatus();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {cost ? (
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
            New Cost
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {cost ? "Edit Cost" : "New Cost"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Category</Label>
            <Select
              value={category}
              onValueChange={setCategory}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(costCategoryLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {category === "other" && (
            <div className="space-y-2">
            <Label>Custom Category Name</Label>
            <Input
              value={customCategory}
              onChange={(e) => setCustomCategory(e.target.value)}
              placeholder="Enter category name"
                required
              />
            </div>
          )}

          <div className="space-y-2">
            <Label>Description (optional)</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Cost description"
            />
          </div>

          <div className="space-y-2">
            <Label>Amount (₪)</Label>
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
            <Label>Amount Paid (₪)</Label>
            <Input
              type="number"
              step="0.01"
              value={paidAmount}
              onChange={(e) => setPaidAmount(e.target.value)}
              placeholder="0.00"
            />
          </div>

          <div className="space-y-2">
            <Label>Due Date (optional)</Label>
            <Input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Notes (optional)</Label>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes"
            />
          </div>

          <div className="space-y-2">
            <Label>Status</Label>
            <div className="px-3 py-2 rounded-md border border-input bg-muted text-sm">
              {costPaymentStatusLabels[status]}
            </div>
          </div>

          <Button type="submit" className="w-full">
            Save
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
