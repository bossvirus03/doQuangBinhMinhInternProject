"use client";

import { useState } from "react";
import Breadcrumbs from "@/components/Breadcrumbs";

export default function LienHe() {
  const [captchaTs, setCaptchaTs] = useState(Date.now());

  const refreshCaptcha = () => setCaptchaTs(Date.now());

  // demo submit
  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // TODO: fetch('/api/contact', { method:'POST', body: new FormData(e.currentTarget) })
    alert("Đã gửi (demo). Hãy nối API thật để xử lý dữ liệu.");
  };

  return (
    <>
      <Breadcrumbs trail={[{ name: "Trang chủ", href: "/" }, { name: "Liên hệ" }]} />

      {/* nền sọc chéo nhạt giống ảnh */}
      <div className=" py-6">
        <div className="container-narrow grid gap-6 md:grid-cols-[2fr,1fr]">
          {/* Cột trái: thông tin liên hệ */}
          <section className="bg-white rounded-xl border shadow-sm">
            <div className="border-b px-4 py-3 font-semibold text-gray-700">
              Thông tin liên hệ
            </div>
            <div className="p-5 text-sm">
              <div className="text-xs text-gray-500 mb-2">Liên hệ trực tiếp:</div>

              <div className="text-2xl md:text-3xl font-bold text-gray-800">
                Trường TH&THCS Thái Nguyên
              </div>

              <div className="mt-4 space-y-1 text-gray-700">
                <div>
                  <span className="font-medium">Địa chỉ:</span>{" "}
                  Thôn Hải My - xã Thái Nguyên - Thái Thụy - Thái Bình
                </div>
                <div>
                  <span className="font-medium">Điện thoại:</span>{" "}
                  022737221688
                </div>
                <div>
                  <span className="font-medium">Email:</span>{" "}
                  thainguyen2@thaithuy.edu.vn
                </div>
              </div>

              <p className="mt-4 text-gray-600">
                Cảm ơn quý khách đã gửi ý kiến. Chúng tôi sẽ phản hồi trong thời
                gian sớm nhất!
              </p>
            </div>
          </section>

          {/* Cột phải: form gửi liên hệ */}
          <form
            onSubmit={onSubmit}
            className="bg-white rounded-xl border shadow-sm p-5 space-y-3"
          >
            <div className="text-gray-700 font-semibold">
              Hoặc gửi liên hệ cho chúng tôi theo mẫu dưới đây:
            </div>

            {/* Họ và tên */}
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">
                Họ và tên <span className="text-red-500">*</span>
              </label>
              <input
                name="fullName"
                required
                className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Địa chỉ */}
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">
                Địa chỉ
              </label>
              <input
                name="address"
                className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Số điện thoại */}
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">
                Số điện thoại <span className="text-red-500">*</span>
              </label>
              <input
                name="phone"
                required
                inputMode="tel"
                className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Email */}
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">
                Thư điện tử <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                name="email"
                required
                className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Nội dung */}
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">
                Nội dung liên hệ <span className="text-red-500">*</span>
              </label>
              <textarea
                name="message"
                required
                className="w-full min-h-[120px] rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Captcha */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Mã bảo mật <span className="text-red-500">( * )</span>
              </label>

              <div className="flex items-center gap-3">
                {/* Nếu bạn dùng endpoint captcha thật (vd. /api/captcha) thì ảnh sẽ hiện; thêm ts để tránh cache */}
                <div className="relative">
                  <img
                    src={`/api/captcha?ts=${captchaTs}`}
                    width={160}
                    height={48}
                    className="h-12 w-40 border object-contain"
                    alt="captcha"
                  />
                </div>
                <button
                  type="button"
                  onClick={refreshCaptcha}
                  title="Làm mới mã"
                  className="inline-flex items-center justify-center h-7 w-7 rounded-full border text-red-500 hover:bg-gray-50"
                >
                  ⟳
                </button>
                <input
                  name="captcha"
                  required
                  placeholder="Nhập mã"
                  className="flex-1 rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="ml-auto block rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Gửi liên hệ
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
