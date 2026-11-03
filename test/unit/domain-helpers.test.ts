import { describe, expect, it } from "vitest";
import { parseFechaCalendario } from "@/lib/calendario";
import { getContactHref } from "@/lib/contact";
import {
  obtenerSugerenciasGenerales,
  recomendarPrenda,
} from "@/lib/recomendacionesClima";
import type { DatosClima } from "@/types/clima";
import type { Prenda } from "@/types/prenda";

const clima = (overrides: Partial<DatosClima> = {}): DatosClima => ({
  ciudad: "Buenos Aires",
  temperatura: 22,
  sensacionTermica: 22,
  humedad: 50,
  vientoKmh: 10,
  probabilidadLluvia: 0,
  descripcion: "nublado",
  condicion: "nublado",
  ...overrides,
});

const prenda = (overrides: Partial<Prenda> = {}): Prenda => ({
  id: "prenda-1",
  nombre: "Prenda",
  urlImagen: "https://example.com/prenda.jpg",
  categoria: "ropa",
  usuarioId: "usuario-1",
  ...overrides,
});

describe("recomendarPrenda", () => {
  it("prioriza prendas para lluvia y adapta la recomendación al tipo", () => {
    expect(recomendarPrenda(prenda({ nombre: "Botas impermeables" }), clima({
      probabilidadLluvia: 40,
    }))).toContain("probabilidad de lluvia");
    expect(recomendarPrenda(prenda({ nombre: "Campera" }), clima({
      probabilidadLluvia: 80,
    }))).toContain("Puede llover");
  });

  it("recomienda abrigo, capas, ropa fresca y prendas contra el viento", () => {
    expect(recomendarPrenda(prenda({ nombre: "Buzo" }), clima({
      temperatura: 11,
    }))).toContain("hace frío");
    expect(recomendarPrenda(prenda({ nombre: "Pantalón" }), clima({
      temperatura: 12,
    }))).toContain("fresco");
    expect(recomendarPrenda(prenda({ nombre: "Vestido" }), clima({
      temperatura: 26,
    }))).toContain("calor");
    expect(recomendarPrenda(prenda({ nombre: "Abrigo" }), clima({
      vientoKmh: 30,
    }))).toContain("viento fuerte");
  });

  it("descarta prendas sueltas con viento y devuelve null si no hay coincidencias", () => {
    expect(recomendarPrenda(prenda({ nombre: "Vestido liviano" }), clima({
      vientoKmh: 30,
    }))).toBeNull();
    expect(recomendarPrenda(prenda({ nombre: "Sombrero" }), clima())).toBeNull();
  });

  it("normaliza acentos y admite etiquetas JSON o texto plano", () => {
    expect(recomendarPrenda(prenda({ nombre: "Buzo", etiquetas: '["invierno"]' }), clima({
      temperatura: 10,
    }))).toContain("hace frío");
    expect(recomendarPrenda(prenda({ nombre: "Ropa", etiquetas: "campera" }), clima({
      temperatura: 10,
    }))).toContain("hace frío");
  });
});

describe("obtenerSugerenciasGenerales", () => {
  it("incluye sugerencias para frío, lluvia y viento", () => {
    expect(obtenerSugerenciasGenerales(clima({
      temperatura: 5,
      probabilidadLluvia: 40,
      vientoKmh: 30,
    }))).toHaveLength(3);
  });

  it("contempla clima fresco, caluroso y condiciones templadas", () => {
    expect(obtenerSugerenciasGenerales(clima({ temperatura: 20 }))[0]).toContain("fresco");
    expect(obtenerSugerenciasGenerales(clima({ temperatura: 26 }))[0]).toContain("calor");
    expect(obtenerSugerenciasGenerales(clima())[0]).toContain("cómodas");
  });
});

describe("parseFechaCalendario", () => {
  it("valida fecha, hora y límites del calendario", () => {
    expect(parseFechaCalendario("2026-02-28", "23:59")?.toISOString())
      .toBe("2026-02-28T23:59:00.000Z");
    expect(parseFechaCalendario("2024-02-29")).not.toBeNull();
    expect(parseFechaCalendario("2026-02-29")).toBeNull();
    expect(parseFechaCalendario("2026-13-01")).toBeNull();
    expect(parseFechaCalendario("01-01-2026")).toBeNull();
    expect(parseFechaCalendario(20260101)).toBeNull();
    expect(parseFechaCalendario("2026-01-01", "24:00")).toBeNull();
    expect(parseFechaCalendario("2026-01-01", "12:60")).toBeNull();
    expect(parseFechaCalendario("2026-01-01", 12)).toBeNull();
    expect(parseFechaCalendario("2026-01-01", "")?.toISOString())
      .toBe("2026-01-01T00:00:00.000Z");
  });
});

describe("getContactHref", () => {
  it("normaliza correo, teléfono y enlaces web", () => {
    expect(getContactHref(" user@example.com ")).toBe("mailto:user@example.com");
    expect(getContactHref("+54 (11) 5555-1234")).toBe("tel:+541155551234");
    expect(getContactHref("example.com")).toBe("https://example.com/");
    expect(getContactHref("http://example.com")).toBe("http://example.com/");
  });

  it("rechaza datos vacíos, inválidos y protocolos que no sean web", () => {
    expect(getContactHref(null)).toBeNull();
    expect(getContactHref("   ")).toBeNull();
    expect(getContactHref("not a contact")).toBeNull();
    expect(getContactHref("javascript:alert(1)")).toBeNull();
  });
});
