import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { UserButton } from "@clerk/nextjs";
import { requireUserId } from "@/lib/auth";
import { getUserMortgages } from "@/app/actions/mortgage";
import { getActiveMortgageId } from "@/lib/active-mortgage";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const userId = await requireUserId();
  const mortgages = await getUserMortgages(userId);
  const activeMortgageId = await getActiveMortgageId();

  return (
    <SidebarProvider>
      <AppSidebar mortgages={mortgages} activeMortgageId={activeMortgageId} />
      <main className="flex-1 overflow-auto">
        <div className="flex items-center justify-between border-b px-6 py-3">
          <SidebarTrigger />
          <UserButton />
        </div>
        <div className="p-6">{children}</div>
      </main>
    </SidebarProvider>
  );
}
