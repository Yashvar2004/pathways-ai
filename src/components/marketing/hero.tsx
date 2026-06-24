import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Search, BookOpen, Award, ArrowRight } from "lucide-react";
import { LinkButton } from "@/components/ui/link-button";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-primary/5 to-background">
      <div className="container mx-auto px-4 py-24 md:py-32">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary rounded-full px-4 py-1.5 text-sm font-medium">
            <SparklesIcon />
            AI-Powered Learning Platform
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground">
            Master Any Tech Stack with{" "}
            <span className="text-primary">Pathways AI</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Research job profiles, access curated learning resources, take AI-powered courses, and earn certifications — all in one platform.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <LinkButton size="lg" className="text-lg px-8" href="/signup">
                Start Learning Free <ArrowRight className="ml-2 h-5 w-5" />
              </LinkButton>
            <LinkButton variant="outline" size="lg" className="text-lg px-8" href="/pricing">View Plans</LinkButton>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8">
            <div className="flex items-center gap-3 text-left">
              <div className="bg-primary/10 p-3 rounded-lg">
                <Search className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="font-semibold">Smart Research</p>
                <p className="text-sm text-muted-foreground">15 free resources per topic</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-left">
              <div className="bg-primary/10 p-3 rounded-lg">
                <BookOpen className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="font-semibold">AI Courses</p>
                <p className="text-sm text-muted-foreground">5 free courses with video lessons</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-left">
              <div className="bg-primary/10 p-3 rounded-lg">
                <Award className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="font-semibold">Free Certification</p>
                <p className="text-sm text-muted-foreground">First certification at no cost</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function SparklesIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2l2.4 7.2h7.6l-6 4.8 2.4 7.2-6-4.8-6 4.8 2.4-7.2-6-4.8h7.6z" />
    </svg>
  );
}
