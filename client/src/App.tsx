/*
 * ATADA — App Root
 * Design: Quiet Modernism — light theme, black/white/grey
 */

import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import DemoBanner from "./components/DemoBanner";
import Header from "./components/Header";
import ErrorBoundary from "./components/ErrorBoundary";
import { Onboarding, useOnboarding } from "./components/Onboarding";
import { AuthProvider } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
// Home stays eager — it's the landing route and we want zero TTI cost there.
import Home from "./pages/Home";

// Every secondary route is lazy-loaded so the initial bundle ships only the
// code needed to render the feed. Each page becomes its own chunk that the
// browser fetches on demand; Vercel CDN serves them sub-100ms. The same
// import factories live in route-preload.ts so Header can prefetch on hover.
import { preload } from "@/lib/route-preload";

const AuthPage = lazy(preload.auth);
const ProfilePage = lazy(preload.profile);
const ApplicationsPage = lazy(preload.applications);
const SavedPage = lazy(preload.saved);
const PricingPage = lazy(preload.pricing);
const EmployerPage = lazy(preload.employer);
const NotFound = lazy(preload.notFound);

function RouteFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F7F7F7]">
      <div className="flex items-center gap-2 text-[#808080]" style={{ fontFamily: "'DM Mono', monospace", fontSize: 11 }}>
        <span className="w-1.5 h-1.5 rounded-full bg-[#0A0A0A] animate-pulse" />
        Loading...
      </div>
    </div>
  );
}

function Router() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Switch>
        <Route path={"/"} component={Home} />
        <Route path={"/auth"} component={AuthPage} />
        <Route path={"/profile"} component={ProfilePage} />
        <Route path={"/applications"} component={ApplicationsPage} />
        <Route path={"/saved"} component={SavedPage} />
        <Route path={"/pricing"} component={PricingPage} />
        <Route path={"/employer"} component={EmployerPage} />
        <Route path={"/404"} component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function AppContent() {
  const { showOnboarding, completeOnboarding } = useOnboarding();

  return (
    <>
      {showOnboarding && <Onboarding onComplete={completeOnboarding} />}
      <DemoBanner />
      <Header />
      <Router />
    </>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ThemeProvider defaultTheme="light">
          <TooltipProvider>
            <Toaster
              position="top-right"
              toastOptions={{
                style: {
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: "13px",
                  background: "#0A0A0A",
                  color: "#FFFFFF",
                  border: "none",
                },
              }}
            />
            <AppContent />
          </TooltipProvider>
        </ThemeProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
