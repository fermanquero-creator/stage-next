import { Link } from "@tanstack/react-router";
import { MapPin, Music2 } from "lucide-react";

export type ArtistRow = {
  id: string;
  stage_name: string;
  genre: string;
  city: string;
  bio: string;
  photo_url: string | null;
};

export function ArtistCard({ artist }: { artist: ArtistRow }) {
  return (
    <Link
      to="/artista/$id"
      params={{ id: artist.id }}
      className="group block overflow-hidden rounded-2xl border bg-card transition hover:-translate-y-1 hover:border-primary/60"
    >
      <div className="relative aspect-square overflow-hidden bg-muted">
        {artist.photo_url ? (
          <img src={artist.photo_url} alt={artist.stage_name} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" loading="lazy" />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground"><Music2 className="h-12 w-12" /></div>
        )}
        <span className="absolute left-3 top-3 rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground">{artist.genre}</span>
      </div>
      <div className="p-4">
        <h3 className="truncate text-lg font-semibold">{artist.stage_name}</h3>
        {artist.city && (
          <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground"><MapPin className="h-3.5 w-3.5" />{artist.city}</p>
        )}
        <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{artist.bio || "Artista emergente"}</p>
      </div>
    </Link>
  );
}
