"use client";

import { useMemo, useState } from "react";
import Breadcrumbs from "@/components/Breadcrumbs";
import ElectronicGovernment from "@/components/ElectronicGovernment";

type DocFile = { label?: string; url: string };
type Doc = {
  id: number;
  title: string;
  receiver?: string;
  code?: string;
  issuedAt?: string; // yyyy-mm-dd
  files?: DocFile[];
};

// Gợi ý: với file nội bộ, đặt vào /public/docs/... rồi dùng url "/docs/tenfile.pdf"
const docs: Doc[] = [
  { id: 1,  title: "Báo cáo thường niên năm học 2024-2025", receiver: "", code: "176/BC-TH&THCS", issuedAt: "2025-08-13", files: [{label:"Download", url:"/docs/bao-cao-thuong-nien-2024-2025.pdf"}] },
  { id: 2,  title: "Công khai dự toán ngân sách năm 2025", receiver: "", code: "89/QĐ-TH&THCS", issuedAt: "2025-03-31", files: [{label:"Download", url:"/docs/du-toan-ns-2025.pdf"}] },
  { id: 3,  title: "Công khai thực hiện dự toán ngân sách 9 tháng đầu năm", receiver: "", code: "110/QĐ-TH&THCS", issuedAt: "2025-10-14", files: [{label:"Download", url:"https://example.com/remote/file-9-thang-2025.pdf"}] },
  { id: 4,  title: "Công khai số liệu thu chi 6 tháng đầu năm học", receiver: "", code: "52/QĐ-TH&THCS", issuedAt: "2025-02-27", files: [{label:"Download", url:"/docs/thu-chi-6-thang.pdf"}] },
  { id: 5,  title: "Công khai theo thông tư 9/2024", receiver: "", code: "217/BC-TH&THCS", issuedAt: "2024-10-10", files: [{label:"Download", url:"/docs/thong-tu-9-2024.pdf"}] },
  { id: 6,  title: "Quyết định về việc công khai tình hình thực hiện dự toán ngân sách nhà nước 9 tháng đầu năm 2024", receiver: "", code: "215/QĐ-TH&THCS", issuedAt: "2024-10-09", files: [{label:"Download", url:"https://example.com/remote/qd-215-2024.pdf"}] },
  { id: 7,  title: "Công khai quyết toán ngân sách năm 2023", receiver: "", issuedAt: "", files: [{label:"Download", url:"/docs/quyet-toan-2023.pdf"}] },
  { id: 8,  title: "Công khai tình hình thực hiện dự toán ngân sách 6 tháng đầu năm 2024", receiver: "", code: "", issuedAt: "", files: [{label:"Biểu 03", url:"/docs/bieu-03.xlsx"}, {label:"Download", url:"/docs/thuc-hien-6-thang-2024.pdf"}] },
  { id: 9,  title: "Công khai theo thông tư 36", receiver: "", issuedAt: "", files: [{label:"Download", url:"/docs/thong-tu-36.pdf"}] },
  { id: 10, title: "Công khai tình hình thực hiện dự toán ngân sách quý I/2024", receiver: "", issuedAt: "", files: [{label:"Download", url:"/docs/thuc-hien-quy1-2024.pdf"}] },
  { id: 11, title: "Công khai dự toán ngân sách năm 2024", receiver: "", issuedAt: "", files: [{label:"Download", url:"/docs/du-toan-ns-2024.pdf"}] },
  { id: 12, title: "Công khai tình hình thực hiện dự toán ngân sách năm 2023", receiver: "", issuedAt: "", files: [{label:"Download", url:"/docs/thuc-hien-2023.pdf"}] },
  { id: 13, title: "Công khai tình hình thực hiện dự toán ngân sách 9 tháng đầu năm 2023", receiver: "", code: "165/QĐ-TH&THCS", issuedAt: "", files: [{label:"Download", url:"/docs/thuc-hien-9-thang-2023.pdf"}] },
  { id: 14, title: "Quyết định về việc công khai tình hình thực hiện dự toán ngân sách quý II/2023", receiver: "", code: "101/QĐ-TH&THCS", issuedAt: "2023-07-05", files: [{label:"Download", url:"/docs/qd-101-2023.pdf"}] },
  { id: 15, title: "Công khai theo thông tư 36 năm 2022", receiver: "", issuedAt: "2023-02-07", files: [{label:"Download", url:"/docs/tt36-2022.pdf"}] },
  { id: 16, title: "Công khai tình hình thực hiện ngân sách 9 tháng đầu năm 2022-2023", receiver: "", issuedAt: "", files: [{label:"Download", url:"/docs/thuc-hien-9-thang-2022-2023.pdf"}] },
];

