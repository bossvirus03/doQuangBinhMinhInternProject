"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { siteNav } from "@/lib/data";

type AuthedUser = {
  name?: string;
  email?: string;
  avatar?: string | null;
};

type MeResp = {
  id: number;
  name: string;
  email: string;
  role: string;
  avatarUrl?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

const USER_KEY = "user";
const TOKEN_KEY = "token";

const getToken = () =>
  typeof window === "undefined" ? null : localStorage.getItem(TOKEN_KEY);

const getUser = (): AuthedUser | null => {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as AuthedUser) : null;
  } catch {
    return null;
  }
};

// ✅ Phát "storage" event thủ công để các component trong CÙNG TAB cũng nhận được
const saveUser = (u: AuthedUser | null) => {
  if (typeof window === "undefined") return;
  if (u) localStorage.setItem(USER_KEY, JSON.stringify(u));
  else localStorage.removeItem(USER_KEY);
  // phát sự kiện cho cùng tab
  window.dispatchEvent(new StorageEvent("storage", { key: USER_KEY }));
};

const clearAuth = () => {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  window.dispatchEvent(new StorageEvent("storage", { key: USER_KEY }));
};

export default function Header() {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<AuthedUser | null>(null);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const navItems = useMemo(() => siteNav, []);

  // 1) mount -> đọc localStorage
  useEffect(() => {
    setMounted(true);
    setUser(getUser());
  }, []);

  // 2) khi điều hướng route -> sync lại localStorage (fix case login -> redirect)
  useEffect(() => {
    if (!mounted) return;
    setUser(getUser());
  }, [mounted, pathname]);

  // 3) nếu có token, luôn fetch /users/me để đảm bảo avatar/email mới nhất
  useEffect(() => {
    const token = getToken();
    if (!token) return;

    (async () => {
      try {
        const res = await fetch(`${API_BASE}/users/me`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });
        if (!res.ok) throw new Error(String(res.status));
        const me: MeResp = await res.json();
        const u: AuthedUser = {
          name: me.name,
          email: me.email,
          avatar: me.avatarUrl ?? null,
        };
        saveUser(u);     // ✅ lưu + phát sự kiện
        setUser(u);
      } catch {
        clearAuth();
        setUser(null);
      }
    })();
  }, [API_BASE]);

  // 4) sync giữa các tab + nhận sự kiện saveUser/clearAuth trong cùng tab
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === USER_KEY || e.key === TOKEN_KEY) {
        setUser(getUser());
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const getAvatar = () =>
    user?.avatar && user.avatar.trim() !== ""
      ? user.avatar!
      : "/avatar-default.png"; // đặt file này trong /public

  const logout = () => {
    clearAuth();
    setUser(null);
    setOpen(false);
    router.replace("/login");
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
      <div className="container-narrow flex items-center h-[var(--header-height)] gap-4">
        <Link href="/" className="flex items-center gap-3">
          <div className="leading-tight">
            <div className="font-bold text-primary text-lg">
              Trường TH&THCS Thái Nguyên
            </div>
            <div className="text-xs text-gray-500">Cổng thông tin điện tử</div>
          </div>
        </Link>

        <button
          className="ml-auto md:hidden border px-3 py-2 rounded-lg"
          onClick={() => setOpen((o) => !o)}
          aria-label="Toggle menu"
        >
          ☰
        </button>

        <nav className="hidden md:flex ml-auto items-center gap-1">
          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={[
                  "relative group inline-flex items-center px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "text-primary"
                    : "text-gray-700 hover:text-primary",
                  "after:absolute after:left-1/2 after:-translate-x-1/2 after:bottom-0 after:h-0.5 after:bg-primary after:rounded-full after:transition-all after:duration-300 after:ease-out",
                  active ? "after:w-[85%]" : "after:w-0 group-hover:after:w-[85%]",
                ].join(" ")}
              >
                {item.label}
              </Link>
            );
          })}

          {mounted && (
            <>
              {!user ? (
                <Link
                  href="/auth/login"
                  className="ml-2 inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg border hover:bg-gray-50"
                >
                  Đăng nhập
                </Link>
              ) : (
                <div className="ml-2 relative group">
                  <button
                    className="flex items-center gap-2 px-2 py-1 rounded-full border hover:bg-gray-50"
                    aria-haspopup="true"
                    aria-expanded="false"
                  >
                    <Image
                      src={getAvatar()}
                      alt={user.name || user.email || "User"}
                      width={36}
                      height={36}
                      className="rounded-full object-cover"
                      onError={(e) =>
                        ((e.currentTarget as HTMLImageElement).src =
                          "/avatar-default.png")
                      }
                    />
                    <span className="hidden lg:inline text-sm text-gray-700">
                      {user.name || user.email || "Người Dùng"}
                    </span>
                  </button>

                  <div
                    className="invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-all duration-150
                               absolute right-0 mt-2 w-56 bg-white border rounded-xl shadow-lg p-2"
                    role="menu"
                  >
                    <div className="px-3 py-2">
                      <div className="text-sm font-semibold">
                        {user.name || "Người dùng"}
                      </div>
                      <div className="text-xs text-gray-500 truncate">
                        {user.email}
                      </div>
                    </div>
                    <div className="my-1 h-px bg-gray-100" />
                    <Link
                      href="/profile"
                      className="block px-3 py-2 rounded-lg text-sm hover:bg-gray-50"
                      role="menuitem"
                    >
                      Thông tin
                    </Link>
                    <button
                      onClick={logout}
                      className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-gray-50 text-red-600"
                      role="menuitem"
                    >
                      Đăng xuất
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </nav>
      </div>

      {open && (
        <nav className="md:hidden border-t">
          <div className="container-narrow py-2 flex flex-col gap-1">
            {mounted && user ? (
              <div className="flex items-center gap-3 px-2 py-3">
                <Image
                  src={getAvatar()}
                  alt={user.name || "User"}
                  width={40}
                  height={40}
                  className="rounded-full object-cover"
                />
                <div className="min-w-0">
                  <div className="text-sm font-semibold truncate">
                    {user.name || "Người dùng"}
                  </div>
                  <div className="text-xs text-gray-500 truncate">
                    {user.email}
                  </div>
                </div>
              </div>
            ) : (
              <Link
                href="/auth/login"
                onClick={() => setOpen(false)}
                className="px-2 py-3 text-sm font-medium rounded-lg border hover:bg-gray-50 text-center"
              >
                Đăng nhập
              </Link>
            )}

            {navItems.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={[
                    "relative group px-2 py-3 text-sm font-medium transition-colors",
                    active
                      ? "text-primary"
                      : "text-gray-700 hover:text-primary",
                    "after:absolute after:left-0 after:bottom-0 after:h-0.5 after:bg-primary after:transition-all after:duration-300",
                    active ? "after:w-full" : "after:w-0 group-hover:after:w-full",
                  ].join(" ")}
                >
                  {item.label}
                </Link>
              );
            })}

            {mounted && user && (
              <>
                <div className="my-1 h-px bg-gray-100" />
                <Link
                  href="/profile"
                  onClick={() => setOpen(false)}
                  className="px-2 py-3 text-sm rounded-lg hover:bg-gray-50"
                >
                  Thông tin
                </Link>
                <button
                  onClick={logout}
                  className="px-2 py-3 text-sm rounded-lg hover:bg-gray-50 text-left text-red-600"
                >
                  Đăng xuất
                </button>
              </>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}
