import { Link, useLocation } from "wouter";
import { Package, PlusCircle, List, BarChart3 } from "lucide-react";

export function Header() {
  const [location] = useLocation();

  return (
    <header className="bg-card border-b border-border shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-3">
            <Package className="text-primary text-2xl" />
            <h1 className="text-xl font-semibold text-foreground">Sistema de Rastreamento</h1>
          </div>
          <nav className="flex space-x-4">
            <Link href="/">
              <button 
                className={`px-4 py-2 rounded-md font-medium transition-colors ${
                  location === "/" 
                    ? "bg-primary text-primary-foreground" 
                    : "bg-secondary text-secondary-foreground hover:bg-accent"
                }`}
                data-testid="button-entry-tab"
              >
                <PlusCircle className="inline mr-2" size={16} />
                Entrada
              </button>
            </Link>
            <Link href="/finalization">
              <button 
                className={`px-4 py-2 rounded-md font-medium transition-colors ${
                  location === "/finalization" 
                    ? "bg-primary text-primary-foreground" 
                    : "bg-secondary text-secondary-foreground hover:bg-accent"
                }`}
                data-testid="button-finalization-tab"
              >
                <List className="inline mr-2" size={16} />
                Finalização
              </button>
            </Link>
            <Link href="/reports">
              <button 
                className={`px-4 py-2 rounded-md font-medium transition-colors ${
                  location === "/reports" 
                    ? "bg-primary text-primary-foreground" 
                    : "bg-secondary text-secondary-foreground hover:bg-accent"
                }`}
                data-testid="button-reports-tab"
              >
                <BarChart3 className="inline mr-2" size={16} />
                Relatórios
              </button>
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
