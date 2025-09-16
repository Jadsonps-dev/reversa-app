import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { LogOut, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import logoUrl from "@assets/logoluft_1758035573661.png";

interface UserInfo {
  id: string;
  username: string;
  empresa: string;
}

export function Header({ isCollapsed }: { isCollapsed: boolean }) {
  const [location, setLocation] = useLocation();
  const [currentTime, setCurrentTime] = useState(new Date());
  const queryClient = useQueryClient();

  // Atualizar hora a cada segundo
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Buscar informações do usuário logado
  const { data: userInfo, error } = useQuery<UserInfo>({
    queryKey: ['/api/user'],
    enabled: true,
    retry: false,
  });

  // Handle 401 errors (session expired)
  useEffect(() => {
    if (error && (error as any).status === 401) {
      localStorage.removeItem("authToken");
      queryClient.clear();
      setLocation("/login");
    }
  }, [error, setLocation, queryClient]);

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
      queryClient.clear();
      setLocation("/login");
    }
  };

  const formatDateTime = (date: Date) => {
    return {
      date: date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      }),
      time: date.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit'
      })
    };
  };

  // Função para formatar nome da empresa
  const formatEmpresaName = (empresa: string) => {
    return empresa
      .replace(/_/g, ' ') // Substitui underscore por espaço
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const { date, time } = formatDateTime(currentTime);
  const empresaName = userInfo?.empresa ? formatEmpresaName(userInfo.empresa) : 'Carregando...';

  return (
    <header className={`fixed top-0 right-0 z-50 bg-white border-b-2 border-blue-200 shadow-md transition-all duration-300 ${isCollapsed ? 'left-16' : 'left-64'}`}>
      <div className="flex items-center justify-between h-16 px-4 sm:px-6">
        {/* Logo e Nome da Empresa */}
        <div className="flex items-center space-x-3 flex-shrink-0">
          <img 
            src={logoUrl} 
            alt="Luft Logistics" 
            className="h-10 w-auto"
          />
          <div className="text-left">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Empresa</p>
            <p className="text-sm font-bold text-blue-700" data-testid="text-empresa">
              {empresaName}
            </p>
          </div>
        </div>

        {/* Data e Hora - Centralizada */}
        <div className="flex-1 flex justify-center">
          <div className="text-center">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Data/Hora</p>
            <p className="text-sm font-bold text-gray-900" data-testid="text-datetime">
              {date} - {time}
            </p>
          </div>
        </div>

        {/* Área da direita - apenas botão sair */}
        <div className="flex items-center flex-shrink-0">

          {/* Botão de Sair */}
          <Button
            variant="outline"
            onClick={handleLogout}
            className="flex items-center space-x-2 text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300 px-3 py-2 h-10"
            data-testid="button-logout-header"
          >
            <LogOut className="h-4 w-4" />
            <span className="text-sm font-medium">Sair</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
