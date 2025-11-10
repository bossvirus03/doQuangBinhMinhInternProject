"use client";

import { useEffect, useMemo, useState } from "react";
import Section from "@/components/Section";
import NewsCard from "@/components/NewsCard";
import FeaturedSection from "@/components/FeaturedSection";
import Link from "next/link";
import { News } from "@/lib/data";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";


export default function HomePage() {
  const [news, setNews] = useState<News[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setErr(null);
        const res = await fetch(`${API}/news?published=true`, {
          // Nếu cần SSR revalidate, chuyển sang fetch server-side. Ở client thì thêm no-store để luôn lấy mới.
          cache: "no-store",
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        // map BE -> FE
        const mapped: News[] = (data ?? []).map((n: any) => ({
          id: n.id,
          title: n.title,
          slug: n.slug,
          createdAt: n.createdAt,
          excerpt: ((n.excerpt ?? n.content) ?? "").slice(0, 120) + "...",
          thumbnail: n.thumbnail,
        }));
        setNews(mapped);
      } catch (e: any) {
        setErr(e?.message ?? "Lỗi không xác định");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const featured = useMemo(() => news.slice(0, 6), [news]);

  const fmtDate = (iso?: string) => {
    if (!iso) return "";
    // hiển thị dd/MM/yyyy
    const d = new Date(iso);
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  };

  if (loading) {
    return (
      <div className="mx-auto container-narrow max-w-7xl px-4 mt-10">
        <div className="rounded-xl border bg-white p-6">Đang tải tin tức...</div>
      </div>
    );
  }

  if (err) {
    return (
      <div className="mx-auto container-narrow max-w-7xl px-4 mt-10">
        <div className="rounded-xl border bg-white p-6 text-red-600">
          Không tải được tin tức: {err}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="mx-auto container-narrow max-w-7xl px-4 grid grid-cols-1 lg:grid-cols-4 gap-6 mt-10">
        <div className="lg:col-span-3 space-y-6">
          {/* Nổi bật */}
          <FeaturedSection items={news} />

          {/* Tin tức - Sự kiện + Thông báo */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-xl border bg-white">
              <div className="px-5 py-3 font-semibold text-gray-700">
                Tin tức - Sự kiện
              </div>
              <div className="px-5 pb-5 space-y-4">
                {news.slice(0, 3).map((n) => (
                  <NewsCard key={n.id} item={n} />
                ))}
                <div className="text-right">
                  <Link href={`/tin-tuc`} className="text-sm text-blue-600 hover:underline">
                    Xem thêm »
                  </Link>
                </div>
              </div>
            </div>

            <div className="rounded-xl border bg-white">
              <div className="px-5 py-3 font-semibold text-gray-700">Thông báo</div>
              <div className="px-5 pb-5 space-y-4">
                <div className="rounded-lg border overflow-hidden">
                  <div className="bg-red-500 text-white text-center py-10 text-2xl font-bold">
                    .PDF
                  </div>
                  <div className="p-4">
                    <div className="font-medium">
                      Quy định phổ biến của CBGV, học sinh và khách đến trường
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      Các quy định chung áp dụng cho CBNV, học sinh khi đến làm việc, học tập tại trường THCS/THPT…
                    </p>
                    <div className="mt-3 flex items-center gap-3">
                      <a href="#" className="text-sm px-3 py-1 rounded border hover:bg-gray-50">
                        Xem chi tiết
                      </a>
                      <a href="#" className="text-sm px-3 py-1 rounded border hover:bg-gray-50">
                        Tải về
                      </a>
                    </div>
                  </div>
                </div>

                {news.slice(3, 5).map((n) => (
                  <div key={n.id} className="border-t pt-3">
                    <div className="text-xs text-gray-500">{fmtDate(n.createdAt)}</div>
                    <div className="font-medium line-clamp-2">{n.title}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Hoạt động chuyên môn / Đoàn - Đội */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-xl border bg-white">
              <div className="px-5 py-3 font-semibold text-gray-700">Hoạt động chuyên môn</div>
              <div className="px-5 pb-5 space-y-4">
                {news.slice(0, 2).map((n) => (
                  <NewsCard key={n.id} item={n} />
                ))}
              </div>
            </div>

            <div className="rounded-xl border bg-white">
              <div className="px-5 py-3 font-semibold text-gray-700">Hoạt động Đoàn - Đội</div>
              <div className="px-5 pb-5 space-y-4">
                {news.slice(2, 4).map((n) => (
                  <NewsCard key={n.id} item={n} />
                ))}
              </div>
            </div>
          </div>

          {/* Ngoài giờ & Văn bản của trường */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-xl border bg-white">
              <div className="px-5 py-3 font-semibold text-gray-700">Hoạt động ngoài giờ lên lớp</div>
              <div className="px-5 pb-5">
                <div className="rounded-lg overflow-hidden border">
                  <img
                    src={featured[5]?.thumbnail || "/placeholder.svg"}
                    alt="album"
                    className="h-56 w-full object-cover"
                  />
                </div>
              </div>
            </div>

            <div className="rounded-xl border bg-white">
              <div className="px-5 py-3 font-semibold text-gray-700">Văn bản của trường</div>
              <div className="px-5 pb-5 space-y-3">
                {news.slice(0, 4).map((n) => (
                  <div key={n.id} className="border-b pb-3">
                    <div className="text-sm font-medium line-clamp-2">{n.title}</div>
                    <div className="text-xs text-gray-500 mt-1">{fmtDate(n.createdAt)}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <aside className="lg:col-span-1 space-y-6">
          <div className="rounded-xl border bg-white">
            <div className="px-5 py-3 font-semibold text-gray-700">Thế giới số</div>
            {/* <Soical/>  // bật khi component sẵn sàng */}
          </div>

          <div className="rounded-xl border bg-white">
            <div className="px-5 py-3 font-semibold text-gray-700">
              Văn bản các cấp triển khai
            </div>
            <div className="px-5 pb-4 space-y-3 text-sm">
              {news.slice(0, 5).map((n) => (
                <div key={n.id} className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-gray-400" />
                  <Link href={`/tin-tuc/${n.slug}`} className="hover:underline line-clamp-2">
                    {n.title}
                  </Link>
                </div>
              ))}

              <div className="mt-3 flex items-center justify-center gap-2">
                {[1, 2, 3, 4, 5].map((p) => (
                  <button
                    key={p}
                    className={`h-8 w-8 rounded border text-xs ${
                      p === 1 ? "bg-blue-600 text-white border-blue-600" : "bg-white"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-xl border bg-white">
            <div className="px-5 py-3 font-semibold text-gray-700">
              Văn bản Phòng GD&ĐT Thái Thụy
            </div>
            <div className="px-5 pb-5">
              <div className="flex flex-col items-center justify-center border rounded-lg py-10">
                <div className="h-16 w-16 rounded-full border" />
                <div className="mt-3 text-sm text-gray-600">Không có dữ liệu</div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}
