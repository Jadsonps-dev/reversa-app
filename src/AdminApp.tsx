
import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Switch, Route } from "wouter";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import AdminLogin from "@/pages/admin-login";
import Admin from "@/pages/admin";

const adminQueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

function AdminApp() {
  const isAdminAuthenticated = !!localStorage.getItem("adminAuthToken");

  return (
    <QueryClientProvider client={adminQueryClient}>
      <TooltipProvider>
        <div className="min-h-screen bg-background">
          <main>
            {isAdminAuthenticated ? (
              <Admin />
            ) : (
              <Switch>
                <Route path="/admin-login" component={AdminLogin} />
                <Route>
                  {() => {
                    window.location.href = "/admin-login";
                    return <AdminLogin />;
                  }}
                </Route>
              </Switch>
            )}
          </main>
        </div>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default AdminApp;
