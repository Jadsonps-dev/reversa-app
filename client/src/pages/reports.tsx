
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Download, BarChart3, Package, CheckCircle, XCircle, Clock, User } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import type { Tracking } from "@shared/schema";

const statusOptions = [
  { value: "ALL", label: "Todos os Status" },
  { value: "PENDENTE", label: "Pendente" },
  { value: "TC_FINALIZADO", label: "TC Finalizado" },
  { value: "CANCELADO", label: "Cancelado" },
  { value: "DIVERGENCIA", label: "Divergência no TC" },
];

export default function Reports() {
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [dateFromFilter, setDateFromFilter] = useState("");
  const [dateToFilter, setDateToFilter] = useState("");

  const { data: trackings = [], isLoading, refetch } = useQuery<Tracking[]>({
    queryKey: ["/api/trackings"],
  });

  const filteredTrackings = useMemo(() => {
    return trackings.filter((tracking) => {
      const matchesStatus = statusFilter === "ALL" || (tracking.status || "PENDENTE") === statusFilter;
      const matchesType = typeFilter === "ALL" || 
        (typeFilter === "REVERSA" && (tracking.statusRastreio === "normal" || !tracking.statusRastreio)) ||
        (typeFilter === "INSUCESSO" && tracking.statusRastreio === "insucesso");
      
      const trackingDate = new Date(tracking.receivedAt);
      const matchesDateFrom = !dateFromFilter || trackingDate >= new Date(dateFromFilter);
      const matchesDateTo = !dateToFilter || trackingDate <= new Date(dateToFilter + "T23:59:59");
      
      return matchesStatus && matchesType && matchesDateFrom && matchesDateTo;
    });
  }, [trackings, statusFilter, typeFilter, dateFromFilter, dateToFilter]);

  const stats = useMemo(() => {
    // Separar por tipo (normal/reversa vs insucesso)
    const normalTrackings = trackings.filter(t => t.statusRastreio === "normal" || !t.statusRastreio);
    const insucessoTrackings = trackings.filter(t => t.statusRastreio === "insucesso");
    
    // Métricas para Normal/Reversa
    const normalPackagesProduzidos = normalTrackings.filter(t => t.status && t.status !== "PENDENTE").length;
    const normalPendente = normalTrackings.filter(t => (t.status || "PENDENTE") === "PENDENTE").length;
    const normalPecasProduzidas = normalTrackings
      .filter(t => t.status === "TC_FINALIZADO")
      .reduce((sum, t) => sum + (t.quantity || 0), 0);
    
    // Métricas para Insucesso
    const insucessoPackagesProduzidos = insucessoTrackings.filter(t => t.status && t.status !== "PENDENTE").length;
    const insucessoPendente = insucessoTrackings.filter(t => (t.status || "PENDENTE") === "PENDENTE").length;
    const insucessoPecasProduzidas = insucessoTrackings
      .filter(t => t.status === "TC_FINALIZADO")
      .reduce((sum, t) => sum + (t.quantity || 0), 0);

    // Stats dos filtros aplicados
    const total = filteredTrackings.length;
    const pendente = filteredTrackings.filter(t => (t.status || "PENDENTE") === "PENDENTE").length;
    const finalizado = filteredTrackings.filter(t => t.status === "TC_FINALIZADO").length;
    const cancelado = filteredTrackings.filter(t => t.status === "CANCELADO").length;
    const divergencia = filteredTrackings.filter(t => t.status === "DIVERGENCIA").length;
    const reversa = filteredTrackings.filter(t => t.statusRastreio === "normal" || !t.statusRastreio).length;
    const insucesso = filteredTrackings.filter(t => t.statusRastreio === "insucesso").length;

    // Helper function para obter data local no formato YYYY-MM-DD
    const getLocalDayKey = (date: Date) => {
      return new Date(date.getFullYear(), date.getMonth(), date.getDate()).toLocaleDateString('sv-SE');
    };

    // Produtividade por usuário (apenas rastreios finalizados hoje)
    const today = getLocalDayKey(new Date());
    const todayTrackings = trackings.filter(t => {
      if (!t.completedAt || t.status !== 'TC_FINALIZADO') return false;
      const completedDate = getLocalDayKey(new Date(t.completedAt));
      return completedDate === today;
    });

    const produtividadeUsuarios = todayTrackings.reduce((acc, tracking) => {
      const user = tracking.user || 'Sem usuário';
      if (!acc[user]) {
        acc[user] = { rastreios: 0, quantidade: 0 };
      }
      acc[user].rastreios += 1;
      acc[user].quantidade += (tracking.quantity || 0);
      return acc;
    }, {} as Record<string, { rastreios: number; quantidade: number }>);

    // Dados para gráfico de entrada vs finalizados por dia (últimos 7 dias)
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return getLocalDayKey(date);
    }).reverse();

    const chartData = last7Days.map(date => {
      const entradas = trackings.filter(t => {
        if (!t.receivedAt) return false;
        return getLocalDayKey(new Date(t.receivedAt)) === date;
      }).length;
      
      const finalizados = trackings.filter(t => {
        if (!t.completedAt || t.status !== 'TC_FINALIZADO') return false;
        return getLocalDayKey(new Date(t.completedAt)) === date;
      }).length;

      return {
        data: date,
        entradas,
        finalizados,
      };
    });

    // Dados para gráfico de peças finalizadas por dia
    const pecasPorDia = last7Days.map(date => {
      const pecas = trackings.filter(t => {
        if (!t.completedAt || t.status !== 'TC_FINALIZADO') return false;
        return getLocalDayKey(new Date(t.completedAt)) === date;
      }).reduce((sum, t) => sum + (t.quantity || 0), 0);

      return {
        data: date,
        pecas,
      };
    });

    return {
      // Novas métricas principais
      normalPackagesProduzidos,
      normalPendente,
      normalPecasProduzidas,
      insucessoPackagesProduzidos,
      insucessoPendente,
      insucessoPecasProduzidas,
      // Produtividade e gráficos
      produtividadeUsuarios,
      chartData,
      pecasPorDia,
      // Stats existentes para compatibilidade
      total,
      pendente,
      finalizado,
      cancelado,
      divergencia,
      reversa,
      insucesso
    };
  }, [filteredTrackings, trackings]);

  const exportData = () => {
    const csvContent = [
      ["Rastreio", "Data Recebido", "Status", "Data Finalização", "Qtd Peças", "Usuário", "Tipo"].join(","),
      ...filteredTrackings.map(tracking => [
        tracking.trackingCode,
        new Date(tracking.receivedAt).toLocaleString('pt-BR'),
        tracking.status || "PENDENTE",
        tracking.completedAt ? new Date(tracking.completedAt).toLocaleString('pt-BR') : "",
        tracking.quantity || 0,
        tracking.user || "",
        tracking.statusRastreio === "insucesso" ? "INSUCESSO" : "REVERSA"
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `relatorio_rastreios_${new Date().toISOString().slice(0,10)}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return <div className="text-center py-8">Carregando relatórios...</div>;
  }

  return (
    <div className="w-full">
      <div className="w-full space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Dashboard & Relatórios</h1>
          <p className="text-sm text-gray-600 mt-1">Visão geral dos rastreios e estatísticas</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="px-3 py-2 text-xs sm:text-sm"
          >
            <RefreshCw className="mr-1 sm:mr-2" size={14} />
            Atualizar
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={exportData}
            className="px-3 py-2 text-xs sm:text-sm"
          >
            <Download className="mr-1 sm:mr-2" size={14} />
            Exportar CSV
          </Button>
        </div>
      </div>

      {/* Cards de Métricas Principais */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-3">Métricas Gerais</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Cards Normal/Reversa */}
            <Card className="border-blue-200 bg-blue-50/50">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <Package className="h-8 w-8 text-blue-600" data-testid="icon-packages-normal" />
                  <div>
                    <p className="text-sm text-muted-foreground">Pacotes Produzidos</p>
                    <p className="text-2xl font-bold text-blue-600" data-testid="text-packages-normal">{stats.normalPackagesProduzidos}</p>
                    <p className="text-xs text-muted-foreground">Normal/Reversa</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-yellow-200 bg-yellow-50/50">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <Clock className="h-8 w-8 text-yellow-600" data-testid="icon-pending-normal" />
                  <div>
                    <p className="text-sm text-muted-foreground">Pendente</p>
                    <p className="text-2xl font-bold text-yellow-600" data-testid="text-pending-normal">{stats.normalPendente}</p>
                    <p className="text-xs text-muted-foreground">Normal/Reversa</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-green-200 bg-green-50/50">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-8 w-8 text-green-600" data-testid="icon-pieces-normal" />
                  <div>
                    <p className="text-sm text-muted-foreground">Peças Produzidas</p>
                    <p className="text-2xl font-bold text-green-600" data-testid="text-pieces-normal">{stats.normalPecasProduzidas}</p>
                    <p className="text-xs text-muted-foreground">Normal/Reversa</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Cards Insucesso */}
            <Card className="border-red-200 bg-red-50/50">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <Package className="h-8 w-8 text-red-600" data-testid="icon-packages-insucesso" />
                  <div>
                    <p className="text-sm text-muted-foreground">Pacotes Produzidos</p>
                    <p className="text-2xl font-bold text-red-600" data-testid="text-packages-insucesso">{stats.insucessoPackagesProduzidos}</p>
                    <p className="text-xs text-muted-foreground">Insucesso</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-orange-200 bg-orange-50/50">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <Clock className="h-8 w-8 text-orange-600" data-testid="icon-pending-insucesso" />
                  <div>
                    <p className="text-sm text-muted-foreground">Pendente</p>
                    <p className="text-2xl font-bold text-orange-600" data-testid="text-pending-insucesso">{stats.insucessoPendente}</p>
                    <p className="text-xs text-muted-foreground">Insucesso</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-purple-200 bg-purple-50/50">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-8 w-8 text-purple-600" data-testid="icon-pieces-insucesso" />
                  <div>
                    <p className="text-sm text-muted-foreground">Peças Produzidas</p>
                    <p className="text-2xl font-bold text-purple-600" data-testid="text-pieces-insucesso">{stats.insucessoPecasProduzidas}</p>
                    <p className="text-xs text-muted-foreground">Insucesso</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Filters */}
      <Card className="w-full">
        <CardHeader className="pb-3">
          <CardTitle className="text-base sm:text-lg">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos os Tipos</SelectItem>
                <SelectItem value="REVERSA">Reversa</SelectItem>
                <SelectItem value="INSUCESSO">Insucesso</SelectItem>
              </SelectContent>
            </Select>

            <Input
              type="date"
              placeholder="Data inicial"
              value={dateFromFilter}
              onChange={(e) => setDateFromFilter(e.target.value)}
              className="w-full"
            />

            <Input
              type="date"
              placeholder="Data final"
              value={dateToFilter}
              onChange={(e) => setDateToFilter(e.target.value)}
              className="w-full"
            />

            <Button 
              variant="outline" 
              onClick={() => {
                setStatusFilter("ALL");
                setTypeFilter("ALL");
                setDateFromFilter("");
                setDateToFilter("");
              }}
              className="w-full text-xs sm:text-sm"
            >
              Limpar Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Produtividade dos Usuários */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-base sm:text-lg flex items-center gap-2">
            <User className="h-5 w-5" />
            Produtividade dos Usuários (Hoje)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {Object.keys(stats.produtividadeUsuarios).length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <User className="mx-auto h-12 w-12 text-gray-300 mb-4" />
              <p>Nenhuma produtividade registrada hoje</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Rastreios</TableHead>
                  <TableHead>Quantidade</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(stats.produtividadeUsuarios)
                  .sort(([,a], [,b]) => b.rastreios - a.rastreios)
                  .map(([usuario, data]) => (
                    <TableRow key={usuario}>
                      <TableCell className="font-medium" data-testid={`user-${usuario}`}>{usuario}</TableCell>
                      <TableCell data-testid={`rastreios-${usuario}`}>{data.rastreios}</TableCell>
                      <TableCell data-testid={`quantidade-${usuario}`}>{data.quantidade}</TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Entrada vs Finalizados */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">Rastreios: Entrada vs Finalizados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.chartData} data-testid="chart-entrada-finalizados">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="data" 
                    tickFormatter={(value) => new Date(value).toLocaleDateString('pt-BR', { month: 'short', day: 'numeric' })}
                  />
                  <YAxis />
                  <Tooltip 
                    labelFormatter={(value) => new Date(value).toLocaleDateString('pt-BR')}
                    formatter={(value, name) => [value, name === 'entradas' ? 'Entradas' : 'Finalizados']}
                  />
                  <Legend />
                  <Bar dataKey="entradas" fill="#3b82f6" name="Entradas" />
                  <Bar dataKey="finalizados" fill="#10b981" name="Finalizados" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Gráfico de Peças Finalizadas por Dia */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">Peças Finalizadas por Dia</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.pecasPorDia} data-testid="chart-pecas-finalizadas">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="data" 
                    tickFormatter={(value) => new Date(value).toLocaleDateString('pt-BR', { month: 'short', day: 'numeric' })}
                  />
                  <YAxis />
                  <Tooltip 
                    labelFormatter={(value) => new Date(value).toLocaleDateString('pt-BR')}
                    formatter={(value) => [value, 'Peças']}
                  />
                  <Bar dataKey="pecas" fill="#8b5cf6" name="Peças" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">Atividade Recente</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredTrackings.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Package className="mx-auto h-12 w-12 text-gray-300 mb-4" />
              <p>Nenhum rastreio encontrado com os filtros aplicados</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTrackings.slice(0, 10).map((tracking) => (
                <div key={tracking.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-muted/30 rounded-lg gap-2 sm:gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground text-sm sm:text-base break-all">
                      {tracking.trackingCode}
                    </p>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      {new Date(tracking.receivedAt).toLocaleString('pt-BR')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={
                        (tracking.status || "PENDENTE") === "TC_FINALIZADO" ? "default" :
                        (tracking.status || "PENDENTE") === "CANCELADO" ? "destructive" :
                        (tracking.status || "PENDENTE") === "DIVERGENCIA" ? "secondary" :
                        "outline"
                      }
                      className="text-xs"
                    >
                      {(tracking.status || "PENDENTE") === "TC_FINALIZADO" ? "Finalizado" :
                       (tracking.status || "PENDENTE") === "CANCELADO" ? "Cancelado" :
                       (tracking.status || "PENDENTE") === "DIVERGENCIA" ? "Divergência" :
                       "Pendente"}
                    </Badge>
                    <Badge 
                      variant="outline"
                      className="text-xs"
                    >
                      {tracking.statusRastreio === "insucesso" ? "Insucesso" : "Reversa"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      </div>
    </div>
  );
}
