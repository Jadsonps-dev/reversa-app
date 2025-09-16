
import { useState, useRef, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertTrackingSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Barcode, Save, Check } from "lucide-react";
import type { Tracking, InsertTracking } from "@shared/schema";

export default function Reversa() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [lastTrackingCode, setLastTrackingCode] = useState("");

  const form = useForm<InsertTracking>({
    resolver: zodResolver(insertTrackingSchema),
    defaultValues: {
      trackingCode: "",
    },
  });

  // Fetch recent entries for display
  const { data: recentTrackings = [] } = useQuery<Tracking[]>({
    queryKey: ["/api/trackings"],
  });

  const createTrackingMutation = useMutation({
    mutationFn: async (data: InsertTracking) => {
      const response = await apiRequest("POST", "/api/trackings", data);
      return response.json();
    },
    onSuccess: (newTracking: Tracking) => {
      queryClient.invalidateQueries({ queryKey: ["/api/trackings"] });
      setLastTrackingCode(newTracking.trackingCode);
      setShowSuccess(true);
      form.reset();
      
      // Hide success message after 3 seconds
      setTimeout(() => {
        setShowSuccess(false);
        inputRef.current?.focus();
      }, 3000);

      toast({
        title: "Sucesso!",
        description: `Rastreio ${newTracking.trackingCode} registrado com sucesso.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao registrar rastreio",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertTracking) => {
    if (!data.trackingCode.trim()) return;
    
    // Remove tudo após o cifrão ($) se existir
    const cleanedTrackingCode = data.trackingCode.includes('$') 
      ? data.trackingCode.split('$')[0]
      : data.trackingCode;
    
    createTrackingMutation.mutate({
      trackingCode: cleanedTrackingCode,
      statusRastreio: "normal",
      user: null,
      empresa: "DEFAULT"
    });
  };

  // Auto-focus input on mount and after submission
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Filter recent entries for reversa only (statusRastreio = "normal")
  const recentEntries = recentTrackings
    .filter(tracking => tracking.statusRastreio === "normal")
    .slice(0, 5);

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="shadow-sm border border-border p-8">
        <CardContent className="pt-0">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Barcode className="text-primary text-3xl" />
            </div>
            <h2 className="text-2xl font-semibold text-foreground mb-2">
              Escaneamento de Rastreio - Reversa
            </h2>
            <p className="text-muted-foreground">
              Escaneie ou digite o código de rastreio para registrar a entrada
            </p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="trackingCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Código de Rastreio</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        ref={inputRef}
                        placeholder="Escaneie ou digite o código de rastreio"
                        className="text-lg min-h-12"
                        autoComplete="off"
                        data-testid="input-tracking-code"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button 
                type="submit" 
                className="w-full py-3 text-base font-medium"
                disabled={createTrackingMutation.isPending}
                data-testid="button-submit-tracking"
              >
                <Save className="mr-2" size={16} />
                {createTrackingMutation.isPending ? "Registrando..." : "Registrar Entrada"}
              </Button>
            </form>
          </Form>

          {showSuccess && (
            <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
              <div className="flex items-center">
                <Check className="text-green-600 dark:text-green-400 mr-3" size={20} />
                <div>
                  <h3 className="text-sm font-medium text-green-800 dark:text-green-200">
                    Rastreio registrado com sucesso!
                  </h3>
                  <p className="text-sm text-green-700 dark:text-green-300 mt-1">{lastTrackingCode}</p>
                </div>
              </div>
            </div>
          )}

          {recentEntries.length > 0 && (
            <div className="mt-8 pt-6 border-t border-border">
              <h3 className="text-lg font-medium text-foreground mb-4">Últimas Entradas</h3>
              <div className="space-y-2">
                {recentEntries.map((entry) => (
                  <div key={entry.id} className="flex justify-between items-center p-3 bg-muted/50 rounded-md">
                    <div>
                      <span className="font-medium text-foreground" data-testid={`text-tracking-${entry.id}`}>
                        {entry.trackingCode}
                      </span>
                      <span className="text-sm text-muted-foreground ml-2">
                        {new Date(entry.receivedAt).toLocaleTimeString('pt-BR')}
                      </span>
                    </div>
                    <Check className="text-green-600" size={16} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
