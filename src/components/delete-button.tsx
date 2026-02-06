"use client";

import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

interface DeleteButtonProps {
  onDelete: () => Promise<void>;
  label?: string;
  iconOnly?: boolean;
}

export function DeleteButton({
  onDelete,
  label = "Delete",
  iconOnly = false,
}: DeleteButtonProps) {
  async function handleClick() {
    try {
      await onDelete();
      toast.success("Deleted successfully");
    } catch (error) {
      if (error instanceof Error && error.message === "NEXT_REDIRECT") {
        throw error;
      }
      toast.error("Failed to delete");
    }
  }

  if (iconOnly) {
    return (
      <Button variant="ghost" size="icon" onClick={handleClick}>
        <Trash2 className="h-4 w-4 text-destructive" />
      </Button>
    );
  }

  return (
    <Button variant="destructive" size="sm" onClick={handleClick}>
      <Trash2 className="mr-2 h-4 w-4" />
      {label}
    </Button>
  );
}
