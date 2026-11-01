import { describe, it, expect } from "vitest";

// Función parseEtiquetas extraída del route de prendas
function parseEtiquetas(raw: FormDataEntryValue | null): string | null {
  if (raw == null || raw === "") return null;
  const text = String(raw);
  try {
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) {
      return JSON.stringify(
        parsed.map((t) => String(t).toLowerCase().trim()).filter(Boolean)
      );
    }
  } catch {
    // texto plano separado por comas
  }
  const list = text
    .split(",")
    .map((t) => t.toLowerCase().trim().replace(/^#/, ""))
    .filter(Boolean);
  return list.length ? JSON.stringify(list) : null;
}

describe("Utils - parseEtiquetas", () => {
  it("debe retornar null para entrada null", () => {
    expect(parseEtiquetas(null)).toBeNull();
  });

  it("debe retornar null para string vacío", () => {
    expect(parseEtiquetas("")).toBeNull();
  });

  it("debe parsear un array JSON de etiquetas", () => {
    const input = '["Casual", "Verano", "Playa"]';
    const result = parseEtiquetas(input);
    expect(result).toBe('["casual","verano","playa"]');
  });

  it("debe parsear etiquetas separadas por coma", () => {
    const input = "casual, formal, trabajo";
    const result = parseEtiquetas(input);
    expect(result).toBe('["casual","formal","trabajo"]');
  });

  it("debe remover el símbolo # de las etiquetas", () => {
    const input = "#moda, #verano, #tendencia";
    const result = parseEtiquetas(input);
    expect(result).toBe('["moda","verano","tendencia"]');
  });

  it("debe convertir a minúsculas", () => {
    const input = "CASUAL, FORMAL, Trabajo";
    const result = parseEtiquetas(input);
    expect(result).toBe('["casual","formal","trabajo"]');
  });

  it("debe filtrar elementos vacíos", () => {
    const input = "casual,, formal,  , trabajo";
    const result = parseEtiquetas(input);
    expect(result).toBe('["casual","formal","trabajo"]');
  });

  it("debe manejar espacios extra", () => {
    const input = "  casual  ,  formal  ,  trabajo  ";
    const result = parseEtiquetas(input);
    expect(result).toBe('["casual","formal","trabajo"]');
  });
});

describe("Utils - Validaciones de precio", () => {
  const validatePrecio = (precio: unknown): boolean => {
    if (typeof precio !== "number") return false;
    if (isNaN(precio)) return false;
    if (precio < 0) return false;
    return true;
  };

  it("debe aceptar precios válidos", () => {
    expect(validatePrecio(100)).toBe(true);
    expect(validatePrecio(0)).toBe(true);
    expect(validatePrecio(99.99)).toBe(true);
  });

  it("debe rechazar precios negativos", () => {
    expect(validatePrecio(-1)).toBe(false);
    expect(validatePrecio(-100.50)).toBe(false);
  });

  it("debe rechazar valores no numéricos", () => {
    expect(validatePrecio("100")).toBe(false);
    expect(validatePrecio(null)).toBe(false);
    expect(validatePrecio(undefined)).toBe(false);
    expect(validatePrecio(NaN)).toBe(false);
  });
});

describe("Utils - Validaciones de email", () => {
  const validateEmail = (email: string): boolean => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  it("debe aceptar emails válidos", () => {
    expect(validateEmail("test@example.com")).toBe(true);
    expect(validateEmail("user.name@domain.co")).toBe(true);
    expect(validateEmail("user+tag@example.org")).toBe(true);
  });

  it("debe rechazar emails inválidos", () => {
    expect(validateEmail("invalid")).toBe(false);
    expect(validateEmail("@example.com")).toBe(false);
    expect(validateEmail("test@")).toBe(false);
    expect(validateEmail("test@.com")).toBe(false);
    expect(validateEmail("")).toBe(false);
  });
});

describe("Utils - Validaciones de puntuación de reseña", () => {
  const validatePuntuacion = (puntuacion: number): boolean => {
    return Number.isInteger(puntuacion) && puntuacion >= 1 && puntuacion <= 5;
  };

  it("debe aceptar puntuaciones válidas (1-5)", () => {
    expect(validatePuntuacion(1)).toBe(true);
    expect(validatePuntuacion(3)).toBe(true);
    expect(validatePuntuacion(5)).toBe(true);
  });

  it("debe rechazar puntuaciones fuera de rango", () => {
    expect(validatePuntuacion(0)).toBe(false);
    expect(validatePuntuacion(6)).toBe(false);
    expect(validatePuntuacion(-1)).toBe(false);
  });

  it("debe rechazar puntuaciones no enteras", () => {
    expect(validatePuntuacion(3.5)).toBe(false);
    expect(validatePuntuacion(4.9)).toBe(false);
  });
});
