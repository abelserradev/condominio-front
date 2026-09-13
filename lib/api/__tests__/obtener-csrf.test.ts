import { obtenerCsrfToken } from "../../api";

describe("obtenerCsrfToken", () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("GET al endpoint csrf con credentials include", async () => {
    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ csrfToken: "csrf-test" }),
    });

    const token = await obtenerCsrfToken();

    expect(token).toBe("csrf-test");
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringMatching(/\/csrf\/token$/),
      expect.objectContaining({
        method: "GET",
        credentials: "include",
      }),
    );
  });

  it("falla si la respuesta no trae csrfToken", async () => {
    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({}),
    });

    await expect(obtenerCsrfToken()).rejects.toThrow(/CSRF/i);
  });
});
