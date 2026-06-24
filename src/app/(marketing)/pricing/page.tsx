import { PricingCard } from "@/components/billing/pricing-card";

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "month",
    description: "Get started with free access to research and learning.",
    features: [
      "10 searches per month",
      "15 free resources per search",
      "5 free courses per search",
      "1 free certification",
      "AI-generated video courses",
      "Assessment and quizzes",
      "Progress tracking",
    ],
    popular: false,
  },
  {
    name: "Pro",
    price: "$19",
    period: "month",
    description: "Unlimited access to all features for serious learners.",
    features: [
      "Unlimited searches",
      "Unlimited resources and courses",
      "Unlimited certifications",
      "Priority AI video generation",
      "Advanced assessments",
      "Certificate downloads",
      "Priority support",
    ],
    popular: true,
  },
];

export default function PricingPage() {
  return (
    <div className="container mx-auto px-4 py-20">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold tracking-tight">Simple Pricing</h1>
        <p className="text-muted-foreground mt-4 max-w-lg mx-auto">
          Start free and upgrade when you need more. No hidden fees, cancel anytime.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
        {plans.map((plan) => (
          <PricingCard key={plan.name} {...plan} />
        ))}
      </div>
    </div>
  );
}
