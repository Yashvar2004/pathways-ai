const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

export async function searchYouTubeVideo(
  query: string
): Promise<{ videoId: string; title: string } | null> {
  if (!YOUTUBE_API_KEY) {
    console.warn("[YouTube] YOUTUBE_API_KEY not set");
    return null;
  }

  try {
    const searchQuery = encodeURIComponent(`${query} tutorial explanation`);
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${searchQuery}&type=video&maxResults=1&key=${YOUTUBE_API_KEY}`;

    const res = await fetch(url);
    if (!res.ok) return null;

    const data = await res.json();
    if (!data.items || data.items.length === 0) return null;

    return {
      videoId: data.items[0].id.videoId,
      title: data.items[0].snippet.title,
    };
  } catch (err) {
    console.error("[YouTube] Search failed:", err);
    return null;
  }
}
