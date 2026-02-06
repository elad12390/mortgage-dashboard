"use client";

import { useRouter } from "next/navigation";
import { setActiveMortgageId } from "@/lib/active-mortgage";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Mortgage = {
  id: string;
  propertyValue: string | null;
  role: "owner" | "member";
  offersCount: number;
};

export function MortgageSwitcher({
  mortgages,
  activeMortgageId,
}: {
  mortgages: Mortgage[];
  activeMortgageId: string | undefined;
}) {
  const router = useRouter();

  if (mortgages.length <= 1) {
    return null;
  }

  async function handleChange(mortgageId: string) {
    await setActiveMortgageId(mortgageId);
    router.refresh();
  }

  return (
    <div className="px-4 py-2">
      <Select value={activeMortgageId} onValueChange={handleChange}>
        <SelectTrigger>
          <SelectValue placeholder="Select mortgage" />
        </SelectTrigger>
        <SelectContent>
          {mortgages.map((mortgage) => {
            const value = mortgage.propertyValue
              ? new Intl.NumberFormat("he-IL", {
                  style: "currency",
                  currency: "ILS",
                  minimumFractionDigits: 0,
                }).format(Number(mortgage.propertyValue))
              : "No value";

            const label = `${value} (${mortgage.role === "owner" ? "My Mortgage" : "Shared"})`;

            return (
              <SelectItem key={mortgage.id} value={mortgage.id}>
                {label}
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    </div>
  );
}
