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
import { createLoan, updateLoan } from "@/app/actions/loans";
import { loanStatusLabels } from "@/lib/constants";
import { toast } from "sonner";
import { Plus, Pencil } from "lucide-react";
import type { Loan } from "@/db/schema";

interface LoanDialogProps {
  mortgageId: string;
  loan?: Loan;
  children?: React.ReactNode;
}

export function LoanDialog({ mortgageId, loan, children }: LoanDialogProps) {
  const [open, setOpen] = useState(false);
  const [lenderName, setLenderName] = useState(loan?.lenderName ?? "");
  const [amount, setAmount] = useState(loan?.amount?.toString() ?? "");
  const [interestRate, setInterestRate] = useState(
    loan?.interestRate?.toString() ?? ""
  );
  const [monthlyRepayment, setMonthlyRepayment] = useState(
    loan?.monthlyRepayment?.toString() ?? ""
  );
  const [termMonths, setTermMonths] = useState(
    loan?.termMonths?.toString() ?? ""
  );
  const [startDate, setStartDate] = useState(
    loan?.startDate ? new Date(loan.startDate).toISOString().split("T")[0] : ""
  );
  const [status, setStatus] = useState(loan?.status ?? "pending");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    try {
      const data = {
        lenderName,
        amount: amount || undefined,
        interestRate: interestRate || undefined,
        monthlyRepayment: monthlyRepayment || undefined,
        termMonths: termMonths ? parseInt(termMonths) : undefined,
        startDate: startDate ? new Date(startDate) : undefined,
        status: status as "pending" | "approved" | "received" | "repaying" | "completed",
      };

      if (loan) {
        await updateLoan(loan.id, data);
      } else {
        await createLoan(mortgageId, data);
      }

      toast.success("ההלוואה נשמרה בהצלחה");
      setOpen(false);
    } catch {
      toast.error("שגיאה בשמירת ההלוואה");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {loan ? (
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
            הלוואה חדשה
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {loan ? "עריכת הלוואה" : "הלוואה חדשה"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>שם מלווה</Label>
            <Input
              value={lenderName}
              onChange={(e) => setLenderName(e.target.value)}
              placeholder="שם המלווה"
              required
            />
          </div>

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

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>ריבית שנתית (%)</Label>
              <Input
                type="number"
                step="0.01"
                value={interestRate}
                onChange={(e) => setInterestRate(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label>תשלום חודשי (₪)</Label>
              <Input
                type="number"
                step="0.01"
                value={monthlyRepayment}
                onChange={(e) => setMonthlyRepayment(e.target.value)}
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>תקופה (חודשים)</Label>
              <Input
                type="number"
                value={termMonths}
                onChange={(e) => setTermMonths(e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label>תאריך התחלה</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>סטטוס</Label>
            <Select
              value={status}
              onValueChange={(value) =>
                setStatus(
                  value as "pending" | "approved" | "received" | "repaying" | "completed"
                )
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(loanStatusLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" className="w-full">
            שמור
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
