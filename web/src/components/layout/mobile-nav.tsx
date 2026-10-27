"use client";

import { Suspense, useState } from "react";
import { Menu } from "lucide-react";

import { BrandMark } from "@/components/layout/brand-mark";
import { NavLinks } from "@/components/layout/nav-links";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          className="md:hidden"
          aria-label="Abrir menu"
        >
          <Menu />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 gap-0 bg-sidebar p-0">
        <SheetHeader className="h-14 justify-center border-b border-sidebar-border px-4 py-0">
          <SheetTitle asChild>
            <div>
              <BrandMark />
            </div>
          </SheetTitle>
          <SheetDescription className="sr-only">
            Menu principal
          </SheetDescription>
        </SheetHeader>
        <div className="flex flex-1 flex-col overflow-y-auto p-3">
          <Suspense>
            <NavLinks onNavigate={() => setOpen(false)} />
          </Suspense>
        </div>
      </SheetContent>
    </Sheet>
  );
}
