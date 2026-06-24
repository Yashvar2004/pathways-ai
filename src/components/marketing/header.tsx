"use client";

import Link from "next/link";
import { Logo } from "@/components/shared/logo";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";
import { LinkButton } from "@/components/ui/link-button";

export function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Logo />

        <nav className="hidden md:flex items-center gap-6">
          <Link href="/pricing" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Pricing
          </Link>
          <Link href="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Sign In
          </Link>
          <LinkButton href="/signup">Get Started Free</LinkButton>
        </nav>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger
            className="md:hidden"
            render={<Button variant="ghost" size="icon"><Menu className="h-5 w-5" /></Button>}
          />
          <SheetContent side="right">
            <nav className="flex flex-col gap-4 mt-8">
              <Link href="/pricing" className="text-lg font-medium" onClick={() => setOpen(false)}>Pricing</Link>
              <Link href="/login" className="text-lg font-medium" onClick={() => setOpen(false)}>Sign In</Link>
              <LinkButton className="w-full" href="/signup" onClick={() => setOpen(false)}>Get Started Free</LinkButton>
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
