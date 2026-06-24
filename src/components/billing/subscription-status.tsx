"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { createPortalSession } from "@/features/billing/actions";
import { useState } from "react";
import { ExternalLink, Loader2 } from "lucide-react";
import type { UsageInfo } from "@/types";

interface SubscriptionStatusProps {
  usage: UsageInfo;
}

export function SubscriptionStatus({ usage }: SubscriptionStatusProps) {
  const [loading, setLoading] = useState(false);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Subscription</CardTitle>
        <CardDescription>Your current plan and usage</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold text-lg">
              {usage.isSubscribed ? "Pro Plan" : "Free Plan"}
            </p>
            <Badge variant={usage.isSubscribed ? "default" : "secondary"}>
              {usage.isSubscribed ? "Active" : "Free Tier"}
            </Badge>
          </div>
          {usage.isSubscribed && (
            <form
              action={async () => {
                setLoading(true);
                await createPortalSession();
              }}
            >
              <Button variant="outline" disabled={loading}>
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <ExternalLink className="mr-2 h-4 w-4" />
                )}
                Manage Billing
              </Button>
            </form>
          )}
        </div>

        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Searches this month</span>
            <span>
              {usage.searchCount}
              {usage.searchLimit === Infinity ? "" : ` / ${usage.searchLimit}`}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Certifications claimed</span>
            <span>
              {usage.certificationCount}
              {usage.certificationLimit === Infinity
                ? ""
                : ` / ${usage.certificationLimit}`}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
