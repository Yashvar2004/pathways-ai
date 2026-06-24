"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Loader2 } from "lucide-react";
import { searchTopic } from "@/features/search/actions";
import { toast } from "sonner";

export function SearchInput() {
  const [query, setQuery] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;

    startTransition(async () => {
      const result = await searchTopic(query.trim());
      if ("error" in result) {
        toast.error("Free search limit reached. Upgrade to Pro for unlimited searches.");
        router.push("/pricing");
      } else {
        router.push(`/dashboard/search/${result.topicId}`);
      }
    });
  }

  return (
    <form onSubmit={handleSearch} className="flex gap-2">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search tech stacks or job profiles (e.g., blockchain, React developer, machine learning)..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-10 h-12 text-base"
          disabled={isPending}
        />
      </div>
      <Button type="submit" size="lg" disabled={isPending || !query.trim()}>
        {isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Searching...
          </>
        ) : (
          "Search"
        )}
      </Button>
    </form>
  );
}
