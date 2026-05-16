/*
 * ATADA — App Root
 * Design: Quiet Modernism — light theme, black/white/grey
 */

import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import ProfilePage from "@/pages/ProfilePage";
import AuthPage from "@/pages/AuthPage";
import ApplicationsPage from "@/pages/ApplicationsPage";
import PricingPage from "@/pages/PricingPage";
import EmployerPage from "@/pages/EmployerPage";
import SavedPage from "@/pages/SavedPage";
import { Route, Switch } from "wouter";
import DemoBanner from "./components/DemoBanner";
import Header from "./components/Header";
import ErrorBoundary from "./components/ErrorBoundary";
import { Onboarding, useOnboarding } from "./components/Onboarding";
import { AuthProvider } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";

function Router() {
  return (
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
