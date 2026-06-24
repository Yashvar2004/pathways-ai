"use client";

interface ResearchContentProps {
  content: string;
}

export function ResearchContent({ content }: ResearchContentProps) {
  const html = content
    // Headers
    .replace(/^### (.+)$/gm, '<h3 class="text-lg font-bold mt-5 mb-2">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-xl font-bold mt-6 mb-3">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-2xl font-bold mt-8 mb-4">$1</h1>')
    // Bold and italic
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    // Links
    .replace(
      /\[(.+?)\]\((.+?)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-primary hover:underline">$1</a>'
    )
    // Inline code
    .replace(
      /`(.+?)`/g,
      '<code class="bg-muted px-1.5 py-0.5 rounded text-sm">$1</code>'
    )
    // Unordered lists
    .replace(/^- (.+)$/gm, '<li class="ml-4">$1</li>')
    // Ordered lists
    .replace(/^\d+\. (.+)$/gm, '<li class="ml-4 list-decimal">$1</li>')
    // Horizontal rules
    .replace(/^---$/gm, '<hr class="my-4 border-border" />')
    // Paragraphs (double newline)
    .replace(/\n\n/g, '</p><p class="mb-3">')
    // Single newlines to <br>
    .replace(/\n/g, "<br/>");

  return (
    <div
      className="prose prose-sm max-w-none dark:prose-invert max-h-[600px] overflow-y-auto"
      dangerouslySetInnerHTML={{
        __html: `<p class="mb-3">${html}</p>`,
      }}
    />
  );
}
