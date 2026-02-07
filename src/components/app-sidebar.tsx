"use client";

import { Home, Building2, Users, UserPlus, Landmark, Receipt, CalendarDays, LayoutDashboard } from "lucide-react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { MortgageSwitcher } from "@/components/mortgage-switcher";
import { ThemeToggle } from "@/components/theme-toggle";

const mainNav = [
  { title: "Dashboard", href: "/", icon: Home },
  { title: "Bank Offers", href: "/offers", icon: Building2 },
];

const financeNav = [
  { title: "Loans", href: "/loans", icon: Landmark },
  { title: "Costs", href: "/costs", icon: Receipt },
  { title: "Timeline", href: "/timeline", icon: CalendarDays },
];

const teamNav = [
  { title: "Contacts", href: "/contacts", icon: Users },
  { title: "Members", href: "/members", icon: UserPlus },
];

type Mortgage = {
  id: string;
  propertyValue: string | null;
  role: "owner" | "member";
  offersCount: number;
};

export function AppSidebar({
  mortgages = [],
  activeMortgageId,
}: {
  mortgages?: Mortgage[];
  activeMortgageId?: string;
}) {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const renderNavGroup = (items: typeof mainNav) =>
    items.map((item) => (
      <SidebarMenuItem key={item.href}>
        <SidebarMenuButton asChild isActive={isActive(item.href)}>
          <Link href={item.href}>
            <item.icon className="h-4 w-4" />
            <span>{item.title}</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    ));

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border px-5 py-4">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <LayoutDashboard className="h-4 w-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold tracking-tight">Mortgage</span>
            <span className="text-[10px] font-medium uppercase tracking-widest text-sidebar-foreground/60">Compare</span>
          </div>
        </Link>
      </SidebarHeader>
      <MortgageSwitcher mortgages={mortgages} activeMortgageId={activeMortgageId} />
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Overview</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>{renderNavGroup(mainNav)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarSeparator />
        <SidebarGroup>
          <SidebarGroupLabel>Finance</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>{renderNavGroup(financeNav)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarSeparator />
        <SidebarGroup>
          <SidebarGroupLabel>Team</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>{renderNavGroup(teamNav)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <UserButton afterSignOutUrl="/sign-in" />
            <span className="text-sm text-sidebar-foreground/60">Account</span>
          </div>
          <ThemeToggle />
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
