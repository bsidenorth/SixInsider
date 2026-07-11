/**
 * Turns a headline into a URL-safe slug, with a short random suffix to
 * avoid collisions between near-duplicate titles.
 * e.g. "Rockstar confirms new footage!" -> "rockstar-confirms-new-footage-a1b2"
 */
export function slugify(title) {
  const base = title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // strip accents
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 70)
    .replace(/-+$/g, "");

  const suffix = Math.random().toString(36).slice(2, 6);
  return `${base}-${suffix}`;
}
