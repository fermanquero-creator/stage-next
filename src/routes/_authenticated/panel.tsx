import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { Eye, Trash2, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { GENRES, uploadMedia } from "@/lib/music";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/panel")({
  head: () => ({
    meta: [
      { title: "Mi perfil de artista — Emerge" },
      { name: "description", content: "Administra tu perfil, canciones, discografía, portafolio y eventos." },
      { property: "og:title", content: "Mi perfil de artista — Emerge" },
      { property: "og:description", content: "Panel del artista en Emerge." },
    ],
  }),
  component: Panel,
});

const urlOpt = z.string().trim().max(300).url("Enlace no válido").or(z.literal(""));
const profileSchema = z.object({
  stage_name: z.string().trim().min(1, "El nombre artístico es obligatorio").max(80),
  bio: z.string().trim().max(2000),
  genre: z.string().min(1),
  city: z.string().trim().max(80),
  contact_email: z.string().trim().email("Correo no válido").max(255).or(z.literal("")),
  instagram: z.string().trim().max(60),
  website: urlOpt,
});

function Panel() {
  const { user } = Route.useRouteContext();
  const qc = useQueryClient();
  const { data: artist, isLoading } = useQuery({
    queryKey: ["my-artist", user.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("artists").select("*").eq("user_id", user.id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) return <p className="p-10 text-center text-muted-foreground">Cargando…</p>;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold">{artist ? artist.stage_name : "Crea tu perfil de artista"}</h1>
        {artist && <Button asChild variant="outline" className="rounded-full"><Link to="/artista/$id" params={{ id: artist.id }}><Eye className="mr-1 h-4 w-4" />Ver perfil público</Link></Button>}
      </div>
      {!artist ? (
        <ProfileForm userId={user.id} artist={null} onSaved={() => qc.invalidateQueries({ queryKey: ["my-artist"] })} />
      ) : (
        <Tabs defaultValue="perfil">
          <TabsList className="mb-6 flex h-auto w-full flex-wrap justify-start">
            <TabsTrigger value="perfil">Perfil</TabsTrigger>
            <TabsTrigger value="canciones">Canciones</TabsTrigger>
            <TabsTrigger value="discografia">Discografía</TabsTrigger>
            <TabsTrigger value="portafolio">Portafolio</TabsTrigger>
            <TabsTrigger value="eventos">Eventos</TabsTrigger>
          </TabsList>
          <TabsContent value="perfil"><ProfileForm userId={user.id} artist={artist} onSaved={() => qc.invalidateQueries({ queryKey: ["my-artist"] })} /></TabsContent>
          <TabsContent value="canciones"><Songs userId={user.id} artistId={artist.id} /></TabsContent>
          <TabsContent value="discografia"><Releases userId={user.id} artistId={artist.id} /></TabsContent>
          <TabsContent value="portafolio"><Portfolio userId={user.id} artistId={artist.id} /></TabsContent>
          <TabsContent value="eventos"><Events userId={user.id} artistId={artist.id} /></TabsContent>
        </Tabs>
      )}
    </div>
  );
}

type Artist = { id: string; stage_name: string; bio: string; genre: string; city: string; contact_email: string | null; instagram: string | null; website: string | null; photo_url: string | null };

function ProfileForm({ userId, artist, onSaved }: { userId: string; artist: Artist | null; onSaved: () => void }) {
  const [f, setF] = useState({
    stage_name: artist?.stage_name ?? "", bio: artist?.bio ?? "", genre: artist?.genre ?? "Pop", city: artist?.city ?? "",
    contact_email: artist?.contact_email ?? "", instagram: artist?.instagram ?? "", website: artist?.website ?? "",
  });
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState(artist?.photo_url ?? "");
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (photo) { const u = URL.createObjectURL(photo); setPreview(u); return () => URL.revokeObjectURL(u); } }, [photo]);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const p = profileSchema.safeParse(f);
    if (!p.success) return toast.error(p.error.issues[0].message);
    setBusy(true);
    try {
      const photo_url = photo ? await uploadMedia(userId, photo, "photos") : artist?.photo_url ?? null;
      const row = { ...p.data, contact_email: p.data.contact_email || null, instagram: p.data.instagram || null, website: p.data.website || null, photo_url, user_id: userId, updated_at: new Date().toISOString() };
      const { error } = artist
        ? await supabase.from("artists").update(row).eq("id", artist.id)
        : await supabase.from("artists").insert(row);
      if (error) throw error;
      toast.success("Perfil guardado");
      onSaved();
    } catch (err) { toast.error(err instanceof Error ? err.message : "Error al guardar"); }
    setBusy(false);
  }

  return (
    <form onSubmit={save} className="grid gap-6 rounded-2xl border bg-card p-6 md:grid-cols-[200px_1fr]">
      <div>
        <Label>Foto</Label>
        <label className="mt-2 flex aspect-square cursor-pointer items-center justify-center overflow-hidden rounded-2xl border border-dashed bg-muted hover:border-primary">
          {preview ? <img src={preview} alt="" className="h-full w-full object-cover" /> : <Upload className="h-8 w-8 text-muted-foreground" />}
          <input type="file" accept="image/*" className="hidden" onChange={(e) => setPhoto(e.target.files?.[0] ?? null)} />
        </label>
      </div>
      <div className="space-y-4">
        <div><Label>Nombre artístico *</Label><Input value={f.stage_name} onChange={set("stage_name")} className="mt-1" /></div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><Label>Género musical</Label>
            <Select value={f.genre} onValueChange={(v) => setF({ ...f, genre: v })}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>{GENRES.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>Ciudad</Label><Input value={f.city} onChange={set("city")} className="mt-1" /></div>
        </div>
        <div><Label>Biografía</Label><Textarea rows={5} value={f.bio} onChange={set("bio")} className="mt-1" /></div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div><Label>Correo de contacto</Label><Input value={f.contact_email} onChange={set("contact_email")} className="mt-1" /></div>
          <div><Label>Instagram</Label><Input value={f.instagram} onChange={set("instagram")} placeholder="@usuario" className="mt-1" /></div>
          <div><Label>Sitio web</Label><Input value={f.website} onChange={set("website")} placeholder="https://" className="mt-1" /></div>
        </div>
        <Button type="submit" disabled={busy} className="rounded-full">{busy ? "Guardando…" : "Guardar perfil"}</Button>
      </div>
    </form>
  );
}

