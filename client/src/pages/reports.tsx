import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Download, FileText, BarChart3, Calendar, Filter } from "lucide-react";
import type { Tracking } from "@shared/schema";

const statusOptions = [
  { value: "ALL", label: "Todos os Status" },
  { value: "PENDENTE", label: "Pendente" },
  { value: "TC_FINALIZADO", label: "TC Finalizado" },
  { value: "CANCELADO", label: "Cancelado" },
  { value: "DIVERGENCIA", label: "Divergência no TC" },
];

const getStatusColor = (status: string) => {
  switch (status) {
    case "TC_FINALIZADO": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
    case "CANCELADO": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
    case "DIVERGENCIA": return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300";
    default: return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
  }
};

export default function Reports() {
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [searchFilter, setSearchFilter] = useState("");

  const { data: trackings = [], isLoading } = useQuery<Tracking[]>({
    queryKey: ["/api/trackings"],
  });

  const filteredData = useMemo(() => {
    return trackings.filter((tracking) => {
      const matchesStatus = statusFilter === "ALL" || (tracking.status || "PENDENTE") === statusFilter;
      const matchesSearch = !searchFilter || tracking.trackingCode.toLowerCase().includes(searchFilter.toLowerCase());
      
      let matchesDateRange = true;
      if (dateFrom || dateTo) {
        const trackingDate = new Date(tracking.receivedAt);
        const localYMD = new Date(trackingDate.getTime() - trackingDate.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
        
        if (dateFrom && localYMD < dateFrom) matchesDateRange = false;
        if (dateTo && localYMD > dateTo) matchesDateRange = false;
      }
      
      return matchesStatus && matchesSearch && matchesDateRange;
    });
  }, [trackings, statusFilter, searchFilter, dateFrom, dateTo]);

  const statistics = useMemo(() => {
    const total = filteredData.length;
    const pendente = filteredData.filter(t => (t.status || "PENDENTE") === "PENDENTE").length;
    const finalizado = filteredData.filter(t => t.status === "TC_FINALIZADO").length;
    const cancelado = filteredData.filter(t => t.status === "CANCELADO").length;
    const divergencia = filteredData.filter(t => t.status === "DIVERGENCIA").length;
    const totalPecas = filteredData.reduce((sum, t) => sum + (t.quantity || 0), 0);

    return { total, pendente, finalizado, cancelado, divergencia, totalPecas };
  }, [filteredData]);

  const exportToCSV = () => {
    const headers = ["Rastreio", "Data Recebido", "Status", "Data Finalização", "Qtd Peças", "Usuário"];
    const csvContent = [
      headers.join(","),
      ...filteredData.map(tracking => [
        tracking.trackingCode,
        new Date(tracking.receivedAt).toLocaleString('pt-BR'),
        tracking.status || "PENDENTE",
        tracking.completedAt ? new Date(tracking.completedAt).toLocaleString('pt-BR') : "",
        tracking.quantity || 0,
        tracking.user || ""
      ].map(field => `"${String(field).replaceAll('"', '""')}"`).join(","))
    ].join("\r\n");

    const bom = "\uFEFF"; // UTF-8 BOM for Excel compatibility
    const blob = new Blob([bom + csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `relatorio-rastreios-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return <div className="text-center py-8">Carregando relatórios...</div>;
  }

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Relatórios</h1>
          <p className="text-muted-foreground">Análise e exportação de dados de rastreamento</p>
        </div>
        <Button onClick={exportToCSV} className="flex items-center gap-2" data-testid="button-export-csv">
          <Download size={16} />
          Exportar CSV
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <BarChart3 className="text-blue-600" size={20} />
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-semibold" data-testid="stat-total">{statistics.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Calendar className="text-gray-600" size={20} />
              <div>
                <p className="text-sm text-muted-foreground">Pendente</p>
                <p className="text-2xl font-semibold text-gray-600" data-testid="stat-pendente">{statistics.pendente}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <FileText className="text-green-600" size={20} />
              <div>
                <p className="text-sm text-muted-foreground">Finalizado</p>
                <p className="text-2xl font-semibold text-green-600" data-testid="stat-finalizado">{statistics.finalizado}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-600 rounded-full"></div>
              <div>
                <p className="text-sm text-muted-foreground">Cancelado</p>
                <p className="text-2xl font-semibold text-red-600" data-testid="stat-cancelado">{statistics.cancelado}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-orange-600 rounded-full"></div>
              <div>
                <p className="text-sm text-muted-foreground">Divergência</p>
                <p className="text-2xl font-semibold text-orange-600" data-testid="stat-divergencia">{statistics.divergencia}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-600 rounded-full"></div>
              <div>
                <p className="text-sm text-muted-foreground">Total Peças</p>
                <p className="text-2xl font-semibold text-blue-600" data-testid="stat-total-pecas">{statistics.totalPecas}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter size={20} />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-end">
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48" data-testid="select-status-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Data Início</label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-48"
                data-testid="input-date-from"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Data Fim</label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-48"
                data-testid="input-date-to"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Buscar Rastreio</label>
              <Input
                placeholder="Digite o código..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-64"
                data-testid="input-search-filter"
              />
            </div>

            <Button
              variant="outline"
              onClick={() => {
                setStatusFilter("ALL");
                setDateFrom("");
                setDateTo("");
                setSearchFilter("");
              }}
              data-testid="button-clear-filters"
            >
              Limpar Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Dados Filtrados ({filteredData.length} registros)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto w-full">
            <Table className="w-full">
              <TableHeader>
                <TableRow>
                  <TableHead>Rastreio</TableHead>
                  <TableHead>Data Recebido</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data Finalização</TableHead>
                  <TableHead>Qtd Peças</TableHead>
                  <TableHead>Usuário</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.map((tracking) => (
                  <TableRow key={tracking.id}>
                    <TableCell className="font-medium" data-testid={`cell-tracking-${tracking.id}`}>
                      {tracking.trackingCode}
                    </TableCell>
                    <TableCell>
                      {new Date(tracking.receivedAt).toLocaleString('pt-BR')}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(tracking.status || "PENDENTE")}>
                        {tracking.status === "TC_FINALIZADO" ? "TC Finalizado" :
                         tracking.status === "CANCELADO" ? "Cancelado" :
                         tracking.status === "DIVERGENCIA" ? "Divergência no TC" :
                         "Pendente"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {tracking.completedAt ? (
                        <span className={
                          tracking.status === "TC_FINALIZADO" ? "text-green-600" :
                          tracking.status === "CANCELADO" ? "text-red-600" :
                          tracking.status === "DIVERGENCIA" ? "text-orange-600" :
                          "text-muted-foreground"
                        }>
                          {new Date(tracking.completedAt).toLocaleString('pt-BR')}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {tracking.quantity || 0}
                    </TableCell>
                    <TableCell>
                      {tracking.user || "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            
            {filteredData.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum rastreio encontrado com os filtros aplicados
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}