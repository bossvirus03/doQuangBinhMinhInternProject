// components/FeaturedSection.tsx
"use client";
import { useMemo, useState } from "react";

type Item = {
  id: string | number;
  title: string;
  date?: string;
  thumbnail?: string;
  excerpt?: string;
};

export default function FeaturedSection({ items }: { items: Item[] }) {
  // 1 trang = 1 bài lớn + 4 bài nhỏ giống ảnh
  const groupSize = 5;
  const pages = Math.max(1, Math.ceil(items.length / groupSize));
  const [page, setPage] = useState(0);

  const { big, small } = useMemo(() => {
    const start = page * groupSize;
    const big = items[start];
    const small = items.slice(start + 1, start + groupSize);
    return { big, small };
  }, [items, page]);

  const goto = (p: number) => setPage((p + pages) % pages);

  return (
    <div className="rounded-xl border bg-white ">
      <div className="px-5 py-3 font-semibold uppercase text-gray-700 flex items-center justify-between">
        <span>Tin nổi bật</span>
      </div>

      <div className="px-5 pb-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Bài lớn bên trái */}
        <div className="md:col-span-2 rounded-lg overflow-hidden border">
          <img
            src={big?.thumbnail || "/placeholder.svg"}
            alt={big?.title || "feature"}
            className="h-64 w-full object-cover"
          />
          <div className="p-3">
            <div className="text-sm text-gray-500">{big?.date || "Ngày đăng"}</div>
            <div className="mt-1 font-semibold">{big?.title || "Tiêu đề bài nổi bật"}</div>
            <p className="text-sm text-gray-600 line-clamp-2 mt-1">
              {big?.excerpt || "Mô tả ngắn cho tin nổi bật…"}
            </p>
          </div>
        </div>

        {/* Danh sách nhỏ bên phải */}
        <div className="space-y-3">
          {small.map((n) => (
            <div key={n.id} className="flex gap-3">
              <img
                src={n.thumbnail || "/placeholder.svg"}
                alt={n.title}
                className="h-16 w-20 rounded object-cover border"
              />
              <div className="min-w-0">
                <div className="text-xs text-gray-500">{n.date}</div>
                <div className="text-sm font-medium line-clamp-2">{n.title}</div>
              </div>
            </div>
          ))}
          {small.length === 0 && (
            <div className="text-sm text-gray-500">Không có thêm bài trong trang này.</div>
          )}
        </div>
      </div>

      {/* Pagination chấm + số trang */}
      <div className="flex items-center justify-center gap-2 pb-4">
        <div className=" items-center gap-2">
          <button onClick={() => goto(page - 1)} className="h-8 w-8 rounded border">‹</button>
        </div>
        
        {Array.from({ length: pages }).map((_, i) => (
          <button
            key={i}
            onClick={() => setPage(i)}
            className={`h-2.5 w-2.5 rounded-full ${i === page ? "bg-blue-600" : "bg-gray-300"}`}
            aria-label={`Trang ${i + 1}`}
            title={`Trang ${i + 1}`}
          />
        ))}
       <div className=" items-center gap-2">
          <button onClick={() => goto(page + 1)} className="h-8 w-8 rounded border">›</button>
        </div>
      </div>
    </div>
  );
}
