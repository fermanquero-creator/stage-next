import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Calendar, ExternalLink, Globe, Instagram, Mail, MapPin, Music2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/artista/$id")({
  head: () => ({
    meta: [
      { title: "Perfil de artista — Emerge" },
      { name: "description", content: "Canciones, discografía, portafolio y próximos eventos de este artista emergente." },
      { property: "og:title", content: "Perfil de artista — Emerge" },
      { property: "og:description", content: "Escucha su música y descubre sus próximos eventos." },
    ],
  }),
  component: ArtistPage,
});

function ArtistPage() {
  const { id } = Route.useParams();
  const { data, isLoading } = useQuery({
    queryKey: ["artist", id],
    queryFn: async () => {
      const [a, s, r, p, e] = await Promise.all([
        supabase.from("artists").select("*").eq("id", id).maybeSingle(),
        supabase.from("songs").select("*").eq("artist_id", id).order("created_at", { ascending: false }),
        supabase.from("releases").select("*").eq("artist_id", id).order("year", { ascending: false }),
        supabase.from("portfolio_items").select("*").eq("artist_id", id).order("created_at", { ascending: false }),
        supabase.from("events").select("*").eq("artist_id", id).gte("event_date", new Date().toISOString()).order("event_date"),
      ]);
      if (a.error) throw a.error;
      return { artist: a.data, songs: s.data ?? [], releases: r.data ?? [], portfolio: p.data ?? [], events: e.data ?? [] };
    },
  });

  if (isLoading) return <p className="p-10 text-center text-muted-foreground">Cargando…</p>;
  if (!data?.artist) return (
    <div className="p-16 text-center"><p className="text-muted-foreground">Artista no encontrado.</p><Link to="/explorar" className="mt-4 inline-block text-primary">Volver a explorar</Link></div>
  );
  const { artist, songs, releases, portfolio, events } = data;

  return (
    <div>
      <section className="relative overflow-hidden border-b">
        {artist.photo_url && <img src={artist.photo_url} alt="" className="absolute inset-0 h-full w-full scale-110 object-cover opacity-25 blur-2xl" />}
        <div className="relative mx-auto flex max-w-6xl flex-col items-center gap-6 px-4 py-12 text-center sm:flex-row sm:items-end sm:text-left">
          <div className="h-44 w-44 shrink-0 overflow-hidden rounded-2xl border-4 border-primary bg-muted sm:h-56 sm:w-56">
            {artist.photo_url ? <img src={artist.photo_url} alt={artist.stage_name} className="h-full w-full object-cover" /> : <Music2 className="m-auto mt-16 h-16 w-16 text-muted-foreground" />}
          </div>
          <div>
            <span className="rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground">{artist.genre}</span>
            <h1 className="mt-3 text-4xl font-extrabold sm:text-6xl">{artist.stage_name}</h1>
            {artist.city && <p className="mt-2 flex items-center justify-center gap-1 text-muted-foreground sm:justify-start"><MapPin className="h-4 w-4" />{artist.city}</p>}
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-10 lg:grid-cols-[1fr_320px]">
        <div className="space-y-10">
          {artist.bio && <Block title="Biografía"><p className="whitespace-pre-line leading-relaxed text-muted-foreground">{artist.bio}</p></Block>}

          <Block title="Canciones">
            {songs.length === 0 ? <Empty /> : (
              <ul className="space-y-3">
                {songs.map((s, i) => (
                  <li key={s.id} className="rounded-xl border bg-card p-4">
                    <p className="mb-2 font-semibold"><span className="mr-2 text-primary">{String(i + 1).padStart(2, "0")}</span>{s.title}</p>
                    <audio controls preload="none" src={s.audio_url} className="w-full" />
                  </li>
                ))}
              </ul>
            )}
          </Block>

          <Block title="Discografía">
            {releases.length === 0 ? <Empty /> : (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                {releases.map((r) => (
                  <div key={r.id}>
                    <div className="aspect-square overflow-hidden rounded-xl bg-muted">
                      {r.cover_url ? <img src={r.cover_url} alt={r.title} className="h-full w-full object-cover" /> : <Music2 className="m-auto mt-[40%] h-8 w-8 text-muted-foreground" />}
                    </div>
                    <p className="mt-2 font-semibold">{r.title}</p>
                    <p className="text-sm text-muted-foreground">{r.release_type}{r.year ? ` · ${r.year}` : ""}</p>
                  </div>
                ))}
              </div>
            )}
          </Block>

          <Block title="Portafolio">
            {portfolio.length === 0 ? <Empty /> : (
              <div className="grid gap-4 sm:grid-cols-2">
                {portfolio.map((p) => (
                  <div key={p.id} className="overflow-hidden rounded-xl border bg-card">
                    {p.image_url && <img src={p.image_url} alt={p.title} className="aspect-video w-full object-cover" />}
                    <div className="p-4">
                      <p className="font-semibold">{p.title}</p>
                      {p.description && <p className="mt-1 text-sm text-muted-foreground">{p.description}</p>}
                      {p.link && <a href={p.link} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-sm text-primary">Ver más <ExternalLink className="h-3 w-3" /></a>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Block>
        </div>

        <aside className="space-y-8">
          <Block title="Próximos eventos">
            {events.length === 0 ? <Empty text="Sin eventos próximos." /> : (
              <ul className="space-y-3">
                {events.map((e) => {
                  const d = new Date(e.event_date);
                  return (
                    <li key={e.id} className="flex gap-3 rounded-xl border bg-card p-3">
                      <div className="w-14 shrink-0 rounded-lg bg-accent py-2 text-center text-accent-foreground">
                        <p className="text-xs uppercase">{d.toLocaleDateString("es", { month: "short" })}</p>
                        <p className="font-display text-xl font-bold">{d.getDate()}</p>
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold">{e.title}</p>
                        <p className="text-sm text-muted-foreground">{[e.venue, e.city].filter(Boolean).join(" · ")}</p>
                        <p className="flex items-center gap-1 text-xs text-muted-foreground"><Calendar className="h-3 w-3" />{d.toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" })}</p>
                        {e.ticket_link && <a href={e.ticket_link} target="_blank" rel="noreferrer" className="text-sm text-primary">Entradas</a>}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </Block>
          <Block title="Contacto">
            <div className="space-y-2 text-sm">
              {artist.contact_email && <a href={`mailto:${artist.contact_email}`} className="flex items-center gap-2 hover:text-primary"><Mail className="h-4 w-4" />{artist.contact_email}</a>}
              {artist.instagram && <a href={`https://instagram.com/${artist.instagram.replace("@", "")}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 hover:text-primary"><Instagram className="h-4 w-4" />{artist.instagram}</a>}
              {artist.website && <a href={artist.website} target="_blank" rel="noreferrer" className="flex items-center gap-2 break-all hover:text-primary"><Globe className="h-4 w-4" />{artist.website}</a>}
              {!artist.contact_email && !artist.instagram && !artist.website && <Empty text="Sin datos de contacto." />}
            </div>
          </Block>
        </aside>
      </div>
    </div>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return <section><h2 className="mb-4 text-xl font-bold">{title}</h2>{children}</section>;
}
function Empty({ text = "Aún no hay contenido." }: { text?: string }) {
  return <p className="text-sm text-muted-foreground">{text}</p>;
}
