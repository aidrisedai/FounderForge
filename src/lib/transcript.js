import { YoutubeTranscript } from "youtube-transcript";

export async function fetchTranscript(youtubeId) {
  try {
    const chunks = await YoutubeTranscript.fetchTranscript(youtubeId);
    return chunks.map((c) => c.text).join(" ").slice(0, 12000);
  } catch {
    return null;
  }
}
