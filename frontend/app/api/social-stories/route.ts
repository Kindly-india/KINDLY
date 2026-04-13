import { NextResponse } from "next/server"

function inferCategory(text: string): string {
  const t = text.toLowerCase()
  if (t.includes("environment") || t.includes("clean") || t.includes("river") || t.includes("tree") || t.includes("forest") || t.includes("pollution") || t.includes("plastic") || t.includes("waste")) return "Environment"
  if (t.includes("school") || t.includes("education") || t.includes("student") || t.includes("teach") || t.includes("learn") || t.includes("literacy")) return "Education"
  if (t.includes("health") || t.includes("hospital") || t.includes("doctor") || t.includes("medical") || t.includes("blood") || t.includes("cancer") || t.includes("clinic")) return "Health"
  if (t.includes("elderly") || t.includes("senior") || t.includes("old age") || t.includes("helpage")) return "Elderly Care"
  if (t.includes("animal") || t.includes("dog") || t.includes("cat") || t.includes("wildlife") || t.includes("rescue") || t.includes("stray")) return "Animals"
  return "Community"
}

function relativeDate(pubDate: string): string {
  try {
    const diff = Math.floor((Date.now() - new Date(pubDate).getTime()) / (1000 * 60 * 60 * 24))
    if (diff === 0) return "Today"
    if (diff === 1) return "1 day ago"
    if (diff < 7) return `${diff} days ago`
    if (diff < 14) return "1 week ago"
    return `${Math.floor(diff / 7)} weeks ago`
  } catch {
    return "Recently"
  }
}

function stripHtml(html: string): string {
  // 1. Unescape HTML entities first so tags become recognizable
  let text = html
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");

  // 2. Strip the actual HTML tags
  text = text.replace(/<[^>]*>/g, "");

  // 3. Clean up extra spaces and newlines
  return text.replace(/\s+/g, " ").trim();
}

function extractTag(xml: string, tag: string): string {
  const cdataMatch = xml.match(new RegExp(`<${tag}[^>]*><!\\[CDATA\\[(.*?)\\]\\]><\\/${tag}>`, "s"))
  if (cdataMatch) return cdataMatch[1].trim()
  const plainMatch = xml.match(new RegExp(`<${tag}[^>]*>(.*?)<\\/${tag}>`, "s"))
  if (plainMatch) return plainMatch[1].trim()
  return ""
}

export async function GET() {
  // Try multiple queries so we always get enough results
  const queries = [
    "NGO volunteering India 2026",
    "Maharashtra social Organisations",
    "India environment news",
  ]

  const allStories: any[] = []

  for (const query of queries) {
    if (allStories.length >= 6) break
    try {
      const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-IN&gl=IN&ceid=IN:en`
      const res = await fetch(url, {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; Kindly/1.0)" },
        next: { revalidate: 1800 }, // cache 30 min
      })

      if (!res.ok) continue
      const xml = await res.text()

      const items = xml.match(/<item>([\s\S]*?)<\/item>/g) || []

      for (const item of items) {
        if (allStories.length >= 6) break

        const rawTitle = extractTag(item, "title")
        const description = extractTag(item, "description")
        const link = extractTag(item, "link") || item.match(/<link\/>(.*?)<\/link>/)?.[1]?.trim() || null
        const pubDate = extractTag(item, "pubDate")
        const source = extractTag(item, "source") || rawTitle.split(" - ").pop() || "News"

        // Google News appends "- Source" to title, strip it
        const title = rawTitle.includes(" - ")
          ? rawTitle.split(" - ").slice(0, -1).join(" - ")
          : rawTitle

        if (!title || title.length < 10) continue

        // Skip duplicates
        if (allStories.some((s) => s.title === title)) continue

        const cleanExcerpt = stripHtml(description).slice(0, 180) + "..."
        const excerpt = cleanExcerpt || "Read more about this initiative making a real difference across India."
        const combined = title + " " + excerpt

        allStories.push({
          title,
          excerpt,
          category: inferCategory(combined),
          readTime: `${Math.floor(Math.random() * 3) + 2} min read`,
          date: relativeDate(pubDate),
          author: stripHtml(source).split(",")[0].trim(),
          url: link,
        })
      }
    } catch (err: any) {
      console.error(`RSS fetch failed for "${query}":`, err.message)
    }
  }

  if (allStories.length > 0) {
    return NextResponse.json({ stories: allStories.slice(0, 6) })
  }

  // Last resort fallback — only reached if Google News is unreachable
  console.warn("All RSS fetches failed, returning fallback")
  return NextResponse.json({
    stories: [
      { title: "Unable to load live stories right now", excerpt: "Please check your internet connection and try refreshing.", category: "Community", readTime: "–", date: "–", author: "Kindly", url: null },
    ],
  })
}