// Nest's global ValidationPipe runs without `transform: true` (see P2-6 in
// PROJECT_REVIEW.md), so a DTO's @Transform decorator affects what gets
// *validated* but not what the handler actually receives — the handler still
// sees the original, untransformed body. These re-apply the same
// normalization right before a profile write so what's stored always matches
// what was validated, regardless of that quirk.

// Trims and, if missing, adds a protocol. Website/LinkedIn/Instagram are
// stored as raw <a href> targets on public profiles — without a protocol,
// "linkedin.com/x" resolves as a relative link on the current page instead
// of an external one, silently producing a broken link even for input that
// passes validation (IsUrl's require_protocol:false permits no-protocol
// values, but nothing was ever adding it back before use).
export function normalizeUrlField(value: string | undefined): string | undefined {
  if (value === undefined) return undefined;
  const trimmed = value.trim();
  if (!trimmed) return trimmed;
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

export function normalizeTrimmedField(value: string | undefined): string | undefined {
  return value === undefined ? undefined : value.trim();
}

// Only website/linkedin/instagram/upi_id had explicit @Transform trimming —
// every other free-text field (name, phone, city, tagline, ...) had none, so
// a copy-pasted trailing space/newline landed in the DB as-is (confirmed:
// phone saved as "9876543210 "). Applies a plain top-level .trim() to every
// string value on the object; skips arrays/objects (team_members,
// achievements) since those are normalized separately, one level down.
export function trimAllStrings<T extends Record<string, any>>(obj: T): T {
  for (const key of Object.keys(obj)) {
    const value = obj[key];
    if (typeof value === 'string') {
      (obj as any)[key] = value.trim();
    }
  }
  return obj;
}

// Same as normalizeUrlField/normalizeTrimmedField, applied to each item of a
// team_members/achievements array so a nested link/image_url that passed
// validation (trimmed, non-empty) also lands in storage trimmed and with a
// protocol — the array itself receives the raw untransformed body for the
// same transform:false reason as every other field here.
export function normalizeTeamMembers(items: any[] | undefined): any[] | undefined {
  if (!items) return items;
  return items.map((m) => ({
    ...m,
    name: typeof m.name === 'string' ? m.name.trim() : m.name,
    role: typeof m.role === 'string' ? m.role.trim() : m.role,
    img: m.img ? normalizeUrlField(m.img) : m.img,
  }));
}

export function normalizeAchievements(items: any[] | undefined): any[] | undefined {
  if (!items) return items;
  return items.map((a) => ({
    ...a,
    title: typeof a.title === 'string' ? a.title.trim() : a.title,
    date: typeof a.date === 'string' ? a.date.trim() : a.date,
    image_url: a.image_url ? normalizeUrlField(a.image_url) : a.image_url,
    link: a.link ? normalizeUrlField(a.link) : a.link,
  }));
}
