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
import { createContact, updateContact } from "@/app/actions/contacts";
import { toast } from "sonner";
import { Plus, Pencil } from "lucide-react";
import type { Contact } from "@/db/schema";

interface ContactDialogProps {
  mortgageId?: string;
  offerId?: string;
  contact?: Contact;
}

export function ContactDialog({ mortgageId, offerId, contact }: ContactDialogProps) {
  const [open, setOpen] = useState(false);

  async function handleSubmit(formData: FormData) {
    try {
      if (contact) {
        await updateContact(contact.id, formData);
        toast.success("Contact updated");
      } else {
        await createContact({ mortgageId, offerId }, formData);
        toast.success("Contact added");
      }
      setOpen(false);
    } catch {
      toast.error("Something went wrong");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {contact ? (
          <Button variant="ghost" size="icon">
            <Pencil className="h-4 w-4" />
          </Button>
        ) : (
          <Button size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Add Contact
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {contact ? "Edit Contact" : "Add Contact"}
          </DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input
              name="name"
              defaultValue={contact?.name ?? ""}
              placeholder="Contact name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Role</Label>
            <Input
              name="role"
              defaultValue={contact?.role ?? ""}
              placeholder="e.g. Mortgage advisor, Banker"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input
                name="phone"
                defaultValue={contact?.phone ?? ""}
                placeholder="e.g. 050-1234567"
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                name="email"
                type="email"
                defaultValue={contact?.email ?? ""}
                placeholder="email@bank.co.il"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea
              name="notes"
              defaultValue={contact?.notes ?? ""}
              placeholder="Additional notes..."
              rows={2}
            />
          </div>

          <Button type="submit" className="w-full">
            {contact ? "Update" : "Add Contact"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
