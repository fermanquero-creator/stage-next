import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar — Emerge" },
      { name: "description", content: "Inicia sesión o crea tu cuenta de artista en Emerge." },
      { property: "og:title", content: "Entrar — Emerge" },
      { property: "og:description", content: "Crea tu cuenta y comparte tu música." },
    ],
  }),
  component: AuthPage,
});

const schema = z.object({
  email: z.string().trim().email("Correo no válido").max(255),
  password: z.string().min(6, "Mínimo 6 caracteres").max(72),
});

function AuthPage() {
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { if (data.session) navigate({ to: "/panel" }); });
    const { data } = supabase.auth.onAuthStateChange((_e, s) => { if (s) navigate({ to: "/panel" }); });
    return () => data.subscription.unsubscribe();
  }, [navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse({ email, password });
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);
    setBusy(true);
    if (mode === "up") {
      const { error } = await supabase.auth.signUp({ ...parsed.data, options: { emailRedirectTo: window.location.origin + "/panel" } });
      if (error) toast.error(error.message);
      else toast.success("Revisa tu correo para confirmar tu cuenta.");
    } else {
      const { error } = await supabase.auth.signInWithPassword(parsed.data);
      if (error) toast.error("Correo o contraseña incorrectos");
    }
    setBusy(false);
  }

  async function google() {
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/auth" });
    if (r.error) toast.error("No se pudo iniciar con Google");
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="text-3xl font-bold">{mode === "in" ? "Bienvenido de vuelta" : "Crea tu cuenta"}</h1>
      <p className="mt-2 text-muted-foreground">Artistas: entra para crear y administrar tu perfil.</p>
      <Button variant="outline" className="mt-8 w-full rounded-full" onClick={google}>Continuar con Google</Button>
      <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground"><div className="h-px flex-1 bg-border" />o<div className="h-px flex-1 bg-border" /></div>
      <form onSubmit={submit} className="space-y-4">
        <div><Label htmlFor="email">Correo</Label><Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1" /></div>
        <div><Label htmlFor="pw">Contraseña</Label><Input id="pw" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1" /></div>
        <Button type="submit" disabled={busy} className="w-full rounded-full">{mode === "in" ? "Entrar" : "Registrarme"}</Button>
      </form>
      <button onClick={() => setMode(mode === "in" ? "up" : "in")} className="mt-6 w-full text-center text-sm text-muted-foreground hover:text-primary">
        {mode === "in" ? "¿No tienes cuenta? Regístrate" : "¿Ya tienes cuenta? Inicia sesión"}
      </button>
    </div>
  );
}
