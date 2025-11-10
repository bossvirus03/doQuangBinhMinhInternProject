import Link from "next/link";
import Image from "next/image";
import { News } from "@/lib/data";

export default function NewsCard({ item }: { item: News }) {
  return (
    <article className="bg-white rounded-xl border shadow-sm hover:shadow-md transition overflow-hidden">
      <Link href={`/tin-tuc/${item.slug}`} className="flex gap-4 p-4">
        {/* Ảnh bên trái */}
        <div className="relative shrink-0 w-36 h-24 rounded-lg overflow-hidden border bg-gray-100">
          <Image
            src={item.thumbnail || "/placeholder.svg"}
            alt={item.title}
            fill
            sizes="144px"
            className="object-cover"
          />
        </div>

        {/* Nội dung bên phải */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold leading-snug line-clamp-2 hover:text-primary">
            {item.title}
          </h3>
          <div className="text-xs text-gray-400 mt-1">
            {new Date(item.date).toLocaleDateString("vi-VN")}
          </div>
          <p className="text-sm text-gray-600 mt-2 line-clamp-2">
            {item.excerpt}
          </p>
        </div>
      </Link>
    </article>
  );
}
