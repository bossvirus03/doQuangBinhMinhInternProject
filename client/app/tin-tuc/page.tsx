"use client";

import { useEffect, useMemo, useState } from "react";
import Breadcrumbs from "@/components/Breadcrumbs";
import ElectronicGovernment from "@/components/ElectronicGovernment";
import NewsCard from "@/components/NewsCard";

const API_BASE = "http://localhost:3000"; 

export default function TinTuc() {
  const pageSize = 6;
  const [page, setPage] = useState(1);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const url = `${API_BASE}/news?published=true`;
        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok) throw new Error(`Fetch failed ${res.status}: ${await res.text()}`);

        const data = await res.json();
        const normalized = (Array.isArray(data) ? data : []).map((n) => ({
          id: n.id,
          title: n.title,
          slug: n.slug,
          createdAt: n.createdAt,
          excerpt: (n.excerpt ?? n.content ?? "").slice(0, 120) + "...",
          thumbnail: n.thumbnail,
        }));
        if (!cancelled) setItems(normalized);
      } catch (e) {
        console.error("NEWS LIST ERROR:", e);
        if (!cancelled) setItems([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const total = items.length;
  const totalPages = Math.ceil(total / pageSize);

  const pageItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, page]);

  return (
    <>
      <Breadcrumbs trail={[{ name: "Trang chủ", href: "/" }, { name: "Tin tức" }]} />
      <div className="container-narrow mt-6 grid md:grid-cols-[2fr,1fr] gap-6">
        <section className="space-y-4">
          {loading ? (
            <div className="p-6 text-gray-500">Đang tải...</div>
          ) : (
            pageItems.map((n) => (
              <NewsCard
                key={n.id}
                item={{
                  id: String(n.id),
                  title: n.title,
                  slug: n.slug, 
                  date: new Date(n.createdAt).toISOString().slice(0, 10),
                  excerpt: n.excerpt,
                  thumbnail: n.thumbnail,
                  createdAt: n.createdAt,
                }}
              />
            ))
          )}

          {!loading && totalPages > 1 && (
            <div className="pt-2 flex items-center justify-center gap-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={[
                    "h-9 min-w-9 rounded border text-sm px-3 transition",
                    p === page
                      ? "bg-blue-600 border-blue-600 text-white"
                      : "bg-white hover:bg-gray-50",
                  ].join(" ")}
                  aria-current={p === page ? "page" : undefined}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </section>

        <aside className="bg-white rounded-xl p-5 border shadow-sm">
          <ElectronicGovernment />
        </aside>
      </div>
    </>
  );
}
