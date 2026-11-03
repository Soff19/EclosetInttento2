export const MARKETPLACE_TYPES = [
  ["short", "Short"],
  ["remera", "Remera"],
  ["blusa", "Blusa"],
  ["vestido", "Vestido"],
  ["camisa", "Camisa"],
  ["zapatos", "Zapatos"],
] as const;

const MARKETPLACE_SIZE_GROUPS = {
  arriba: ["XXS", "XS", "S", "M", "L", "XL", "XXL", "3XL"],
  abajo: ["30", "32", "34", "36", "38", "40", "42", "44", "46"],
  calzado: ["34", "35", "36", "37", "38", "39", "40", "41", "42", "43", "44", "45", "46", "47"],
} as const;

const SIZE_GROUP_BY_TYPE: Record<string, keyof typeof MARKETPLACE_SIZE_GROUPS> = {
  remera: "arriba",
  blusa: "arriba",
  vestido: "arriba",
  camisa: "arriba",
  short: "abajo",
  zapatos: "calzado",
};

export function getMarketplaceSizes(type: string) {
  const group = SIZE_GROUP_BY_TYPE[type];
  return group ? MARKETPLACE_SIZE_GROUPS[group] : [];
}
