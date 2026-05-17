/*
 * Route preload factories used by the lazy() loader in App.tsx AND by
 * hover/focus prefetch on nav links in Header.tsx. By centralizing the
 * dynamic import here we guarantee both sides reference the same chunk
 * — the prefetched module is the one rendered after click.
 */

export const preload = {
  auth: () => import("@/pages/AuthPage"),
  profile: () => import("@/pages/ProfilePage"),
  applications: () => import("@/pages/ApplicationsPage"),
  saved: () => import("@/pages/SavedPage"),
  pricing: () => import("@/pages/PricingPage"),
  employer: () => import("@/pages/EmployerPage"),
  legal: () => import("@/pages/LegalPage"),
  notFound: () => import("@/pages/NotFound"),
} as const;

export type RouteKey = keyof typeof preload;
