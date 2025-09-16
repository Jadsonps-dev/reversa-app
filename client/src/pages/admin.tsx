import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { insertUserSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, BarChart3, Building2, Calendar, FileText, Home, LogOut, Package, Settings, Shield, Trash2, TrendingUp, UserCog, UserPlus, Users, Users2 } from "lucide-react";
import type { User, InsertUser, Tracking } from "@shared/schema";

const empresas = [
  { value: "insider", label: "Insider" },
  { value: "alcance_jeans", label: "Alcance Jeans" },
  { value: "modab", label: "ModaB" },
];

export default function Admin() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  const form = useForm<InsertUser>({
    resolver: zodResolver(insertUserSchema),
    defaultValues: {
      name: "",
      login: "",
      password: "",
      empresa: undefined,
    },
  });

  // Fetch all users
  const { data: users = [], isLoading, refetch } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  // Fetch all trackings for statistics
  const { data: trackings = [] } = useQuery<Tracking[]>({
    queryKey: ["/api/trackings"],
  });

  const createUserMutation = useMutation({
    mutationFn: async (data: InsertUser) => {
      const response = await apiRequest("POST", "/api/users", data);
      return response.json();
    },
    onSuccess: (newUser: User) => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      form.reset();
      setShowForm(false);
      toast({
        title: "Sucesso!",
        description: `Usuário ${newUser.name} criado com sucesso.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao criar usuário",
        variant: "destructive",
      });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await apiRequest("DELETE", `/api/users/${userId}`);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setUserToDelete(null);
      toast({
        title: "Sucesso!",
        description: "Usuário removido com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao remover usuário",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertUser) => {
    createUserMutation.mutate(data);
  };

  const getEmpresaLabel = (empresa: string) => {
    const empresaObj = empresas.find(e => e.value === empresa);
    return empresaObj ? empresaObj.label : empresa;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center py-8">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="w-full max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <Card className="shadow-lg border border-border">
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Users className="text-blue-600" size={24} />
                </div>
                <div>
                  <CardTitle className="text-xl sm:text-2xl text-foreground">
                    Painel de Administração
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Gerencie usuários do sistema
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => refetch()}
                  disabled={isLoading}
                  data-testid="button-refresh-users"
                >
                  <RefreshCw className="mr-2" size={16} />
                  Atualizar
                </Button>
                <Button
                  onClick={() => setShowForm(!showForm)}
                  data-testid="button-add-user"
                  className="flex items-center gap-2"
                >
                  <UserPlus size={16} />
                  {showForm ? "Cancelar" : "Novo Usuário"}
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* User Creation Form */}
        {showForm && (
          <Card className="shadow-lg border border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus size={20} />
                Cadastrar Novo Usuário
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome Completo</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="Digite o nome completo"
                              data-testid="input-user-name"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="login"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Login</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="Digite o login do usuário"
                              data-testid="input-user-login"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Senha</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="password"
                              placeholder="Digite a senha"
                              data-testid="input-user-password"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="empresa"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Empresa</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-user-empresa">
                                <SelectValue placeholder="Selecione a empresa" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {empresas.map((empresa) => (
                                <SelectItem key={empresa.value} value={empresa.value}>
                                  {empresa.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button 
                      type="submit" 
                      disabled={createUserMutation.isPending}
                      data-testid="button-submit-user"
                      className="flex-1 sm:flex-none"
                    >
                      <UserPlus className="mr-2" size={16} />
                      {createUserMutation.isPending ? "Criando..." : "Criar Usuário"}
                    </Button>
                    <Button 
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowForm(false);
                        form.reset();
                      }}
                      data-testid="button-cancel-user"
                    >
                      Cancelar
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        )}

        {/* Users List */}
        <Card className="shadow-lg border border-border">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Usuários Cadastrados</span>
              <Badge variant="secondary">{users.length} usuários</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {users.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="mx-auto mb-4" size={48} />
                <p>Nenhum usuário cadastrado ainda.</p>
                <p className="text-sm">Clique em "Novo Usuário" para criar o primeiro.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Login</TableHead>
                      <TableHead>Empresa</TableHead>
                      <TableHead>ID</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium" data-testid={`user-name-${user.id}`}>
                          {user.name}
                        </TableCell>
                        <TableCell data-testid={`user-login-${user.id}`}>
                          {user.login}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" data-testid={`user-empresa-${user.id}`}>
                            {getEmpresaLabel(user.empresa)}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {user.id}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}