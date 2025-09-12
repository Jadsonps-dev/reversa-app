
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, User, Lock } from "lucide-react";

const loginSchema = z.object({
  empresa: z.string().min(1, "Selecione uma empresa"),
  login: z.string().min(1, "Login é obrigatório"),
  senha: z.string().min(1, "Senha é obrigatória"),
});

type LoginForm = z.infer<typeof loginSchema>;

const empresas = [
  { value: "insider", label: "Insider" },
  { value: "alcance_jeans", label: "Alcance Jeans" },
];

export default function Login() {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      empresa: "",
      login: "",
      senha: "",
    },
  });

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    
    try {
      // Aqui você implementaria a lógica de autenticação
      console.log("Dados de login:", data);
      
      // Simular delay de autenticação
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Redirecionar para a página principal após login bem-sucedido
      window.location.href = "/";
      
    } catch (error) {
      console.error("Erro no login:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <Card className="w-full max-w-md shadow-lg border border-border">
        <CardHeader className="text-center pb-6">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Building2 className="text-primary text-2xl" />
          </div>
          <CardTitle className="text-2xl font-semibold text-foreground">
            Sistema de Rastreio
          </CardTitle>
          <p className="text-muted-foreground">
            Faça login para acessar o sistema
          </p>
        </CardHeader>

        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Campo Empresa */}
              <FormField
                control={form.control}
                name="empresa"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Building2 size={16} />
                      Empresa
                    </FormLabel>
                    <FormControl>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Selecione sua empresa" />
                        </SelectTrigger>
                        <SelectContent>
                          {empresas.map((empresa) => (
                            <SelectItem key={empresa.value} value={empresa.value}>
                              {empresa.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Campo Login */}
              <FormField
                control={form.control}
                name="login"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <User size={16} />
                      Login
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Digite seu login"
                        autoComplete="username"
                        data-testid="input-login"
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
                      Senha
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="password"
                        placeholder="Digite sua senha"
                        autoComplete="current-password"
                        data-testid="input-senha"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Botão de Login */}
              <Button
                type="submit"
                className="w-full py-3 text-base font-medium mt-6"
                disabled={isLoading}
                data-testid="button-login"
              >
                {isLoading ? "Entrando..." : "Entrar"}
              </Button>
            </form>
          </Form>

          {/* Link para recuperação de senha (opcional) */}
          <div className="text-center mt-4">
            <button className="text-sm text-muted-foreground hover:text-primary transition-colors">
              Esqueceu sua senha?
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
