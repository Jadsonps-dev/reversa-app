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
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { RefreshCw, Save, Trash2, Users, Plus, Edit3, Check } from "lucide-react";
import type { Tracking, UpdateTracking, User, InsertUser, Name, InsertName } from "@shared/schema";

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
  const [typeFilter, setTypeFilter] = useState("ALL"); // Novo filtro por tipo
  const [searchFilter, setSearchFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [editingValues, setEditingValues] = useState<Record<string, Partial<UpdateTracking>>>({});
  const [newUserName, setNewUserName] = useState("");
  const [showUserForm, setShowUserForm] = useState(false);
  const [editingStates, setEditingStates] = useState<Record<string, boolean>>({});
  const [confirmedStates, setConfirmedStates] = useState<Record<string, boolean>>({}); // Estado para rastrear itens confirmados
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [trackingToDelete, setTrackingToDelete] = useState<string | null>(null);

  const { data: trackings = [], isLoading, refetch } = useQuery<Tracking[]>({
    queryKey: ["/api/trackings"],
  });

  const { data: users = [], isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const { data: customNames = [] } = useQuery<Name[]>({
    queryKey: ["/api/names"],
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

  const createNameMutation = useMutation({
    mutationFn: async (data: InsertName) => {
      const response = await apiRequest("POST", "/api/names", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/names"] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao salvar nome",
        variant: "destructive",
      });
    },
  });

  // Note: No createUserMutation needed - user field is just text

  const filteredTrackings = useMemo(() => {
    return trackings.filter((tracking) => {
      const matchesStatus = statusFilter === "ALL" || (tracking.status || "PENDENTE") === statusFilter;
      const matchesType = typeFilter === "ALL" || 
        (typeFilter === "REVERSA" && (tracking.statusRastreio === "normal" || !tracking.statusRastreio)) ||
        (typeFilter === "INSUCESSO" && tracking.statusRastreio === "insucesso");
      const matchesSearch = !searchFilter || tracking.trackingCode.toLowerCase().includes(searchFilter.toLowerCase());
      const matchesDate = !dateFilter || (() => {
        const date = new Date(tracking.receivedAt);
        const localYMD = new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
        return localYMD === dateFilter;
      })();
      return matchesStatus && matchesType && matchesSearch && matchesDate;
    });
  }, [trackings, statusFilter, typeFilter, searchFilter, dateFilter]);

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
      // Desabilita o modo de edição após salvar
      setEditingStates(prev => ({
        ...prev,
        [trackingId]: false
      }));
      // Marca como confirmado
      setConfirmedStates(prev => ({
        ...prev,
        [trackingId]: true
      }));
    }
  };

  const handleEdit = (trackingId: string, tracking: Tracking) => {
    // Só permite editar itens que não são PENDENTE (PENDENTE é sempre editável)
    const status = tracking.status || "PENDENTE";
    if (status === "PENDENTE") {
      return; // PENDENTE não precisa clicar no lápis
    }
    
    // Ativa o modo de edição para status não-PENDENTE
    setEditingStates(prev => ({
      ...prev,
      [trackingId]: true
    }));
    // Pré-preenche os valores atuais
    setEditingValues(prev => ({
      ...prev,
      [trackingId]: {
        status: tracking.status || "PENDENTE",
        quantity: tracking.quantity || 0,
        user: tracking.user || ""
      }
    }));
  };

  const isEditing = (trackingId: string) => editingStates[trackingId] || false;
  const isConfirmed = (trackingId: string) => confirmedStates[trackingId] || false;
  // Define se os campos podem ser editados:
  // - PENDENTE: sempre editável (sem precisar clicar no lápis)
  // - Outros status: só editável após clicar no lápis
  const canEdit = (tracking: Tracking) => {
    const status = tracking.status || "PENDENTE";
    if (status === "PENDENTE") {
      return true; // PENDENTE sempre pode editar
    }
    return isEditing(tracking.id); // Outros status só se estiver editando
  };

  const handleDelete = (trackingId: string) => {
    setTrackingToDelete(trackingId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (trackingToDelete) {
      deleteTrackingMutation.mutate(trackingToDelete);
      setDeleteDialogOpen(false);
      setTrackingToDelete(null);
    }
  };

  const getFieldValue = (tracking: Tracking, field: keyof UpdateTracking) => {
    return editingValues[tracking.id]?.[field] ?? tracking[field] ?? "";
  };

  // Store which tracking we're adding a user for
  const [currentTrackingForUser, setCurrentTrackingForUser] = useState<string | null>(null);

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (newUserName.trim() && currentTrackingForUser) {
      // Save the custom name to the database for future use
      createNameMutation.mutate({
        users: newUserName.trim(),
      });
      
      // Apply the custom name directly to the current tracking
      handleFieldChange(currentTrackingForUser, "user", newUserName.trim());
      setShowUserForm(false);
      setNewUserName("");
      setCurrentTrackingForUser(null);
      toast({
        title: "Nome salvo e aplicado",
        description: "Nome customizado salvo para uso futuro e aplicado ao rastreio.",
      });
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">Carregando...</div>;
  }

  return (
    <div className="w-full space-y-6 px-2 sm:px-4 lg:px-6">
      {/* Tracking Management Section */}
      <Card className="shadow-sm border border-border w-full">
        {/* Header */}
        <div className="px-4 sm:px-6 py-4 border-b border-border">
          <div className="flex flex-col xl:flex-row xl:justify-between xl:items-center gap-4">
            <div className="flex-shrink-0">
              <h2 className="text-lg sm:text-xl font-semibold text-foreground">Finalização de Rastreios</h2>
              <p className="text-xs sm:text-sm text-gray-700 mt-1">Gerencie e finalize os códigos de rastreio recebidos</p>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 flex-shrink-0">
              {/* Type Filter Buttons */}
              <div className="flex gap-1 sm:gap-2">
                <Button
                  variant={typeFilter === "ALL" ? "default" : "outline"}
                  onClick={() => setTypeFilter("ALL")}
                  className="px-2 sm:px-3 py-1.5 text-xs sm:text-sm"
                  size="sm"
                >
                  Todos
                </Button>
                <Button
                  variant={typeFilter === "REVERSA" ? "default" : "outline"}
                  onClick={() => setTypeFilter("REVERSA")}
                  className="px-2 sm:px-3 py-1.5 text-xs sm:text-sm"
                  size="sm"
                >
                  Reversa
                </Button>
                <Button
                  variant={typeFilter === "INSUCESSO" ? "default" : "outline"}
                  onClick={() => setTypeFilter("INSUCESSO")}
                  className="px-2 sm:px-3 py-1.5 text-xs sm:text-sm"
                  size="sm"
                >
                  Insucesso
                </Button>
              </div>
              <div className="flex items-center justify-between sm:justify-start gap-3">
                <div className="text-xs sm:text-sm text-gray-700 whitespace-nowrap">
                  Total: <span className="font-medium text-foreground">{filteredTrackings.length}</span> rastreios
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => refetch()}
                  data-testid="button-refresh"
                  className="px-2 sm:px-3 py-1.5 text-xs sm:text-sm flex-shrink-0"
                >
                  <RefreshCw className="mr-1" size={14} />
                  <span className="hidden sm:inline">Atualizar</span>
                </Button>
              </div>
            </div>
          </div>
        </div>

      {/* Filters */}
      <div className="px-4 sm:px-6 py-4 bg-muted/30 border-b border-border">
        <div className="flex flex-col lg:flex-row gap-3 lg:gap-4 lg:items-center">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full lg:w-48" data-testid="select-status-filter">
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
            className="w-full lg:w-64"
            data-testid="input-search-filter"
          />

          <Input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="w-full lg:w-48"
            data-testid="input-date-filter"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <Table className="w-full">
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="text-gray-900 font-semibold text-xs sm:text-sm w-[15%] min-w-[120px]">Rastreio</TableHead>
              <TableHead className="text-gray-900 font-semibold text-xs sm:text-sm w-[14%] min-w-[130px]">Data Recebido</TableHead>
              <TableHead className="text-gray-900 font-semibold text-xs sm:text-sm w-[13%] min-w-[110px]">Status</TableHead>
              <TableHead className="text-gray-900 font-semibold text-xs sm:text-sm w-[14%] min-w-[130px]">Data Finalização</TableHead>
              <TableHead className="text-gray-900 font-semibold text-xs sm:text-sm w-[8%] min-w-[80px]">Qtd Peças</TableHead>
              <TableHead className="text-gray-900 font-semibold text-xs sm:text-sm w-[20%] min-w-[150px]">Usuário</TableHead>
              <TableHead className="text-gray-900 font-semibold text-xs sm:text-sm w-[16%] min-w-[120px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTrackings.map((tracking) => (
              <TableRow key={tracking.id} className="hover:bg-muted/50 transition-colors">
                <TableCell className="font-medium text-gray-900 text-xs sm:text-sm" data-testid={`cell-tracking-${tracking.id}`}>
                  <div className="break-all max-w-[120px] overflow-hidden text-ellipsis">{tracking.trackingCode}</div>
                </TableCell>
                <TableCell className="text-gray-800 text-xs sm:text-sm">
                  <div className="whitespace-nowrap text-ellipsis overflow-hidden max-w-[130px]">{new Date(tracking.receivedAt).toLocaleString('pt-BR')}</div>
                </TableCell>
                <TableCell>
                  <Select
                    value={String(getFieldValue(tracking, "status") || "PENDENTE")}
                    onValueChange={(value) => handleFieldChange(tracking.id, "status", value)}
                    disabled={!canEdit(tracking)}
                    data-testid={`select-status-${tracking.id}`}
                  >
                    <SelectTrigger className={`w-full max-w-[110px] text-xs sm:text-sm ${
                      !canEdit(tracking) 
                        ? (tracking.status === "TC_FINALIZADO" 
                          ? 'text-green-700 bg-green-50 border-green-200' 
                          : 'text-gray-600 bg-gray-200 border-gray-300')
                        : (tracking.status === "TC_FINALIZADO" 
                          ? 'text-green-700 bg-green-50 border-green-200' 
                          : '')
                    }`}>
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
                    <div className={`text-xs sm:text-sm whitespace-nowrap text-ellipsis overflow-hidden max-w-[130px] ${
                      tracking.status === "TC_FINALIZADO" ? "text-green-600" :
                      tracking.status === "CANCELADO" ? "text-red-600" :
                      tracking.status === "DIVERGENCIA" ? "text-orange-600" :
                      "text-gray-700"
                    }`}>
                      {new Date(tracking.completedAt).toLocaleString('pt-BR')}
                    </div>
                  ) : (
                    <div className="text-gray-700 text-xs sm:text-sm">-</div>
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
                    className={`w-full max-w-[80px] text-xs sm:text-sm ${!canEdit(tracking) ? 'text-gray-600 bg-gray-200 border-gray-300' : ''}`}
                    placeholder="0"
                    disabled={!canEdit(tracking)}
                    data-testid={`input-quantity-${tracking.id}`}
                  />
                </TableCell>
                <TableCell>
                  <div className="space-y-2 max-w-[150px]">
                    <Select
                      value={String(getFieldValue(tracking, "user") || "")}
                      onValueChange={(value) => {
                        if (value === "ADD_NEW") {
                          setCurrentTrackingForUser(tracking.id);
                          setShowUserForm(true);
                          return;
                        }
                        handleFieldChange(tracking.id, "user", value);
                      }}
                      disabled={!canEdit(tracking)}
                    >
                      <SelectTrigger className={`w-full text-xs sm:text-sm ${!canEdit(tracking) ? 'text-gray-600 bg-gray-200 border-gray-300' : ''}`} data-testid={`select-user-${tracking.id}`}>
                        <SelectValue placeholder="Selecionar usuário" />
                      </SelectTrigger>
                      <SelectContent>
                        {users.map((user) => (
                          <SelectItem key={user.id} value={user.name}>
                            {user.name}
                          </SelectItem>
                        ))}
                        {customNames.map((customName) => (
                          <SelectItem key={customName.id} value={customName.users}>
                            {customName.users}
                          </SelectItem>
                        ))}
                        <SelectItem value="ADD_NEW" className="text-blue-600 font-medium">
                          + Digitar nome customizado
                        </SelectItem>
                      </SelectContent>
                    </Select>

                    {/* Add new user form - shown when "ADD_NEW" is selected */}
                    {showUserForm && (
                      <form onSubmit={handleCreateUser} className="flex flex-col gap-2 w-full">
                        <Input
                          placeholder="Digite o nome do usuário"
                          value={newUserName}
                          onChange={(e) => setNewUserName(e.target.value)}
                          className="w-full text-xs"
                          data-testid="input-new-user-name"
                          autoFocus
                        />
                        <div className="flex gap-1">
                          <Button
                            type="submit"
                            size="sm"
                            disabled={!newUserName.trim()}
                            data-testid="button-save-user"
                            className="flex-1 text-xs"
                          >
                            <Check size={12} />
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
                            className="flex-1 text-xs"
                          >
                            Cancelar
                          </Button>
                        </div>
                      </form>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1 justify-center max-w-[120px]">
                    {/* Confirmar - Check Verde */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSave(tracking.id)}
                      disabled={updateTrackingMutation.isPending || !editingValues[tracking.id] || !canEdit(tracking)}
                      title="Confirmar alterações"
                      className="text-green-600 hover:text-green-800 hover:bg-green-50 disabled:text-gray-400 p-1.5"
                      data-testid={`button-confirm-${tracking.id}`}
                    >
                      <Check size={14} />
                    </Button>

                    {/* Editar - Lápis (só para status não-PENDENTE) */}
                    {(tracking.status || "PENDENTE") !== "PENDENTE" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(tracking.id, tracking)}
                        title="Editar"
                        className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 p-1.5"
                        data-testid={`button-edit-${tracking.id}`}
                      >
                        <Edit3 size={14} />
                      </Button>
                    )}

                    {/* Excluir - Lixeira */}
                    <AlertDialog open={deleteDialogOpen && trackingToDelete === tracking.id} onOpenChange={(open) => {
                      if (!open) {
                        setDeleteDialogOpen(false);
                        setTrackingToDelete(null);
                      }
                    }}>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(tracking.id)}
                          disabled={deleteTrackingMutation.isPending}
                          title="Excluir rastreio"
                          className="text-red-600 hover:text-red-800 hover:bg-red-50 disabled:text-gray-400 p-1.5"
                          data-testid={`button-delete-${tracking.id}`}
                        >
                          <Trash2 size={14} />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza que deseja remover o rastreio <strong>{tracking.trackingCode}</strong>? 
                            Esta ação não pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={confirmDelete}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Excluir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {filteredTrackings.length === 0 && (
          <div className="text-center py-8 text-gray-700">
            Nenhum rastreio encontrado
          </div>
        )}
      </div>
      </Card>
    </div>
  );
}