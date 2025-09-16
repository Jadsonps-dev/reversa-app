
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Download, BarChart3, Package, CheckCircle, XCircle, Clock } from "lucide-react";
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
    const total = filteredTrackings.length;
    const pendente = filteredTrackings.filter(t => (t.status || "PENDENTE") === "PENDENTE").length;
    const finalizado = filteredTrackings.filter(t => t.status === "TC_FINALIZADO").length;
    const cancelado = filteredTrackings.filter(t => t.status === "CANCELADO").length;
    const divergencia = filteredTrackings.filter(t => t.status === "DIVERGENCIA").length;
    const reversa = filteredTrackings.filter(t => t.statusRastreio === "normal" || !t.statusRastreio).length;
    const insucesso = filteredTrackings.filter(t => t.statusRastreio === "insucesso").length;

    return {
      total,
      pendente,
      finalizado,
      cancelado,
      divergencia,
      reversa,
      insucesso
    };
  }, [filteredTrackings]);

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
    <div className="w-full max-w-none mx-0 space-y-4 sm:space-y-6">
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

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3 sm:gap-4">
        <Card>
          <CardContent className="p-3 sm:p-6">
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Total</p>
                <p className="text-lg sm:text-2xl font-bold text-blue-600">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 sm:p-6">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-600" />
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Pendente</p>
                <p className="text-lg sm:text-2xl font-bold text-yellow-600">{stats.pendente}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 sm:p-6">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Finalizado</p>
                <p className="text-lg sm:text-2xl font-bold text-green-600">{stats.finalizado}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 sm:p-6">
            <div className="flex items-center space-x-2">
              <XCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-600" />
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Cancelado</p>
                <p className="text-lg sm:text-2xl font-bold text-red-600">{stats.cancelado}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 sm:p-6">
            <div className="flex items-center space-x-2">
              <Package className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600" />
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Divergência</p>
                <p className="text-lg sm:text-2xl font-bold text-orange-600">{stats.divergencia}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 sm:p-6">
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Reversa</p>
                <p className="text-lg sm:text-2xl font-bold text-purple-600">{stats.reversa}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 sm:p-6">
            <div className="flex items-center space-x-2">
              <XCircle className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" />
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Insucesso</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-600">{stats.insucesso}</p>
              </div>
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
  );
}