// xác định đây là URL ngoài domain (http/https) hay nội bộ (/docs/...)
const isExternal = (url: string) => /^https?:\/\//i.test(url);
const getFileName = (url: string) => {
  try {
    const u = new URL(url, typeof window !== "undefined" ? window.location.origin : "http://localhost");
    const last = u.pathname.split("/").filter(Boolean).pop() || "file";
    return decodeURIComponent(last);
  } catch {
    const parts = url.split("/").filter(Boolean);
    return decodeURIComponent(parts.pop() || "file");
  }
};

function DownloadLink({ file }: { file: DocFile }) {
  const label = file.label ?? "Download";
  const filename = getFileName(file.url);

  // Nếu link ngoài → dùng API proxy để ép download
  const href = isExternal(file.url)
    ? `/api/download?src=${encodeURIComponent(file.url)}&filename=${encodeURIComponent(filename)}`
    : file.url;

  // Với file nội bộ, có thể dùng download attr để tải trực tiếp
  const downloadAttr = isExternal(file.url) ? undefined : filename;

  return (
    <a
      href={href}
      download={downloadAttr}
      target="_blank"
      rel="noopener"
      className="text-blue-600 hover:underline"
    >
      {label}
    </a>
  );
}

export default function VanBan() {
  // paging
  const pageSize = 10;
  const [page, setPage] = useState(1);
  const totalPages = Math.ceil(docs.length / pageSize);

  const pageRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return docs.slice(start, start + pageSize);
  }, [page]);

  return (
    <>
      <Breadcrumbs trail={[{ name: "Trang chủ", href: "/" }, { name: "Văn bản" }]} />

      <div className="py-6">
        <div className="container-narrow grid gap-6 md:grid-cols-[3fr,1fr]">
          {/* Bảng Văn bản – Công văn */}
          <section className="bg-white rounded-xl border shadow-sm overflow-hidden">
            <div className="bg-blue-600 text-white font-semibold px-4 py-2 uppercase text-sm">
              Văn bản – Công văn
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 border-b text-gray-700">
                  <tr>
                    <th className="px-3 py-2 text-left w-14">STT</th>
                    <th className="px-3 py-2 text-left min-w-[320px]">Tên văn bản</th>
                    <th className="px-3 py-2 text-left min-w-[140px]">Số hiệu</th>
                    <th className="px-3 py-2 text-left min-w-[140px]">Ngày ban hành</th>
                    <th className="px-3 py-2 text-left min-w-[140px]">File đính kèm</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {pageRows.map((d, idx) => (
                    <tr key={d.id} className="hover:bg-gray-50/60">
                      <td className="px-3 py-2 text-gray-600 text-center">
                        {(page - 1) * pageSize + idx + 1}
                      </td>
                      <td className="px-3 py-2">
                        <div className="text-gray-800">{d.title}</div>
                      </td>

                      <td className="px-3 py-2 text-gray-700">
                        {d.code ? d.code : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-3 py-2 text-gray-700">
                        {d.issuedAt
                          ? new Date(d.issuedAt).toLocaleDateString("vi-VN")
                          : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex flex-wrap gap-x-3 gap-y-1">
                          {(d.files && d.files.length > 0) ? (
                            d.files.map((f, i) => <DownloadLink key={i} file={f} />)
                          ) : (
                            <span className="text-gray-300">Không có file</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Phân trang */}
            <div className="flex items-center justify-center gap-2 p-3 border-t bg-white">
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
          </section>

          {/* Sidebar: Chính phủ điện tử */}
          <aside className="space-y-6">
            <div className="bg-white rounded-xl border shadow-sm">
              <div className="border-b px-4 py-2 font-semibold text-gray-700">
                Chính phủ điện tử
              </div>
              <div className="p-4">
                <ElectronicGovernment />
              </div>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
