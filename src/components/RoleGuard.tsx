import { useEffect, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface RoleGuardProps {
  children: ReactNode;
  /** Allow only these roles (others get redirected) */
  allowRoles?: string[];
  /** Block these roles outright (others pass) */
  blockRoles?: string[];
  /** Where to redirect on block. Default: "/" */
  redirectTo?: string;
}

/**
 * Lightweight client-side role gate. Auth/role checks remain enforced in
 * RLS — this component simply prevents UI flashing for users on the wrong
 * surface (e.g. CHWs landing on the clinician dashboard).
 */
export const RoleGuard = ({
  children,
  allowRoles,
  blockRoles,
  redirectTo,
}: RoleGuardProps) => {
  const { user, userRole, loading, rolesLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading || rolesLoading) return;
    if (!user) return; // unauth handled by individual pages
    if (allowRoles && !allowRoles.includes(userRole as string)) {
      navigate(redirectTo ?? "/");
      return;
    }
    if (blockRoles && blockRoles.includes(userRole as string)) {
      navigate(redirectTo ?? "/chw");
    }
  }, [user, userRole, loading, rolesLoading, allowRoles, blockRoles, navigate, redirectTo]);

  return <>{children}</>;
};
