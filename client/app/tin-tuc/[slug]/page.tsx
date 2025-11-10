import { notFound } from "next/navigation";
import Breadcrumbs from "@/components/Breadcrumbs";
import Image from "next/image";

const API_BASE = "http://localhost:3000"; 

async function getNewsBySlug(slug) {
  const tryFetch = async (url) => {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return null;
    return res.json();
  };

  let item = await tryFetch(`${API_BASE}/news/by-slug/${encodeURIComponent(slug)}`);
  if (item) return item;

  item = await tryFetch(`${API_BASE}/news/${encodeURIComponent(slug)}`);
  return item;
}

export default async function NewsDetail({ params }) {
  const item = await getNewsBySlug(params.slug);
  if (!item) return notFound();

  return (
    <>
      <Breadcrumbs
        trail={[
          { name: "Trang chủ", href: "/" },
          { name: "Tin tức", href: "/tin-tuc" },
          { name: item.title },
        ]}
      />
      <div className="container-narrow mt-6">
        <article className="bg-white rounded-xl p-5 border shadow-sm">
          <h1 className="text-2xl font-semibold text-primary">{item.title}</h1>
          <div className="text-xs text-gray-400 mt-1">
            {item.createdAt ? new Date(item.createdAt).toLocaleDateString("vi-VN") : ""}
          </div>

          {item.thumbnail && (
            <Image
              src={item.thumbnail}
              alt={item.title}
              width={1200}
              height={630}
              sizes="(max-width: 768px) 100vw, 1100px"
              className="mt-4 w-full h-auto rounded-lg object-cover"
            />
          )}

          <div className="prose max-w-none mt-4">
            <p>{item.content}</p>
          </div>
        </article>
      </div>
    </>
  );
}
