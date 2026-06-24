import { auth, currentUser } from "@clerk/nextjs/server";
import { getUserUsage } from "@/features/billing/queries";
import { SubscriptionStatus } from "@/components/billing/subscription-status";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { SignOutButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Settings",
};

export default async function SettingsPage() {
  const { userId } = await auth();
  if (!userId) return null;

  const user = await currentUser();
  const usage = await getUserUsage(userId);

  const userName = user?.fullName || user?.firstName || "User";
  const userEmail = user?.emailAddresses[0]?.emailAddress || "";
  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase() || "U";

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your account and subscription
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Your account information</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            {user?.imageUrl ? (
              <AvatarImage src={user.imageUrl} alt={userName} />
            ) : null}
            <AvatarFallback className="text-lg bg-primary/10 text-primary">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-lg font-semibold">{userName}</p>
            <p className="text-sm text-muted-foreground">{userEmail}</p>
          </div>
        </CardContent>
      </Card>

      <SubscriptionStatus usage={usage} />

      <Separator />

      <SignOutButton>
        <Button variant="destructive" type="button">
          Sign Out
        </Button>
      </SignOutButton>
    </div>
  );
}
