import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Disc3, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@/hooks/use-session";

export function SiteHeader() {
  const { user } = useUser();
  const qc = useQueryClient();
  const navigate = useNavigate();

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4">
        <Link to="/" className="flex items-center gap-2 font-display text-lg font-bold">
          <Disc3 className="h-6 w-6 text-primary" /> Emerge
        </Link>
        <nav className="flex items-center gap-1 sm:gap-2">
          <Link to="/explorar" className="rounded-full px-3 py-2 text-sm font-medium hover:bg-secondary" activeProps={{ className: "text-primary" }}>
            Explorar
          </Link>
          {user ? (
            <>
              <Link to="/panel" className="rounded-full px-3 py-2 text-sm font-medium hover:bg-secondary" activeProps={{ className: "text-primary" }}>
                Mi perfil
              </Link>
              <Button size="icon" variant="ghost" onClick={signOut} aria-label="Cerrar sesión"><LogOut className="h-4 w-4" /></Button>
            </>
          ) : (
            <Button asChild size="sm" className="rounded-full"><Link to="/auth">Entrar</Link></Button>
          )}
        </nav>
      </div>
    </header>
  );
}
