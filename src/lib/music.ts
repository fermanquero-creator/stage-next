import { supabase } from "@/integrations/supabase/client";

export const GENRES = [
  "Pop", "Rock", "Indie", "Hip Hop", "Reggaetón", "Electrónica", "Jazz",
  "R&B", "Folk", "Metal", "Cumbia", "Clásica", "Otro",
];

const TEN_YEARS = 60 * 60 * 24 * 365 * 10;

/** Uploads to the private media bucket under the user's folder and returns a long-lived URL. */
export async function uploadMedia(userId: string, file: File, folder: string) {
  const ext = file.name.split(".").pop() ?? "bin";
  const path = `${userId}/${folder}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("media").upload(path, file, { contentType: file.type });
  if (error) throw error;
  const { data, error: e2 } = await supabase.storage.from("media").createSignedUrl(path, TEN_YEARS);
  if (e2 || !data) throw e2 ?? new Error("No se pudo obtener el enlace");
  return data.signedUrl;
}
