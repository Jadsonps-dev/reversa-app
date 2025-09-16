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

export function Header() {
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

  const { date, time } = formatDateTime(currentTime);
  const empresaName = userInfo?.empresa || 'Carregando...';

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="flex justify-between items-center h-16 px-6">
          {/* Logo e Sistema */}
        <div className="flex items-center space-x-3">
          <img 
            src={logoUrl} 
            alt="Luft Logistics" 
            className="h-10 w-auto"
          />
          <h1 className="text-xl font-semibold text-gray-900">Sistema Reversa</h1>
        </div>

        {/* Informações centrais */}
        <div className="flex items-center space-x-8">
          {/* Nome da Empresa */}
          <div className="text-center">
            <p className="text-sm text-gray-500">Empresa</p>
            <p className="font-semibold text-gray-900" data-testid="text-empresa">{empresaName}</p>
          </div>

          {/* Data e Hora */}
          <div className="text-center">
            <p className="text-sm text-gray-500">Data/Hora</p>
            <p className="font-semibold text-gray-900" data-testid="text-datetime">{date} - {time}</p>
          </div>
        </div>

        {/* Botão de Sair */}
        <Button
          variant="outline"
          onClick={handleLogout}
          className="flex items-center space-x-2 text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
          data-testid="button-logout-header"
        >
          <LogOut className="h-4 w-4" />
          <span>Sair</span>
        </Button>
      </div>
    </header>
  );
}