type Table = "songs" | "releases" | "portfolio_items" | "events";

function useItems(table: Table, artistId: string) {
  const qc = useQueryClient();
  const key = ["my-items", table, artistId];
  const q = useQuery({
    queryKey: key,
    queryFn: async () => {
      const { data, error } = await supabase.from(table).select("*").eq("artist_id", artistId).order("created_at", { ascending: false });
      if (error) throw error;
      return data as Record<string, any>[];
    },
  });
  const refresh = () => { qc.invalidateQueries({ queryKey: key }); qc.invalidateQueries({ queryKey: ["artist", artistId] }); };
  const remove = async (id: string) => {
    const { error } = await supabase.from(table).delete().eq("id", id);
    if (error) toast.error(error.message); else refresh();
  };
  return { items: q.data ?? [], refresh, remove };
}

function ItemList({ items, render, onRemove }: { items: Record<string, any>[]; render: (i: Record<string, any>) => React.ReactNode; onRemove: (id: string) => void }) {
  if (!items.length) return <p className="text-sm text-muted-foreground">Todavía no has agregado nada.</p>;
  return (
    <ul className="space-y-2">
      {items.map((i) => (
        <li key={i.id} className="flex items-center gap-3 rounded-xl border bg-card p-3">
          <div className="min-w-0 flex-1">{render(i)}</div>
          <Button size="icon" variant="ghost" onClick={() => onRemove(i.id)} aria-label="Eliminar"><Trash2 className="h-4 w-4" /></Button>
        </li>
      ))}
    </ul>
  );
}

