"use client"; 

import React from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarProvider,
  SidebarTrigger,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarInset,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { AppLogo } from "@/components/shared/AppLogo";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Bell, LogOut, ChevronDown, Settings, UserCircle } from "lucide-react"; 
import type { NavItem } from "@/lib/types";
import { cn } from "@/lib/utils";

interface DashboardLayoutProps {
  children: React.ReactNode;
  navItems: NavItem[];
  userRole: string; 
  userName?: string;
  userEmail?: string;
}

export function DashboardLayout({
  children,
  navItems,
  userRole,
  userName = "User",
  userEmail = "user@example.com",
}: DashboardLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = () => {
    localStorage.removeItem("currentUser"); // Clear user session
    console.log("User logged out");
    router.push("/"); 
  };

  const [openMenus, setOpenMenus] = React.useState<Record<string, boolean>>({});

  const toggleMenu = (href: string) => {
    setOpenMenus(prev => ({ ...prev, [href]: !prev[href] }));
  };
  
  React.useEffect(() => {
    const newOpenMenus: Record<string, boolean> = {};
    const checkAndOpenParent = (item: NavItem) => {
      if (item.children) {
        const isActiveParent = item.children.some(child => pathname.startsWith(child.href));
        if (isActiveParent) {
          newOpenMenus[item.href] = true;
          item.children.forEach(checkAndOpenParent); 
        }
      }
    };
    navItems.forEach(checkAndOpenParent);
    setOpenMenus(newOpenMenus);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, navItems]);

  const profileLinkPath = userRole === 'Management' ? 'host' : userRole.toLowerCase();


  return (
    <SidebarProvider defaultOpen>
      <Sidebar>
        <SidebarHeader className="p-4 border-b border-sidebar-border">
          <div className="flex items-center gap-2">
            <AppLogo width="32" height="32" />
            <div className="flex flex-col">
              <h2 className="text-lg font-semibold text-sidebar-foreground">AEC FSP</h2>
              <span className="text-xs text-sidebar-foreground/80">{userRole} Panel</span>
            </div>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {navItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                {item.children ? (
                  <>
                    <SidebarMenuButton
                      onClick={() => toggleMenu(item.href)}
                      className="justify-between"
                      isActive={item.children.some(child => pathname.startsWith(child.href))}
                      tooltip={item.tooltip}
                    >
                      <div className="flex items-center gap-2">
                        <item.icon />
                        <span>{item.label}</span>
                      </div>
                      <ChevronDown className={cn("h-4 w-4 transition-transform", openMenus[item.href] && "rotate-180")} />
                    </SidebarMenuButton>
                    {openMenus[item.href] && (
                      <SidebarMenuSub>
                        {item.children.map((child) => (
                          <SidebarMenuSubItem key={child.href}>
                            <SidebarMenuSubButton
                              asChild
                              isActive={pathname.startsWith(child.href)}
                            >
                              <Link href={child.href}>
                                <child.icon />
                                <span>{child.label}</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    )}
                  </>
                ) : (
                  <SidebarMenuButton asChild isActive={pathname.startsWith(item.href)} tooltip={item.tooltip}>
                    <Link href={item.href}>
                      <item.icon />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                )}
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter className="p-4 border-t border-sidebar-border">
           <SidebarMenu>
             <SidebarMenuItem>
                <SidebarMenuButton onClick={handleLogout}>
                    <LogOut />
                    <span>Logout</span>
                </SidebarMenuButton>
             </SidebarMenuItem>
           </SidebarMenu>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset>
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b bg-background/80 px-4 backdrop-blur-md sm:px-6">
          {/* Left section of the header */}
          <div className="flex items-center gap-2">
            <SidebarTrigger className="md:hidden" /> {/* Mobile sidebar toggle */}
          </div>

          {/* Right section of the header */}
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="rounded-full" aria-label="Notifications">
              <Bell className="h-5 w-5" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={`https://placehold.co/100x100.png?text=${userName.charAt(0)}`} alt={userName} data-ai-hint="user avatar"/>
                    <AvatarFallback>{userName.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{userName}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {userEmail}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href={`/${profileLinkPath}/profile`}>
                    <UserCircle className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem> 
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:bg-destructive/10 focus:text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6 md:p-8">
            {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
