export const MANAGER_ROLES = new Set(["admin", "sst_manager"]);

export const GUEST_ONLY_PATHS = [
  "/",
  "/about",
  "/services",
  "/blog",
  "/careers",
  "/contact",
  "/features",
  "/pricing",
  "/privacy",
  "/security",
  "/terms",
  "/updates",
  "/login",
  "/forgot-password",
] as const;

/**
 * Returns true if the given roles list grants admin or SST manager workspace access.
 */
export function isManagerRole(roles?: readonly string[] | null): boolean {
  if (!Array.isArray(roles)) return false;
  return roles.some((role) => MANAGER_ROLES.has(role));
}

/**
 * Resolves the canonical authenticated home route for a signed-in user.
 * - Admins and SST managers land on the executive HSE dashboard (`/dashboard`).
 * - Employees and other authenticated users land on their incident reporting portal (`/incidents`).
 */
export function getHomeRoute(roles?: readonly string[] | null): "/dashboard" | "/incidents" {
  return isManagerRole(roles) ? "/dashboard" : "/incidents";
}

/**
 * Checks whether a pathname belongs to the guest-only public/marketing or auth surface.
 */
export function isGuestOnlyPath(pathname: string): boolean {
  const normalized = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  return (GUEST_ONLY_PATHS as readonly string[]).includes(normalized);
}
