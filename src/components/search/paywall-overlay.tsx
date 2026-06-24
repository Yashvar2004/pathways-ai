import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Lock, ArrowRight } from "lucide-react";
import { LinkButton } from "@/components/ui/link-button";

interface PaywallOverlayProps {
  type: "search" | "certification";
  remaining: number;
}

export function PaywallOverlay({ type, remaining }: PaywallOverlayProps) {
  return (
    <Card className="border-destructive/30 bg-destructive/5">
      <CardHeader className="text-center">
        <div className="bg-destructive/10 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
          <Lock className="h-6 w-6 text-destructive" />
        </div>
        <CardTitle>
          {type === "search"
            ? "Free Search Limit Reached"
            : "Free Certification Limit Reached"}
        </CardTitle>
        <CardDescription>
          {type === "search"
            ? "You've used all your free searches for this month. Upgrade to Pro for unlimited access."
            : "You've claimed your free certification. Upgrade to Pro for unlimited certifications."}
        </CardDescription>
      </CardHeader>
      <CardContent className="text-center">
        <LinkButton size="lg" href="/pricing">
            Upgrade to Pro <ArrowRight className="ml-2 h-4 w-4" />
          </LinkButton>
      </CardContent>
    </Card>
  );
}
