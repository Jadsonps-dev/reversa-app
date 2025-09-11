import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Save, Trash2, Users, Plus, Edit3, Check } from "lucide-react";
import type { Tracking, UpdateTracking, User, InsertUser } from "@shared/schema";

const statusOptions = [
  { value: "PENDENTE", label: "Pendente" },
  { value: "TC_FINALIZADO", label: "TC Finalizado" },
  { value: "CANCELADO", label: "Cancelado" },
  { value: "DIVERGENCIA", label: "Divergência no TC" },
];

const statusFilterOptions = [
  { value: "ALL", label: "Todos os Status" },
  { value: "PENDENTE", label: "Pendente" },
  { value: "TC_FINALIZADO", label: "TC Finalizado" },
  { value: "CANCELADO", label: "Cancelado" },
  { value: "DIVERGENCIA", label: "Divergência no TC" },
];

export default function Finalization() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchFilter, setSearchFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [editingValues, setEditingValues] = useState<Record<string, Partial<UpdateTracking>>>({});
  const [newUserName, setNewUserName] = useState("");
  const [showUserForm, setShowUserForm] = useState(false);

  const { data: trackings = [], isLoading, refetch } = useQuery<Tracking[]>({
    queryKey: ["/api/trackings"],
  });

  const { data: users = [], isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const updateTrackingMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateTracking }) => {
      const response = await apiRequest("PATCH", `/api/trackings/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trackings"] });
      toast({
        title: "Sucesso!",
        description: "Rastreio atualizado com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar rastreio",
        variant: "destructive",
      });
    },
  });

  const deleteTrackingMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/trackings/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trackings"] });
      toast({
        title: "Sucesso!",
        description: "Rastreio removido com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao remover rastreio",
        variant: "destructive",
      });
    },
  });

  const createUserMutation = useMutation({
    mutationFn: async (userData: InsertUser) => {
      const response = await apiRequest("POST", "/api/users", userData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Sucesso!",
        description: "Usuário adicionado com sucesso.",
      });
      setNewUserName("");
      setShowUserForm(false);
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao adicionar usuário",
        variant: "destructive",
      });
    },
  });

  const filteredTrackings = useMemo(() => {
    return trackings.filter((tracking) => {
      const matchesStatus = statusFilter === "ALL" || (tracking.status || "PENDENTE") === statusFilter;
      const matchesSearch = !searchFilter || tracking.trackingCode.toLowerCase().includes(searchFilter.toLowerCase());
      const matchesDate = !dateFilter || (() => {
        const date = new Date(tracking.receivedAt);
        const localYMD = new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
        return localYMD === dateFilter;
      })();
      return matchesStatus && matchesSearch && matchesDate;
    });
  }, [trackings, statusFilter, searchFilter, dateFilter]);

  const handleFieldChange = (trackingId: string, field: keyof UpdateTracking, value: any) => {
    setEditingValues(prev => ({
      ...prev,
      [trackingId]: {
        ...prev[trackingId],
        [field]: value,
      }
    }));
  };

  const handleSave = (trackingId: string) => {
    const updates = editingValues[trackingId];
    if (updates && Object.keys(updates).length > 0) {
      updateTrackingMutation.mutate({ id: trackingId, data: updates });
      setEditingValues(prev => {
        const newValues = { ...prev };
        delete newValues[trackingId];
        return newValues;
      });
    }
  };

  const handleDelete = (trackingId: string) => {
    if (window.confirm("Tem certeza que deseja remover este rastreio?")) {
      deleteTrackingMutation.mutate(trackingId);
    }
  };

  const getFieldValue = (tracking: Tracking, field: keyof UpdateTracking) => {
    return editingValues[tracking.id]?.[field] ?? tracking[field] ?? "";
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (newUserName.trim()) {
      createUserMutation.mutate({ name: newUserName.trim() });
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Users Management Section */}
      <Card className="shadow-sm border border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users size={20} />
            Gerenciar Usuários
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Add User Form */}
            <div className="flex items-center gap-2">
              {!showUserForm ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowUserForm(true)}
                  data-testid="button-add-user"
                >
                  <Plus size={16} className="mr-2" />
                  Adicionar Usuário
                </Button>
              ) : (
                <form onSubmit={handleCreateUser} className="flex items-center gap-2">
                  <Input
                    placeholder="Nome do usuário"
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                    className="w-64"
                    data-testid="input-new-user-name"
                  />
                  <Button
                    type="submit"
                    size="sm"
                    disabled={createUserMutation.isPending || !newUserName.trim()}
                    data-testid="button-save-user"
                  >
                    <Check size={16} />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowUserForm(false);
                      setNewUserName("");
                    }}
                    data-testid="button-cancel-user"
                  >
                    Cancelar
                  </Button>
                </form>
              )}
            </div>

            {/* Users List */}
            <div className="flex flex-wrap gap-2">
              {users.map((user) => (
                <Badge key={user.id} variant="secondary" className="text-sm py-1 px-3" data-testid={`badge-user-${user.id}`}>
                  {user.name}
                </Badge>
              ))}
              {users.length === 0 && !usersLoading && (
                <p className="text-muted-foreground text-sm">Nenhum usuário cadastrado</p>
              )}
              {usersLoading && (
                <p className="text-muted-foreground text-sm">Carregando usuários...</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tracking Management Section */}
      <Card className="shadow-sm border border-border">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold text-foreground">Finalização de Rastreios</h2>
              <p className="text-sm text-muted-foreground mt-1">Gerencie e finalize os códigos de rastreio recebidos</p>
            </div>
          <div className="flex items-center space-x-4">
            <div className="text-sm text-muted-foreground">
              Total: <span className="font-medium text-foreground">{filteredTrackings.length}</span> rastreios
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => refetch()}
              data-testid="button-refresh"
            >
              <RefreshCw className="mr-2" size={16} />
              Atualizar
            </Button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="px-6 py-4 bg-muted/30 border-b border-border">
        <div className="flex flex-wrap gap-4 items-center">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48" data-testid="select-status-filter">
              <SelectValue placeholder="Todos os Status" />
            </SelectTrigger>
            <SelectContent>
              {statusFilterOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Input
            placeholder="Buscar rastreio..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="w-64"
            data-testid="input-search-filter"
          />
          
          <Input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="w-48"
            data-testid="input-date-filter"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Rastreio</TableHead>
              <TableHead>Data Recebido</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Data Finalização</TableHead>
              <TableHead>Qtd Peças</TableHead>
              <TableHead>Usuário</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTrackings.map((tracking) => (
              <TableRow key={tracking.id} className="hover:bg-muted/50 transition-colors">
                <TableCell className="font-medium" data-testid={`cell-tracking-${tracking.id}`}>
                  {tracking.trackingCode}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {new Date(tracking.receivedAt).toLocaleString('pt-BR')}
                </TableCell>
                <TableCell>
                  <Select
                    value={String(getFieldValue(tracking, "status") || "PENDENTE")}
                    onValueChange={(value) => handleFieldChange(tracking.id, "status", value)}
                    data-testid={`select-status-${tracking.id}`}
                  >
                    <SelectTrigger className="w-36">
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
                </TableCell>
                <TableCell>
                  {tracking.completedAt ? (
                    <div className={
                      tracking.status === "TC_FINALIZADO" ? "text-green-600" :
                      tracking.status === "CANCELADO" ? "text-red-600" :
                      tracking.status === "DIVERGENCIA" ? "text-orange-600" :
                      "text-muted-foreground"
                    }>
                      {new Date(tracking.completedAt).toLocaleString('pt-BR')}
                    </div>
                  ) : (
                    <div className="text-muted-foreground">-</div>
                  )}
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    min={0}
                    step={1}
                    value={getFieldValue(tracking, "quantity") ?? ""}
                    onChange={(e) => {
                      const value = e.target.value;
                      const numValue = value === "" ? null : Number.isNaN(Number(value)) ? null : Number(value);
                      handleFieldChange(tracking.id, "quantity", numValue);
                    }}
                    className="w-20"
                    placeholder="0"
                    data-testid={`input-quantity-${tracking.id}`}
                  />
                </TableCell>
                <TableCell>
                  <Input
                    value={getFieldValue(tracking, "user") || ""}
                    onChange={(e) => handleFieldChange(tracking.id, "user", e.target.value)}
                    className="w-32"
                    placeholder="Usuário"
                    data-testid={`input-user-${tracking.id}`}
                  />
                </TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSave(tracking.id)}
                      disabled={updateTrackingMutation.isPending}
                      data-testid={`button-save-${tracking.id}`}
                    >
                      <Save size={16} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(tracking.id)}
                      disabled={deleteTrackingMutation.isPending}
                      data-testid={`button-delete-${tracking.id}`}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        
        {filteredTrackings.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            Nenhum rastreio encontrado
          </div>
        )}
      </div>
      </Card>
    </div>
  );
}
