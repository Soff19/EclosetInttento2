import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const request = (query = "?lat=-34.6&lon=-58.4") =>
  new NextRequest(`http://localhost/api/clima${query}`);

const weather = (main = "Clouds") => ({
  name: "Buenos Aires",
  main: { temp: 18.4, feels_like: 17.6, humidity: 65 },
  wind: { speed: 5 },
  weather: [{ main, description: "nubes dispersas" }],
});

const forecast = (list: unknown[] = [{ pop: 0.2 }, { pop: 0.6 }, { pop: 0.1 }]) => ({ list });
const response = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status });

describe("GET /api/clima", () => {
  beforeEach(() => {
    vi.stubEnv("OPENWEATHER_API_KEY", "weather-test-key");
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it.each([
    "?lat=91&lon=0",
    "?lat=0&lon=-181",
    "?lat=abc&lon=0",
    "?lat=0",
  ])("rechaza coordenadas inválidas (%s)", async (query) => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const { GET } = await import("@/app/api/clima/route");

    const result = await GET(request(query));

    expect(result.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("informa cuando falta configurar la clave", async () => {
    vi.stubEnv("OPENWEATHER_API_KEY", "");
    const { GET } = await import("@/app/api/clima/route");

    expect((await GET(request())).status).toBe(503);
  });

  it.each([
    [401, 200, 502],
    [200, 429, 429],
    [200, 500, 502],
  ])("traduce errores del proveedor (%i, %i)", async (first, second, expected) => {
    vi.stubGlobal("fetch", vi.fn()
      .mockResolvedValueOnce(response({}, first))
      .mockResolvedValueOnce(response({}, second)));
    const { GET } = await import("@/app/api/clima/route");

    expect((await GET(request())).status).toBe(expected);
  });

  it("devuelve un error si el proveedor responde con datos incompletos", async () => {
    vi.stubGlobal("fetch", vi.fn()
      .mockResolvedValueOnce(response({ main: { temp: 20 } }))
      .mockResolvedValueOnce(response(forecast())));
    const { GET } = await import("@/app/api/clima/route");

    expect((await GET(request())).status).toBe(502);
  });

  it.each([
    ["Thunderstorm", "tormenta"],
    ["Drizzle", "lluvia"],
    ["Snow", "nieve"],
    ["Fog", "niebla"],
    ["Clear", "soleado"],
    ["Clouds", "nublado"],
  ])("normaliza la condición %s", async (main, condicion) => {
    vi.stubGlobal("fetch", vi.fn()
      .mockResolvedValueOnce(response(weather(main)))
      .mockResolvedValueOnce(response(forecast())));
    const { GET } = await import("@/app/api/clima/route");

    const result = await GET(request());
    const data = await result.json();

    expect(result.status).toBe(200);
    expect(result.headers.get("Cache-Control")).toContain("s-maxage=600");
    expect(data).toMatchObject({
      ciudad: "Buenos Aires",
      temperatura: 18,
      sensacionTermica: 18,
      vientoKmh: 18,
      probabilidadLluvia: 60,
      condicion,
    });
  });

  it("usa valores de respaldo y captura errores de conexión", async () => {
    vi.stubGlobal("fetch", vi.fn()
      .mockResolvedValueOnce(response({
        main: { temp: 20 },
        weather: [{ description: "sin detalle" }],
      }))
      .mockResolvedValueOnce(response({ list: [{}, {}, {}] })));
    const { GET } = await import("@/app/api/clima/route");
    const result = await GET(request("?lat=90&lon=180"));
    const data = await result.json();
    expect(data).toMatchObject({
      ciudad: "Tu ubicación",
      sensacionTermica: 20,
      vientoKmh: 0,
      probabilidadLluvia: 0,
    });

    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    expect((await GET(request())).status).toBe(502);
  });
});
