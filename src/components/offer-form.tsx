"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createOffer, updateOffer } from "@/app/actions/offers";
import {
  ISRAELI_BANKS,
  getParentBanks,
  getBankChildren,
  REQUEST_STATUSES,
  STATUS_LABELS,
} from "@/lib/constants";
import { toast } from "sonner";
import type { BankOffer } from "@/db/schema";

interface OfferFormProps {
  mortgageId: string;
  offer?: BankOffer;
}

export function OfferForm({ mortgageId, offer }: OfferFormProps) {
  const [useCustomBank, setUseCustomBank] = useState(
    offer ? !ISRAELI_BANKS.includes(offer.bankName) : false
  );

  const parentBanks = getParentBanks();

  async function handleSubmit(formData: FormData) {
    try {
      if (offer) {
        await updateOffer(offer.id, formData);
        toast.success("Offer updated");
      } else {
        await createOffer(mortgageId, formData);
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
      <div className="space-y-2">
        <Label htmlFor="bankName">Bank Name</Label>
        <div className="flex items-center gap-2">
          {useCustomBank ? (
            <Input
              id="bankName"
              name="bankName"
              defaultValue={offer?.bankName ?? ""}
              placeholder="Enter bank name"
              required
            />
          ) : (
            <Select name="bankName" defaultValue={offer?.bankName ?? ""} required>
              <SelectTrigger>
                <SelectValue placeholder="Select a bank" />
              </SelectTrigger>
              <SelectContent>
                {parentBanks.map((parent) => {
                  const children = getBankChildren(parent.name);
                  return (
                    <div key={parent.name}>
                      <SelectItem value={parent.name}>
                        {parent.name}
                      </SelectItem>
                      {children.map((child) => (
                        <SelectItem key={child.name} value={child.name}>
                          <span className="mr-2 text-muted-foreground">↳</span>
                          {child.name}
                        </SelectItem>
                      ))}
                    </div>
                  );
                })}
              </SelectContent>
            </Select>
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setUseCustomBank(!useCustomBank)}
          >
            {useCustomBank ? "Select bank" : "Custom"}
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="status">Status</Label>
        <Select
          name="status"
          defaultValue={offer?.status ?? "initial_inquiry"}
          required
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {REQUEST_STATUSES.map((status) => (
              <SelectItem key={status} value={status}>
                {STATUS_LABELS[status]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button type="submit" className="w-full">
        {offer ? "Update Offer" : "Create Offer"}
      </Button>
    </form>
  );
}
