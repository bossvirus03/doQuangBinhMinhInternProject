import { Navigate } from "react-router-dom";
import { useAuth, Role } from "./AuthContext";

export default function RequireRole({
  roles,
  children,
}: {
  roles: Role[];
  children: JSX.Element;
}) {
  const { hasRole } = useAuth();
  if (!hasRole(...roles)) return <Navigate to="/403" replace />;
  return children;
}
