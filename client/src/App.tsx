
import React from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Entry from "@/pages/entry";
import Finalization from "@/pages/finalization";
import Reports from "@/pages/reports";
import Admin from "@/pages/admin";
import Login from "@/pages/login";
import NotFound from "@/pages/not-found";
import { SidebarProvider, Sidebar, SidebarContent, SidebarHeader, SidebarFooter, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarInset } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { LogOut, FileInput, CheckSquare, BarChart3, Menu, Users } from "lucide-react";
import { Header } from "@/components/layout/header";
import { useState, useEffect } from "react";

function AppSidebar({ isCollapsed, onToggle }: { isCollapsed: boolean; onToggle: () => void; }) {
  const [location, setLocation] = useLocation();

  const handleLogout = async () => {
    try {
      // Logout no servidor
      await fetch('/api/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('Erro no logout:', error);
    } finally {
      // Sempre limpar estado local
      localStorage.removeItem("authToken");
      setLocation("/login");
    }
  };

  const handleNavigation = (path: string) => {
    setLocation(path);
    // Auto-colapsar ao clicar em um item se não estiver colapsado
    if (!isCollapsed) {
      onToggle();
    }
  };


  const menuItems = [
    {
      title: "Entrada",
      icon: FileInput,
      path: "/",
    },
    {
      title: "Finalização",
      icon: CheckSquare,
      path: "/finalization",
    },
    {
      title: "Dashboard",
      icon: BarChart3,
      path: "/reports",
    },
    {
      title: "Administração",
      icon: Users,
      path: "/admin",
    },
  ];

  return (
    <Sidebar className={`transition-all duration-300 ${isCollapsed ? 'w-16' : 'w-64'}`}>
      {/* Header com botão hambúrguer */}
      <SidebarHeader className="p-4 border-b">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold text-sm">SR</span>
              </div>
              <h1 className="text-lg font-semibold text-gray-900">Sistema Reversa</h1>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            className="p-1 h-8 w-8"
            title="Expandir/Encolher Menu"
          >
            <Menu className="h-4 w-4" />
          </Button>
        </div>
      </SidebarHeader>

      <SidebarContent className="flex-1 p-2">
        <SidebarMenu>
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.path}>
              <SidebarMenuButton
                onClick={() => handleNavigation(item.path)}
                isActive={location === item.path}
                className={`w-full transition-all duration-200 mb-1 ${
                  isCollapsed 
                    ? "justify-center px-2" 
                    : "justify-start px-3"
                } ${
                  location === item.path 
                    ? "bg-blue-100 text-blue-700 border-r-2 border-blue-600" 
                    : "hover:bg-gray-100"
                }`}
                title={isCollapsed ? item.title : ""}
              >
                <item.icon className={`h-5 w-5 ${isCollapsed ? "" : "mr-3"}`} />
                {!isCollapsed && (
                  <span className="font-medium">{item.title}</span>
                )}
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="p-2 border-t">
        <Button
          variant="ghost"
          onClick={handleLogout}
          className={`w-full transition-all duration-200 text-red-600 hover:text-red-700 hover:bg-red-50 ${
            isCollapsed 
              ? "justify-center px-2" 
              : "justify-start px-3"
          }`}
          title={isCollapsed ? "Sair" : ""}
        >
          <LogOut className={`h-5 w-5 ${isCollapsed ? "" : "mr-3"}`} />
          {!isCollapsed && <span className="font-medium">Sair</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}

function AuthenticatedLayout() {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem("sidebarCollapsed");
    return saved ? JSON.parse(saved) : false;
  });

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
    localStorage.setItem("sidebarCollapsed", JSON.stringify(!isCollapsed));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header isCollapsed={isCollapsed} />
      <SidebarProvider>
        <div className="flex min-h-screen pt-16">
          <AppSidebar isCollapsed={isCollapsed} onToggle={toggleSidebar} />
          <main className={`fixed top-16 right-0 bottom-0 transition-all duration-300 p-2 sm:p-3 overflow-auto ${isCollapsed ? 'left-16' : 'left-64'}`}>
            <Switch>
              <Route path="/" component={Entry} />
              <Route path="/finalization" component={Finalization} />
              <Route path="/reports" component={Reports} />
              <Route path="/admin" component={Admin} />
              <Route component={NotFound} />
            </Switch>
          </main>
        </div>
      </SidebarProvider>
    </div>
  );
}

function App() {
  const isAuthenticated = !!localStorage.getItem("authToken");

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen bg-background">
          <main className={isAuthenticated ? "" : ""}>
            {isAuthenticated ? (
              <AuthenticatedLayout />
            ) : (
              <Switch>
                <Route path="/login" component={Login} />
                <Route>
                  {() => {
                    window.location.href = "/login";
                    return <Login />;
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

export default App;