function Section({ title, form, children }: { title: string; form: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border bg-card p-6"><h2 className="mb-4 text-lg font-bold">{title}</h2>{form}</div>
      {children}
    </div>
  );
}

function Songs({ userId, artistId }: { userId: string; artistId: string }) {
  const { items, refresh, remove } = useItems("songs", artistId);
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || title.length > 120) return toast.error("Escribe un título válido");
    if (!file || !file.type.startsWith("audio/")) return toast.error("Selecciona un archivo de audio");
    setBusy(true);
    try {
      const audio_url = await uploadMedia(userId, file, "songs");
      const { error } = await supabase.from("songs").insert({ title: title.trim(), audio_url, artist_id: artistId, user_id: userId });
      if (error) throw error;
      setTitle(""); setFile(null); (e.target as HTMLFormElement).reset(); refresh(); toast.success("Canción subida");
    } catch (err) { toast.error(err instanceof Error ? err.message : "Error"); }
    setBusy(false);
  }
  return (
    <Section title="Subir canción" form={
      <form onSubmit={add} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
        <Input placeholder="Título" value={title} onChange={(e) => setTitle(e.target.value)} />
        <Input type="file" accept="audio/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        <Button disabled={busy} className="rounded-full">{busy ? "Subiendo…" : "Subir"}</Button>
      </form>
    }>
      <ItemList items={items} onRemove={remove} render={(s) => (<><p className="font-semibold">{s.title}</p><audio controls preload="none" src={s.audio_url} className="mt-2 w-full" /></>)} />
    </Section>
  );
}

function Releases({ userId, artistId }: { userId: string; artistId: string }) {
  const { items, refresh, remove } = useItems("releases", artistId);
  const [f, setF] = useState({ title: "", release_type: "Single", year: "" });
  const [cover, setCover] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!f.title.trim()) return toast.error("Escribe un título");
    const year = f.year ? Number(f.year) : null;
    if (year !== null && (isNaN(year) || year < 1900 || year > 2100)) return toast.error("Año no válido");
    setBusy(true);
    try {
      const cover_url = cover ? await uploadMedia(userId, cover, "covers") : null;
      const { error } = await supabase.from("releases").insert({ title: f.title.trim().slice(0, 120), release_type: f.release_type, year, cover_url, artist_id: artistId, user_id: userId });
      if (error) throw error;
      setF({ title: "", release_type: "Single", year: "" }); setCover(null); (e.target as HTMLFormElement).reset(); refresh();
    } catch (err) { toast.error(err instanceof Error ? err.message : "Error"); }
    setBusy(false);
  }
  return (
    <Section title="Agregar lanzamiento" form={
      <form onSubmit={add} className="grid gap-3 sm:grid-cols-2">
        <Input placeholder="Título" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />
        <Select value={f.release_type} onValueChange={(v) => setF({ ...f, release_type: v })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>{["Single", "EP", "Álbum"].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
        </Select>
        <Input placeholder="Año" inputMode="numeric" value={f.year} onChange={(e) => setF({ ...f, year: e.target.value })} />
        <div><Label className="text-xs text-muted-foreground">Portada (opcional)</Label><Input type="file" accept="image/*" onChange={(e) => setCover(e.target.files?.[0] ?? null)} /></div>
        <Button disabled={busy} className="rounded-full sm:col-span-2">{busy ? "Guardando…" : "Agregar"}</Button>
      </form>
    }>
      <ItemList items={items} onRemove={remove} render={(r) => (
        <div className="flex items-center gap-3">
          {r.cover_url && <img src={r.cover_url} alt="" className="h-12 w-12 rounded object-cover" />}
          <div><p className="font-semibold">{r.title}</p><p className="text-sm text-muted-foreground">{r.release_type}{r.year ? ` · ${r.year}` : ""}</p></div>
        </div>
      )} />
    </Section>
  );
}

function Portfolio({ userId, artistId }: { userId: string; artistId: string }) {
  const { items, refresh, remove } = useItems("portfolio_items", artistId);
  const [f, setF] = useState({ title: "", description: "", link: "" });
  const [img, setImg] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!f.title.trim()) return toast.error("Escribe un título");
    if (f.link && !urlOpt.safeParse(f.link).success) return toast.error("Enlace no válido");
    setBusy(true);
    try {
      const image_url = img ? await uploadMedia(userId, img, "portfolio") : null;
      const { error } = await supabase.from("portfolio_items").insert({ title: f.title.trim().slice(0, 120), description: f.description.trim().slice(0, 1000), link: f.link || null, image_url, artist_id: artistId, user_id: userId });
      if (error) throw error;
      setF({ title: "", description: "", link: "" }); setImg(null); (e.target as HTMLFormElement).reset(); refresh();
    } catch (err) { toast.error(err instanceof Error ? err.message : "Error"); }
    setBusy(false);
  }
  return (
    <Section title="Agregar al portafolio" form={
      <form onSubmit={add} className="grid gap-3 sm:grid-cols-2">
        <Input placeholder="Título (videoclip, sesión, colaboración…)" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />
        <Input placeholder="Enlace (YouTube, etc.)" value={f.link} onChange={(e) => setF({ ...f, link: e.target.value })} />
        <Textarea placeholder="Descripción" className="sm:col-span-2" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} />
        <Input type="file" accept="image/*" onChange={(e) => setImg(e.target.files?.[0] ?? null)} />
        <Button disabled={busy} className="rounded-full">{busy ? "Guardando…" : "Agregar"}</Button>
      </form>
    }>
      <ItemList items={items} onRemove={remove} render={(p) => (<><p className="font-semibold">{p.title}</p><p className="truncate text-sm text-muted-foreground">{p.description}</p></>)} />
    </Section>
  );
}

