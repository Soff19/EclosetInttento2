import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { google } from "googleapis";
import { mockPrisma } from "../setup";

const googleMocks = vi.hoisted(() => ({
  generateAuthUrl: vi.fn((options: { state?: string }) =>
    `https://accounts.google.com/o/oauth2/auth?state=${options.state}`,
  ),
  getToken: vi.fn(),
  verifyIdToken: vi.fn(),
}));

vi.mock("googleapis", () => ({
  google: {
    auth: {
      OAuth2: vi.fn(function OAuth2Mock() {
        return {
        generateAuthUrl: googleMocks.generateAuthUrl,
        getToken: googleMocks.getToken,
        verifyIdToken: googleMocks.verifyIdToken,
        };
      }),
    },
  },
}));

const identidad = {
  sub: "google-subject-1",
  email: "google@example.com",
  email_verified: true,
  name: "Google User",
  picture: "https://example.com/profile.jpg",
};

function callbackRequest(state: string, query = "code=authorization-code") {
  return new NextRequest(
    `http://localhost:3000/api/auth/google/callback?${query}&state=${state}`,
    { headers: { Cookie: `google_oauth_state=${state}` } },
  );
}

describe("OAuth de Google", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("NEXTAUTH_URL", "");
    vi.stubEnv("GOOGLE_CLIENT_ID", "client-id-for-test");
    vi.stubEnv("GOOGLE_CLIENT_SECRET", "client-secret-for-test");
    googleMocks.getToken.mockResolvedValue({ tokens: { id_token: "verified-id-token" } });
    googleMocks.verifyIdToken.mockResolvedValue({ getPayload: () => identidad });
  });

  it("genera una URL con state y callback del host actual", async () => {
    const { GET } = await import("@/app/api/auth/google/route");
    const response = await GET(new NextRequest("http://localhost:3000/api/auth/google"));
    const state = response.cookies.get("google_oauth_state")?.value;
    const authorizationUrl = new URL(response.headers.get("location") || "");

    expect(response.status).toBe(307);
    expect(state).toMatch(/^[a-f0-9]{64}$/);
    expect(authorizationUrl.searchParams.get("state")).toBe(state);
    expect(googleMocks.generateAuthUrl).toHaveBeenCalledWith(
      expect.objectContaining({ scope: ["openid", "email", "profile"] }),
    );
    expect(google.auth.OAuth2).toHaveBeenCalledWith(
      "client-id-for-test",
      "client-secret-for-test",
      "http://localhost:3000/api/auth/google/callback",
    );
  });

  it("rechaza callbacks con state inválido antes de intercambiar el código", async () => {
    const { GET } = await import("@/app/api/auth/google/callback/route");
    const response = await GET(callbackRequest("estado-distinto", "code=authorization-code&state=otro"));

    expect(response.headers.get("location")).toContain("google_state_invalid");
    expect(googleMocks.getToken).not.toHaveBeenCalled();
  });

  it("inicia sesión y persiste el subject verificado en vez de guardar tokens de Google", async () => {
    mockPrisma.usuario.findUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null);
    mockPrisma.usuario.create.mockResolvedValue({
      id: "new-google-user",
      email: identidad.email,
      googleId: identidad.sub,
      nombre: identidad.name,
      fotoPerfil: identidad.picture,
      password: "GOOGLE_AUTH",
      rol: "USUARIA",
      estado: "ACTIVA",
      perfilCompletado: false,
    });

    const { GET } = await import("@/app/api/auth/google/callback/route");
    const response = await GET(callbackRequest("state-valid"));
    const data = await response.text();

    expect(response.headers.get("location")).toContain("/onboarding");
    expect(response.cookies.get("token")?.value).toBeTruthy();
    expect(response.cookies.get("google_oauth_state")?.value).toBe("");
    expect(mockPrisma.usuario.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        email: identidad.email,
        googleId: identidad.sub,
        password: "GOOGLE_AUTH",
      }),
    });
    expect(data).not.toContain("verified-id-token");
  });

  it("vincula una cuenta manual con el mismo correo solo tras validar la identidad de Google", async () => {
    mockPrisma.usuario.findUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        id: "manual-user",
        email: identidad.email,
        password: "$2a$10$manual-password-hash",
        googleId: null,
        nombre: "Manual User",
        fotoPerfil: null,
        rol: "USUARIA",
        estado: "ACTIVA",
      });
    mockPrisma.usuario.update.mockResolvedValue({
      id: "manual-user",
      email: identidad.email,
      password: "$2a$10$manual-password-hash",
      googleId: identidad.sub,
      nombre: "Manual User",
      fotoPerfil: identidad.picture,
      rol: "USUARIA",
      estado: "ACTIVA",
      perfilCompletado: true,
    });

    const { GET } = await import("@/app/api/auth/google/callback/route");
    const response = await GET(callbackRequest("state-valid"));

    expect(response.headers.get("location")).toContain("/home");
    expect(response.cookies.get("token")?.value).toBeTruthy();
    expect(mockPrisma.usuario.update).toHaveBeenCalledWith({
      where: { id: "manual-user" },
      data: expect.objectContaining({ googleId: identidad.sub }),
    });
    expect(mockPrisma.usuario.create).not.toHaveBeenCalled();
  });

  it("rechaza la identidad si Google no marca el correo como verificado", async () => {
    googleMocks.verifyIdToken.mockResolvedValue({
      getPayload: () => ({ ...identidad, email_verified: false }),
    });

    const { GET } = await import("@/app/api/auth/google/callback/route");
    const response = await GET(callbackRequest("state-valid"));

    expect(response.headers.get("location")).toContain("google_email_unverified");
    expect(mockPrisma.usuario.findUnique).not.toHaveBeenCalled();
  });
});
