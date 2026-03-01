"use client";

import { useRouter } from "next/navigation";
import * as React from "react";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "~/components/ui/command";
import { hasPermission } from "~/lib/auth/permissions";

interface CommandMenuProps {
  isAdmin: boolean;
  dashboardUser?: {
    roles: Array<{
      name: string;
      permissions: Array<{ key: string }>;
    }>;
  };
}

export function CommandMenu({ isAdmin, dashboardUser }: CommandMenuProps) {
  const [open, setOpen] = React.useState(false);
  const router = useRouter();

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (
        e.key === "/" &&
        !["INPUT", "TEXTAREA"].includes((e.target as HTMLElement).tagName)
      ) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const runCommand = React.useCallback((command: () => unknown) => {
    setOpen(false);
    command();
  }, []);

  const menuItems = [
    {
      label: "Dashboard",
      href: "/dashboard",
    },
    {
      label: "Teams",
      href: "/dashboard?tab=teams",
      show: dashboardUser
        ? hasPermission(dashboardUser, "team:view_all")
        : false,
    },
    {
      label: "Payments",
      href: "/dashboard?tab=admin",
      show: isAdmin,
    },
  ];

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup>
          {menuItems
            .filter((item) => item.show !== false)
            .map((item) => (
              <CommandItem
                key={item.href}
                onSelect={() => {
                  runCommand(() => router.push(item.href));
                }}
              >
                <span>{item.label}</span>
              </CommandItem>
            ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
