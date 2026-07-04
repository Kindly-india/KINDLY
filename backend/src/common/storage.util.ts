// Helpers for cleaning up Supabase Storage objects when their owning rows go
// away. Postgres FK cascades only delete rows — the files in Storage are a
// separate system and must be removed explicitly.

// Supabase public URLs look like:
//   https://<project>.supabase.co/storage/v1/object/public/<bucket>/<path>
// Older code stored the full public URL; newer code stores a bare object path.
// This returns the object path within the bucket for either form.
export function storagePathFromStored(value: string, bucket: string): string {
  const marker = `/${bucket}/`;
  const idx = value.indexOf(marker);
  return idx >= 0 ? value.slice(idx + marker.length) : value;
}

// Best-effort delete of objects from a bucket. Never throws — Storage cleanup
// must not fail the primary operation (the row/state change already happened),
// and a missing object is fine.
export async function removeFromStorage(
  client: any,
  bucket: string,
  values: (string | null | undefined)[],
): Promise<void> {
  const paths = values
    .filter((v): v is string => typeof v === 'string' && v.length > 0)
    .map((v) => storagePathFromStored(v, bucket));
  if (paths.length === 0) return;
  try {
    await client.storage.from(bucket).remove(paths);
  } catch {
    /* best-effort — don't surface cleanup failures */
  }
}
