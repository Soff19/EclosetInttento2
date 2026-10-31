function normalizeTags(tags: unknown[]): string[] {
  return tags
    .filter((tag): tag is string => typeof tag === "string")
    .map((tag) => tag.trim().toLowerCase().replace(/^#/, ""))
    .filter(Boolean);
}

export function parseProductTags(value: string | null): string[] {
  if (!value) return [];

  try {
    const parsed: unknown = JSON.parse(value);
    if (Array.isArray(parsed)) return normalizeTags(parsed);
    if (typeof parsed === "string") return normalizeTags(parsed.split(","));
    return [];
  } catch {
    return normalizeTags(value.split(","));
  }
}

export function serializeProductTags(value: unknown): string | null {
  const tags = Array.isArray(value)
    ? normalizeTags(value)
    : typeof value === "string"
      ? normalizeTags(value.split(","))
      : null;

  return tags === null ? null : JSON.stringify(tags);
}
