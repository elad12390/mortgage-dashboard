import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getMortgage } from "@/app/actions/mortgage";
import { getGlobalContacts, deleteContact } from "@/app/actions/contacts";
import { ContactDialog } from "@/components/contact-dialog";
import { DeleteButton } from "@/components/delete-button";
import { redirect } from "next/navigation";

export default async function ContactsPage() {
  const mortgage = await getMortgage();

  if (!mortgage) {
    redirect("/");
  }

  const contacts = await getGlobalContacts(mortgage.id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Contacts</h2>
          <p className="text-sm text-muted-foreground">
            Global contacts for your mortgage (advisor, lawyer, etc.)
          </p>
        </div>
        <ContactDialog mortgageId={mortgage.id} />
      </div>

      <Card>
        <CardContent className="p-0">
          {contacts.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground">
              No contacts added yet. Add your mortgage advisor, lawyer, or other contacts.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead className="w-20" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {contacts.map((contact) => (
                  <TableRow key={contact.id}>
                    <TableCell className="font-medium">
                      {contact.name}
                    </TableCell>
                    <TableCell>{contact.role || "—"}</TableCell>
                    <TableCell>{contact.phone || "—"}</TableCell>
                    <TableCell>{contact.email || "—"}</TableCell>
                    <TableCell className="text-muted-foreground max-w-[200px] truncate">
                      {contact.notes || "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <ContactDialog
                          mortgageId={mortgage.id}
                          contact={contact}
                        />
                        <DeleteButton
                          iconOnly
                          onDelete={async () => {
                            "use server";
                            await deleteContact(contact.id);
                          }}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
