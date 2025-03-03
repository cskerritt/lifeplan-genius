import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { auth } from "@/utils/authService";
import DashboardLayout from "./components/Layout/DashboardLayout";
import Index from "./pages/Index";
import Plans from "./pages/Plans";
import PlanDetail from "./pages/PlanDetail";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import CalculationDebugPanel from "./components/CalculationDebugPanel";

// Configure the query client with more aggressive stale times for development
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Shorter stale time to ensure data is refreshed more frequently
      staleTime: 10 * 1000, // 10 seconds
      // Refetch on window focus and mount
      refetchOnWindowFocus: true,
      refetchOnMount: true,
      // Retry failed queries
      retry: 1,
    },
  },
});

function App() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check current session
    auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route
              path="/auth"
              element={
                session ? <Navigate to="/" replace /> : <Auth />
              }
            />
            <Route
              element={
                session ? (
                  <DashboardLayout />
                ) : (
                  <Navigate to="/auth" replace />
                )
              }
            >
              <Route path="/" element={<Index />} />
              <Route path="/plans" element={<Plans />} />
              <Route path="/plans/:id" element={<PlanDetail />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
          {session && <CalculationDebugPanel />}
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
