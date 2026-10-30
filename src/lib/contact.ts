export function getContactHref(contact: string | null | undefined) {
  const value = contact?.trim();
  if (!value) return null;

  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    return `mailto:${value}`;
  }
  if (/^\+?[\d\s().-]+$/.test(value)) {
    const phone = value.replace(/[^\d+]/g, "");
    return phone ? `tel:${phone}` : null;
  }

  try {
    const url = new URL(/^[a-z][a-z\d+.-]*:/i.test(value) ? value : `https://${value}`);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null;
  } catch {
    return null;
  }
}
