import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getMortgage } from "@/app/actions/mortgage";
import { OfferForm } from "@/components/offer-form";
import { redirect } from "next/navigation";

export default async function NewOfferPage() {
  const mortgage = await getMortgage();

  if (!mortgage) {
    redirect("/");
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h2 className="text-2xl font-bold">New Bank Offer</h2>
      <Card>
        <CardHeader>
          <CardTitle>Offer Details</CardTitle>
        </CardHeader>
        <CardContent>
          <OfferForm mortgageId={mortgage.id} />
        </CardContent>
      </Card>
    </div>
  );
}
