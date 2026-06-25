import { SearchInput } from "@/components/search/search-input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { getAuth } from "@/lib/auth-helpers";
import { getRecentSearches } from "@/features/search/queries";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { LinkButton } from "@/components/ui/link-button";

export const metadata = {
  title: "Search",
};

export default async function SearchPage() {
  const { userId } = await getAuth();
  const recentSearches = userId
    ? await getRecentSearches(userId)
    : [];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Research</h1>
        <p className="text-muted-foreground mt-1">
          Search any tech stack or job profile to get curated resources and courses.
        </p>
      </div>

      <SearchInput />

      {recentSearches.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3">Your Recent Searches</h2>
          <div className="grid gap-2">
            {(recentSearches as any[]).map((topic: any) => (
              <Card key={topic.id} className="hover:border-primary/30 transition-colors">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium capitalize">{topic.query}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(topic.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <LinkButton variant="ghost" size="sm" href={`/dashboard/search/${topic.id}`}>
                      View <ArrowRight className="ml-1 h-3 w-3" />
                    </LinkButton>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {recentSearches.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <p className="text-muted-foreground">
              Search for a topic like "blockchain", "React developer", or "machine learning" to get started.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
