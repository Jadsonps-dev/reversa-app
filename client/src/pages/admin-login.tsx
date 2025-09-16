import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { User, Lock, Shield } from "lucide-react";
import logoUrl from "@assets/logoluft_1758035573661.png";

const adminLoginSchema = z.object({
  login: z.string().min(1, "Login é obrigatório"),
  senha: z.string().min(1, "Senha é obrigatória"),
});

type AdminLoginForm = z.infer<typeof adminLoginSchema>;

export default function AdminLogin() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<AdminLoginForm>({
    resolver: zodResolver(adminLoginSchema),
    defaultValues: {
      login: "",
      senha: "",
    },
  });

  const onSubmit = async (data: AdminLoginForm) => {
    setIsLoading(true);

    try {
      const response = await fetch("/api/admin-login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(data),
      });

      if (response.ok) {
        const admin = await response.json();
        console.log("Login de admin bem-sucedido:", admin);
        localStorage.setItem("adminAuthToken", "admin-authenticated");
        window.location.href = "/admin";
      } else {
        const errorData = await response.json();
        console.error("Erro no login do admin:", errorData.message);
        toast({
          variant: "destructive",
          title: "Erro no login",
          description: errorData.message || "Login ou senha incorretos. Tente novamente.",
        });
      }
    } catch (error) {
      console.error("Erro no login do admin:", error);
      toast({
        variant: "destructive",
        title: "Erro de conexão",
        description: "Não foi possível conectar ao servidor. Tente novamente.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-100 dark:from-gray-900 dark:to-gray-800">
      <Card className="w-full max-w-md shadow-lg border border-red-200">
        <CardHeader className="text-center pb-6">
          <div className="mx-auto mb-4">
            <img
              src={logoUrl}
              alt="Luft Logistics"
              className="h-16 w-auto mx-auto"
            />
          </div>
          <div className="flex items-center justify-center gap-2 mb-2">
            <Shield className="text-red-600" size={24} />
            <CardTitle className="text-2xl font-semibold text-foreground">
              Acesso Administrativo
            </CardTitle>
          </div>
          <p className="text-muted-foreground">
            Área restrita para administradores
          </p>
        </CardHeader>

        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Campo Login */}
              <FormField
                control={form.control}
                name="login"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <User size={16} />
                      Login do Administrador
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Digite seu login de admin"
                        autoComplete="username"
                        data-testid="input-admin-login"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Campo Senha */}
              <FormField
                control={form.control}
                name="senha"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Lock size={16} />
                      Senha do Administrador
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="password"
                        placeholder="Digite sua senha de admin"
                        autoComplete="current-password"
                        data-testid="input-admin-senha"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Botão de Login */}
              <Button
                type="submit"
                className="w-full py-3 text-base font-medium mt-6 bg-red-600 hover:bg-red-700"
                disabled={isLoading}
                data-testid="button-admin-login"
              >
                {isLoading ? "Entrando..." : "Entrar como Admin"}
              </Button>
            </form>
          </Form>

          {/* Link para voltar ao login normal */}
          <div className="text-center mt-4">
            <a
              href="/login"
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              Voltar ao login normal
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}