"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createMortgage, updateMortgage } from "@/app/actions/mortgage";
import { toast } from "sonner";
import { AlertCircle } from "lucide-react";
import type { Mortgage } from "@/db/schema";

const MAX_LTV = 0.75;
const DEFAULT_ANNUAL_RATE = 0.045; // 4.5% for estimation

function formatWithCommas(value: string): string {
  const digits = value.replace(/\D/g, "");
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function stripCommas(value: string): string {
  return value.replace(/,/g, "");
}

function toNumber(value: string): number {
  return parseFloat(stripCommas(value)) || 0;
}

function calculateMonthlyPayment(
  principal: number,
  annualRate: number,
  years: number
): number {
  if (principal <= 0 || years <= 0) return 0;
  const monthlyRate = annualRate / 12;
  const n = years * 12;
  if (monthlyRate === 0) return principal / n;
  return (principal * monthlyRate * Math.pow(1 + monthlyRate, n)) / (Math.pow(1 + monthlyRate, n) - 1);
}

function CurrencyInput({
  id,
  name,
  value,
  onChange,
  placeholder,
  required,
  error,
}: {
  id: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  required?: boolean;
  error?: string;
}) {
  return (
    <div>
      <div className="relative">
        <Input
          id={id}
          type="text"
          inputMode="numeric"
          value={value}
          onChange={(e) => onChange(formatWithCommas(e.target.value))}
          placeholder={placeholder}
          required={required}
          className={`pr-8 ${error ? "border-red-500 focus-visible:ring-red-500/50" : ""}`}
        />
        <span className="text-muted-foreground pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm">
          ₪
        </span>
        <input type="hidden" name={name} value={stripCommas(value)} />
      </div>
      {error && (
        <p className="mt-1 flex items-center gap-1 text-xs text-red-500">
          <AlertCircle className="h-3 w-3" />
          {error}
        </p>
      )}
    </div>
  );
}

interface MortgageSetupProps {
  mortgage?: Mortgage;
}

export function MortgageSetup({ mortgage }: MortgageSetupProps) {
  const [propertyValue, setPropertyValue] = useState(() =>
    mortgage?.propertyValue ? formatWithCommas(String(mortgage.propertyValue)) : ""
  );
  const [loanAmount, setLoanAmount] = useState(() =>
    mortgage?.loanAmount ? formatWithCommas(String(mortgage.loanAmount)) : ""
  );
  const [termYears, setTermYears] = useState(() =>
    mortgage?.mortgageTermYears ? String(mortgage.mortgageTermYears) : ""
  );

  const propNum = toNumber(propertyValue);
  const loanNum = toNumber(loanAmount);
  const termNum = parseInt(termYears, 10) || 0;

  const maxLoan = propNum * MAX_LTV;
  const ltvExceeded = propNum > 0 && loanNum > 0 && loanNum > maxLoan;
  const ltvPercent = propNum > 0 && loanNum > 0 ? ((loanNum / propNum) * 100).toFixed(1) : null;

  const monthlyPayment = calculateMonthlyPayment(loanNum, DEFAULT_ANNUAL_RATE, termNum);

  async function handleSubmit(formData: FormData) {
    if (ltvExceeded) {
      toast.error(`Loan amount cannot exceed 75% of property value (₪${maxLoan.toLocaleString()})`);
      return;
    }
    try {
      if (mortgage) {
        await updateMortgage(mortgage.id, formData);
        toast.success("Mortgage updated");
      } else {
        await createMortgage(formData);
        toast.success("Mortgage created");
      }
    } catch (error) {
      if (error instanceof Error && error.message === "NEXT_REDIRECT") {
        throw error;
      }
      toast.error("Something went wrong");
    }
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="propertyValue">Property Value</Label>
          <CurrencyInput
            id="propertyValue"
            name="propertyValue"
            value={propertyValue}
            onChange={setPropertyValue}
            placeholder="e.g. 2,000,000"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="loanAmount">
            Loan Amount
            {ltvPercent && (
              <span className={`ml-2 text-xs font-normal ${ltvExceeded ? "text-red-500" : "text-muted-foreground"}`}>
                LTV {ltvPercent}%
              </span>
            )}
          </Label>
          <CurrencyInput
            id="loanAmount"
            name="loanAmount"
            value={loanAmount}
            onChange={setLoanAmount}
            placeholder="e.g. 1,500,000"
            required
            error={
              ltvExceeded
                ? `Max 75% of property value (₪${maxLoan.toLocaleString()})`
                : undefined
            }
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="mortgageTermYears">Mortgage Term (Years)</Label>
          <Input
            id="mortgageTermYears"
            name="mortgageTermYears"
            type="number"
            min={1}
            max={30}
            value={termYears}
            onChange={(e) => setTermYears(e.target.value)}
            placeholder="e.g. 25"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-muted-foreground">Est. Monthly Payment</Label>
          <div className="border-input bg-muted/50 flex h-9 items-center rounded-md border px-3 text-sm">
            {monthlyPayment > 0 ? (
              <>
                <span className="font-semibold">₪{Math.round(monthlyPayment).toLocaleString()}</span>
                <span className="text-muted-foreground ml-1.5 text-xs">/mo · ~{(DEFAULT_ANNUAL_RATE * 100).toFixed(1)}% rate</span>
              </>
            ) : (
              <span className="text-muted-foreground">Enter loan & term</span>
            )}
          </div>
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={ltvExceeded}>
        {mortgage ? "Update Mortgage" : "Create Mortgage"}
      </Button>
    </form>
  );
}
