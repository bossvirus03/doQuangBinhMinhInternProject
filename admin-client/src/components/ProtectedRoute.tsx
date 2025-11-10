import { Navigate, Outlet, useLocation } from "react-router-dom";

type Role = "ADMIN" | "TEACHER" | "USER";

function getUser() {
  try {
    return JSON.parse(localStorage.getItem("user") || "null") as
      | { id: number; email: string; role: Role }
      | null;
  } catch {
    return null;
  }
}

export function ProtectedRoute({ roles }: { roles?: Role[] }) {
  const token = localStorage.getItem("access_token");
  const user = getUser();
  const loc = useLocation();

  if (!token || !user) {
    return <Navigate to="/login" replace state={{ from: loc }} />;
  }
  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }
  return <Outlet />; 
}
