"use client";

import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MortgageSetup } from "@/components/mortgage-setup";
import { Pencil, X } from "lucide-react";
import type { Mortgage } from "@/db/schema";

interface EditMortgageToggleProps {
  mortgage: Mortgage;
  children: ReactNode;
}

export function EditMortgageToggle({
  mortgage,
  children,
}: EditMortgageToggleProps) {
  const [editing, setEditing] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Mortgage Details</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setEditing(!editing)}
        >
          {editing ? (
            <>
              <X className="mr-1.5 h-3.5 w-3.5" />
              Cancel
            </>
          ) : (
            <>
              <Pencil className="mr-1.5 h-3.5 w-3.5" />
              Edit
            </>
          )}
        </Button>
      </div>

      {editing ? (
        <Card>
          <CardHeader>
            <CardTitle>Edit Mortgage</CardTitle>
          </CardHeader>
          <CardContent>
            <MortgageSetup mortgage={mortgage} />
          </CardContent>
        </Card>
      ) : (
        children
      )}
    </div>
  );
}
