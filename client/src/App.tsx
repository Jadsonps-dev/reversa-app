import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Header } from "@/components/layout/header";
import Entry from "@/pages/entry";
import Reversa from "@/pages/reversa";
import Finalization from "@/pages/finalization";
import Reports from "@/pages/reports";
import Login from "@/pages/login";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/" component={Entry} />
      <Route path="/reversa" component={Reversa} />
      <Route path="/finalization" component={Finalization} />
      <Route path="/reports" component={Reports} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [location] = useLocation();
  const isLoginPage = location === "/login";

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen bg-background">
          {!isLoginPage && <Header />}
          <main className={isLoginPage ? "" : "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"}>
            <Router />
          </main>
        </div>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
