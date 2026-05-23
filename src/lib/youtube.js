const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const BASE = "https://www.googleapis.com/youtube/v3";

export async function searchVideos(query, maxResults = 12) {
  if (!YOUTUBE_API_KEY) throw new Error("YOUTUBE_API_KEY not set");

  const params = new URLSearchParams({
    part: "snippet",
    q: query,
    type: "video",
    videoEmbeddable: "true",
    relevanceLanguage: "en",
    maxResults: String(maxResults),
    key: YOUTUBE_API_KEY,
  });

  const res = await fetch(`${BASE}/search?${params}`);
  if (!res.ok) throw new Error(`YouTube search failed: ${res.status}`);
  const data = await res.json();

  return (data.items || []).map((item) => ({
    youtubeId: item.id.videoId,
    title: item.snippet.title,
    description: item.snippet.description,
    thumbnailUrl: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url,
    channelTitle: item.snippet.channelTitle,
  }));
}