function Events({ userId, artistId }: { userId: string; artistId: string }) {
  const { items, refresh, remove } = useItems("events", artistId);
  const [f, setF] = useState({ title: "", venue: "", city: "", event_date: "", ticket_link: "" });
  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!f.title.trim() || !f.event_date) return toast.error("Título y fecha son obligatorios");
    if (f.ticket_link && !urlOpt.safeParse(f.ticket_link).success) return toast.error("Enlace no válido");
    const { error } = await supabase.from("events").insert({
      title: f.title.trim().slice(0, 120), venue: f.venue.trim().slice(0, 120), city: f.city.trim().slice(0, 80),
      event_date: new Date(f.event_date).toISOString(), ticket_link: f.ticket_link || null, artist_id: artistId, user_id: userId,
    });
    if (error) return toast.error(error.message);
    setF({ title: "", venue: "", city: "", event_date: "", ticket_link: "" }); refresh();
  }
  return (
    <Section title="Agregar evento" form={
      <form onSubmit={add} className="grid gap-3 sm:grid-cols-2">
        <Input placeholder="Nombre del evento" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />
        <Input type="datetime-local" value={f.event_date} onChange={(e) => setF({ ...f, event_date: e.target.value })} />
        <Input placeholder="Lugar" value={f.venue} onChange={(e) => setF({ ...f, venue: e.target.value })} />
        <Input placeholder="Ciudad" value={f.city} onChange={(e) => setF({ ...f, city: e.target.value })} />
        <Input placeholder="Enlace de entradas (opcional)" value={f.ticket_link} onChange={(e) => setF({ ...f, ticket_link: e.target.value })} />
        <Button className="rounded-full">Agregar</Button>
      </form>
    }>
      <ItemList items={items} onRemove={remove} render={(ev) => (<><p className="font-semibold">{ev.title}</p><p className="text-sm text-muted-foreground">{new Date(ev.event_date).toLocaleString("es")} · {[ev.venue, ev.city].filter(Boolean).join(", ")}</p></>)} />
    </Section>
  );
}
