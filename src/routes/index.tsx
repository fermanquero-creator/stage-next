import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Mic2, Search, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ArtistCard } from "@/components/ArtistCard";
import { GENRES } from "@/lib/music";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Emerge — Descubre artistas emergentes" },
      { name: "description", content: "Escucha, sigue y descubre nuevos talentos musicales. Artistas: crea tu perfil y comparte tu música." },
      { property: "og:title", content: "Emerge — Descubre artistas emergentes" },
      { property: "og:description", content: "Un escenario para artistas que están comenzando." },
    ],
  }),
  component: Home,
});

function Home() {
  const { data: artists = [] } = useQuery({
    queryKey: ["artists", "latest"],
    queryFn: async () => {
      const { data, error } = await supabase.from("artists").select("id,stage_name,genre,city,bio,photo_url").order("created_at", { ascending: false }).limit(8);
      if (error) throw error;
      return data;
    },
  });

  return (
    <div>
      <section className="relative overflow-hidden border-b">
        <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-primary/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 -left-20 h-96 w-96 rounded-full bg-accent/20 blur-3xl" />
        <div className="relative mx-auto max-w-6xl px-4 py-20 sm:py-28">
          <p className="mb-4 inline-block rounded-full border px-3 py-1 text-xs uppercase tracking-widest text-muted-foreground">Música nueva, gente nueva</p>
          <h1 className="max-w-3xl text-4xl font-extrabold leading-[1.05] sm:text-6xl">
            El próximo sonido que amarás <span className="text-primary">empieza aquí.</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg text-muted-foreground">Descubre artistas emergentes, escucha sus canciones y no te pierdas sus próximos conciertos.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg" className="rounded-full"><Link to="/explorar"><Search className="mr-1 h-4 w-4" />Explorar artistas</Link></Button>
            <Button asChild size="lg" variant="outline" className="rounded-full"><Link to="/panel"><Mic2 className="mr-1 h-4 w-4" />Soy artista</Link></Button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="mb-5 text-xl font-bold">Explora por género</h2>
        <div className="flex flex-wrap gap-2">
          {GENRES.map((g) => (
            <Link key={g} to="/explorar" search={{ genero: g }} className="rounded-full border bg-card px-4 py-2 text-sm font-medium transition hover:border-primary hover:text-primary">{g}</Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16">
        <div className="mb-6 flex items-end justify-between">
          <h2 className="text-2xl font-bold">Recién llegados</h2>
          <Link to="/explorar" className="flex items-center gap-1 text-sm text-primary">Ver todos <ArrowRight className="h-4 w-4" /></Link>
        </div>
        {artists.length === 0 ? (
          <div className="rounded-2xl border border-dashed p-10 text-center text-muted-foreground">
            <Upload className="mx-auto mb-3 h-8 w-8" />
            Aún no hay artistas. ¡Sé el primero en <Link to="/panel" className="text-primary underline">crear tu perfil</Link>!
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {artists.map((a) => <ArtistCard key={a.id} artist={a} />)}
          </div>
        )}
      </section>
    </div>
  );
}
