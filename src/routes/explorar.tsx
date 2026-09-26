import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { ArtistCard } from "@/components/ArtistCard";
import { GENRES } from "@/lib/music";
import { Input } from "@/components/ui/input";

const searchSchema = z.object({ q: z.string().optional(), genero: z.string().optional() });

export const Route = createFileRoute("/explorar")({
  validateSearch: (s) => searchSchema.parse(s),
  head: () => ({
    meta: [
      { title: "Explorar artistas — Emerge" },
      { name: "description", content: "Busca artistas emergentes por nombre, ciudad o género musical." },
      { property: "og:title", content: "Explorar artistas — Emerge" },
      { property: "og:description", content: "Busca y filtra artistas emergentes por género musical." },
    ],
  }),
  component: Explore,
});

function Explore() {
  const { q = "", genero } = Route.useSearch();
  const navigate = useNavigate({ from: "/explorar" });
  const [text, setText] = useState(q);

  useEffect(() => {
    const t = setTimeout(() => navigate({ search: (p) => ({ ...p, q: text || undefined }), replace: true }), 300);
    return () => clearTimeout(t);
  }, [text, navigate]);

  const { data: artists = [], isLoading } = useQuery({
    queryKey: ["artists", "search", q, genero],
    queryFn: async () => {
      let query = supabase.from("artists").select("id,stage_name,genre,city,bio,photo_url").order("created_at", { ascending: false });
      if (genero) query = query.eq("genre", genero);
      const term = q.trim().replace(/[,%()]/g, "").slice(0, 60);
      if (term) query = query.or(`stage_name.ilike.%${term}%,city.ilike.%${term}%,bio.ilike.%${term}%`);
      const { data, error } = await query.limit(60);
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-bold sm:text-4xl">Explorar artistas</h1>
      <div className="relative mt-6">
        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
        <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="Busca por nombre, ciudad o palabra clave…" className="h-12 rounded-full pl-12 text-base" maxLength={60} />
      </div>
      <div className="-mx-4 mt-4 flex gap-2 overflow-x-auto px-4 pb-2">
        {["Todos", ...GENRES].map((g) => {
          const active = (g === "Todos" && !genero) || g === genero;
          return (
            <button
              key={g}
              onClick={() => navigate({ search: (p) => ({ ...p, genero: g === "Todos" ? undefined : g }) })}
              className={`shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium transition ${active ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:border-primary"}`}
            >{g}</button>
          );
        })}
      </div>
      <div className="mt-8">
        {isLoading ? (
          <p className="text-muted-foreground">Cargando…</p>
        ) : artists.length === 0 ? (
          <p className="rounded-2xl border border-dashed p-10 text-center text-muted-foreground">No encontramos artistas con esos filtros.</p>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {artists.map((a) => <ArtistCard key={a.id} artist={a} />)}
          </div>
        )}
      </div>
    </div>
  );
}
