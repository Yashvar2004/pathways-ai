import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { LinkButton } from "@/components/ui/link-button";

export function CTASection() {
  return (
    <section className="py-20 bg-primary">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-3xl font-bold tracking-tight text-primary-foreground">
          Ready to Accelerate Your Career?
        </h2>
        <p className="text-primary-foreground/80 mt-4 max-w-xl mx-auto text-lg">
          Join Pathways AI today. Research, learn, and certify — all in one place. Start with free access.
        </p>
        <LinkButton variant="secondary" size="lg" className="mt-8 text-lg px-8" href="/signup">
            Get Started Free <ArrowRight className="ml-2 h-5 w-5" />
          </LinkButton>
      </div>
    </section>
  );
}
