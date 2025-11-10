"use client";

import React, { useEffect, useState } from "react";

type Me = {
  id: number;
  name: string;
  email: string;
  role: string;
  avatarUrl?: string | null;
  createdAt: string;
  updatedAt: string;
};

export default function Page() {
  const [me, setMe] = useState<Me | null>(null);
  const [form, setForm] = useState({ name: "", avatarUrl: "" });
  const [loading, setLoading] = useState(false);
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

  const fetchMe = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Fetch me failed (${res.status})`);
      const data: Me = await res.json();
      setMe(data);
      setForm({
        name: data?.name ?? "",
        avatarUrl: data?.avatarUrl ?? "",
      });
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchMe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const token = localStorage.getItem("token");
    try {
      const body: Record<string, any> = {};
      if (form.name?.trim() !== "") body.name = form.name.trim();
      // Cho phép rỗng để xóa avatar
      if (form.avatarUrl !== undefined) body.avatarUrl = form.avatarUrl.trim() || null;

      const res = await fetch(`${API_BASE}/users/me`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token ?? ""}`,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(
          Array.isArray(err?.message) ? err.message.join(", ") : err?.message || `Update failed (${res.status})`
        );
      }

      const updated: Me = await res.json();
      setMe(updated);
      setForm({
        name: updated.name ?? "",
        avatarUrl: updated.avatarUrl ?? "",
      });

      // ✅ Lưu lại vào localStorage để Header cập nhật ngay
      const newUser = {
        name: updated.name,
        email: updated.email,
        avatar: updated.avatarUrl ?? null,
      };
      try {
        localStorage.setItem("user", JSON.stringify(newUser));
        // phát sự kiện thủ công cho cùng tab (nếu Header không nghe storage)
        window.dispatchEvent(new StorageEvent("storage", { key: "user" }));
      } catch {}

      alert("Cập nhật thành công");
    } catch (err: any) {
      alert(err.message || "Lỗi cập nhật");
    } finally {
      setLoading(false);
    }
  };

  if (!me) return <div className="p-4">Đang tải thông tin người dùng...</div>;

  const avatarSrc =
    (form.avatarUrl?.trim()
      ? form.avatarUrl.trim()
      : me.avatarUrl) ||
    "https://ui-avatars.com/api/?name=" + encodeURIComponent(me.name || me.email);

  return (
    <div className="max-w-xl mx-auto p-6 bg-white shadow rounded-lg mt-6 space-y-6">
      <h2 className="text-2xl font-bold">Thông tin người dùng</h2>

      <div className="flex items-center gap-4">
        <img
          src={avatarSrc}
          alt="avatar"
          className="w-16 h-16 rounded-full object-cover border"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src =
              "https://ui-avatars.com/api/?name=" + encodeURIComponent(me.name || me.email);
          }}
        />
        <div>
          <div className="text-sm text-gray-500">Role: {me.role}</div>
          <div className="text-sm text-gray-500">
            Tạo: {me.createdAt ? new Date(me.createdAt).toLocaleString() : "—"}
          </div>
        </div>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Họ tên</label>
          <input
            className="w-full border rounded px-3 py-2"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Nhập họ tên"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Avatar URL</label>
          <input
            className="w-full border rounded px-3 py-2"
            value={form.avatarUrl}
            onChange={(e) => setForm({ ...form, avatarUrl: e.target.value })}
            placeholder="https://..."
          />
          <p className="text-xs text-gray-500 mt-1">
            Để trống để dùng avatar mặc định (tên viết tắt).
          </p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-60"
        >
          {loading ? "Đang lưu..." : "Lưu thay đổi"}
        </button>
      </form>
    </div>
  );
}
