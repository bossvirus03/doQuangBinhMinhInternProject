import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {jwtDecode} from "jwt-decode";

export type Role = "ADMIN" | "TEACHER" | "USER";
type JwtPayload = { sub: number; email: string; role: Role; iat: number; exp: number };
type User = { id: number; email: string; role: Role };

type AuthCtx = {
  user: User | null;
  signInFromResponse: (res: { access_token: string; user: User }) => void;
  signOut: () => void;
  hasRole: (...roles: Role[]) => boolean;
};

const Ctx = createContext<AuthCtx>({} as any);
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) return;
    try {
      const payload = jwtDecode<JwtPayload>(token);
      if (payload?.exp * 1000 > Date.now()) {
        setUser({ id: payload.sub, email: payload.email, role: payload.role });
      } else {
        localStorage.removeItem("access_token");
      }
    } catch {
      localStorage.removeItem("access_token");
    }
  }, []);

  const signInFromResponse = (res: { access_token: string; user: User }) => {
    localStorage.setItem("access_token", res.access_token);
    setUser(res.user); // hoặc decode từ token, tùy bạn
  };

  const signOut = () => {
    localStorage.removeItem("access_token");
    setUser(null);
  };

  const hasRole = (...roles: Role[]) => {
    if (!user) return false;
    return roles.includes(user.role);
  };

  const value = useMemo(() => ({ user, signInFromResponse, signOut, hasRole }), [user]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
