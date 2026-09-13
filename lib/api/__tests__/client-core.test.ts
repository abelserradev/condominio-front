import {
  buildJsonAuthHeaders,
  buildMultipartAuthHeaders,
  resolveApiBaseUrl,
} from "../client-core";

describe("resolveApiBaseUrl", () => {
  it("usa /api en contexto browser", () => {
    expect(resolveApiBaseUrl({ isBrowser: true })).toBe("/api");
  });

  it("normaliza URL de servidor vía env", () => {
    expect(
      resolveApiBaseUrl({
        isBrowser: false,
        serverEnvUrl: "http://localhost:3001/",
      }),
    ).toBe("http://localhost:3001");
  });
});

describe("buildJsonAuthHeaders", () => {
  it("incluye slug y Bearer cuando hay token", () => {
    const headers = buildJsonAuthHeaders({
      buildingSlug: "torre-a",
      bearerToken: "jwt-abc",
    });
    expect(headers["x-building-slug"]).toBe("torre-a");
    expect(headers.Authorization).toBe("Bearer jwt-abc");
    expect(headers["Content-Type"]).toBe("application/json");
  });

  it("omite Authorization sin token", () => {
    const headers = buildJsonAuthHeaders({
      buildingSlug: "torre-a",
      bearerToken: null,
    });
    expect(headers.Authorization).toBeUndefined();
  });
});

describe("buildMultipartAuthHeaders", () => {
  it("no fuerza Content-Type (FormData)", () => {
    const headers = buildMultipartAuthHeaders({
      buildingSlug: "x",
      bearerToken: "t",
    });
    expect(headers["Content-Type"]).toBeUndefined();
    expect(headers.Authorization).toBe("Bearer t");
  });
});
