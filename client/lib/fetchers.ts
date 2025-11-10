export type NewsFE = {
  id: number;
  title: string;
  slug: string;
  date: string;       // ISO (map từ createdAt)
  excerpt: string;    // cắt từ content
  thumbnail?: string;
};

export async function fetchNewsPublished(): Promise<NewsFE[]> {
  const base = process.env.NEXT_PUBLIC_API_URL!;
  const res = await fetch(`${base}/news?published=true`, {
    // data thay đổi theo CMS → no-store; nếu muốn cache 5p dùng next: { revalidate: 300 }
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to fetch news");
  const data = await res.json();

  // Map BE -> FE
  const items: NewsFE[] = (Array.isArray(data) ? data : []).map((n: any) => ({
    id: n.id,
    title: n.title,
    slug: n.slug,
    date: n.createdAt ?? new Date().toISOString(),
    excerpt: (n.content ?? "").replace(/\s+/g, " ").trim().slice(0, 140) + (n?.content?.length > 140 ? "…" : ""),
    thumbnail: n.thumbnail ?? undefined,
  }));
  // Sắp xếp mới nhất trước (nếu BE chưa sort)
  items.sort((a, b) => +new Date(b.date) - +new Date(a.date));
  return items;
}
