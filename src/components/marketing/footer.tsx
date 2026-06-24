import { Logo } from "@/components/shared/logo";

export function Footer() {
  return (
    <footer className="border-t bg-secondary/30">
      <div className="container mx-auto px-4 py-12">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <Logo />
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Pathways AI. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
