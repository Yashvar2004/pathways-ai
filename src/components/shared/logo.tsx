import Link from "next/link";
import { GraduationCap } from "lucide-react";

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2 font-bold text-xl">
      <GraduationCap className="h-7 w-7 text-primary" />
      <span className="text-foreground">Pathways AI</span>
    </Link>
  );
}
