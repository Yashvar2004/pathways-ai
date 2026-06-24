import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, GraduationCap, Award, Video, BarChart3, Shield } from "lucide-react";

const features = [
  {
    title: "Tech Stack Research",
    description: "Search any tech stack or job profile and get 15 curated high-quality resources including articles, docs, and tools.",
    icon: Search,
  },
  {
    title: "AI-Generated Video Courses",
    description: "Learn with AI-powered video explanations. Complete modules at your own pace with interactive content.",
    icon: Video,
  },
  {
    title: "Free Certifications",
    description: "Earn your first certification for free. Pass the assessment with 70% or higher to claim your credential.",
    icon: Award,
  },
  {
    title: "Progress Tracking",
    description: "Track your course progress, completed modules, and earned certifications all in one dashboard.",
    icon: BarChart3,
  },
  {
    title: "Curated Learning Paths",
    description: "Access 5 free courses per topic, handpicked from top platforms like Coursera, Udemy, and Pathways AI.",
    icon: GraduationCap,
  },
  {
    title: "Subscription Flexibility",
    description: "Free tier with generous limits. Upgrade to Pro for unlimited research, courses, and certifications.",
    icon: Shield,
  },
];

export function FeaturesSection() {
  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight">
            Everything You Need to Upskill
          </h2>
          <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">
            From research to certification, Pathways AI provides all the tools you need to advance your career.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => (
            <Card key={feature.title} className="border border-border/50 hover:border-primary/30 transition-colors">
              <CardHeader>
                <div className="bg-primary/10 w-12 h-12 rounded-lg flex items-center justify-center mb-3">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-lg">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
