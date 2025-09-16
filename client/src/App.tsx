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
import { BrowserRouter, Routes, Route as ReactRoute, Navigate, useNavigate } from "react-router-dom";
import { SidebarProvider, Sidebar, SidebarContent, SidebarHeader, SidebarFooter, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarInset } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { LogOut, FileInput, CheckSquare, BarChart3 } from "lucide-react";

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

function AppSidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    navigate("/login");
  };

  const menuItems = [
    {
      title: "Entrada",
      icon: FileInput,
      path: "/entry",
    },
    {
      title: "Finalização",
      icon: CheckSquare,
      path: "/finalization",
    },
    {
      title: "Relatórios",
      icon: BarChart3,
      path: "/reports",
    },
  ];

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
            <span className="text-white font-semibold text-sm">SR</span>
          </div>
          <h1 className="text-lg font-semibold text-gray-900">Sistema Reversa</h1>
        </div>
      </SidebarHeader>

      <SidebarContent className="flex-1 p-4">
        <SidebarMenu>
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.path}>
              <SidebarMenuButton
                onClick={() => navigate(item.path)}
                isActive={location.pathname === item.path}
                className="w-full justify-start"
              >
                <item.icon className="mr-2 h-4 w-4" />
                {item.title}
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <Button
          variant="ghost"
          onClick={handleLogout}
          className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sair
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}

function AuthenticatedLayout() {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen">
        <AppSidebar />
        <SidebarInset className="flex-1">
          <main className="p-6">
            <Routes>
              <Route path="/" element={<Navigate to="/entry" />} />
              <Route path="/entry" element={<Entry />} />
              <Route path="/reversa" element={<Reversa />} />
              <Route path="/finalization" element={<Finalization />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}


function App() {
  const isAuthenticated = localStorage.getItem("authToken");

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen bg-background">
          {!isAuthenticated && <Header />}
          <main className={isAuthenticated ? "" : "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"}>
            {isAuthenticated ? (
              <BrowserRouter>
                 <AuthenticatedLayout />
              </BrowserRouter>
            ) : (
              <Switch>
                <Route path="/login" component={Login} />
                <Route component={NotFound} />
              </Switch>
            )}
          </main>
        </div>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;