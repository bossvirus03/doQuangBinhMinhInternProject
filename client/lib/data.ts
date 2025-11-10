export type News = {
  id: string;
  title: string;
  slug: string;
  date: string;
  excerpt: string;
  thumbnail?: string;
  createdAt:string;
};

export const siteNav = [
  { label: "Trang chủ", href: "/" },
  { label: "Giới thiệu", href: "/gioi-thieu" },
  { label: "Tin tức", href: "/tin-tuc" },
  { label: "Văn bản", href: "/van-ban" },
  { label: "Chính phủ điện tử", href: "/chinh-phu-dien-tu" },
  { label: "Liên hệ", href: "/lien-he" },
];
