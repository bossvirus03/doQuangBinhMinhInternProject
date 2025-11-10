export type AuthedUser = {
  name?: string;
  email?: string;
  avatar?: string | null;
};

const USER_KEY = "user";
const TOKEN_KEY = "token";

export function saveToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function saveUser(u: AuthedUser | null) {
  if (u) localStorage.setItem(USER_KEY, JSON.stringify(u));
  else localStorage.removeItem(USER_KEY);
  // phát sự kiện để Header (cùng tab) cập nhật ngay
  window.dispatchEvent(new StorageEvent("storage", { key: USER_KEY }));
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  window.dispatchEvent(new StorageEvent("storage", { key: USER_KEY }));
}
