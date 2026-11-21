import type { AxiosAdapter } from "axios";
jest.mock("@/services/storage", () => ({
  storage: { getToken: jest.fn().mockResolvedValue("tok"), clear: jest.fn().mockResolvedValue(undefined) },
}));
import api, { onUnauthorized } from "@/services/api";
import { storage } from "@/services/storage";

const respond = (status: number): AxiosAdapter => async (config) => {
  const res = { data: {}, status, statusText: "", headers: {}, config };
  if (status >= 400) throw Object.assign(new Error("fail"), { config, response: res, isAxiosError: true });
  return res as any;
};

beforeEach(() => jest.clearAllMocks());

describe("api interceptors", () => {
  it("adds bearer token", async () => {
    let auth: any;
    api.defaults.adapter = async (config) => { auth = config.headers.Authorization; return { data: {}, status: 200, statusText: "", headers: {}, config } as any; };
    await api.get("/x");
    expect(auth).toBe("Bearer tok");
  });
  it("401 clears storage and notifies listeners", async () => {
    const l = jest.fn();
    const off = onUnauthorized(l);
    api.defaults.adapter = respond(401);
    await expect(api.get("/incidents")).rejects.toBeDefined();
    expect(storage.clear).toHaveBeenCalled();
    expect(l).toHaveBeenCalledTimes(1);
    off();
    await expect(api.get("/incidents")).rejects.toBeDefined();
    expect(l).toHaveBeenCalledTimes(1);
  });
  it("401 on /auth/login does not clear nor notify", async () => {
    const l = jest.fn();
    const off = onUnauthorized(l);
    api.defaults.adapter = respond(401);
    await expect(api.post("/auth/login", {})).rejects.toBeDefined();
    expect(storage.clear).not.toHaveBeenCalled();
    expect(l).not.toHaveBeenCalled();
    off();
  });
  it("non-401 errors do not notify", async () => {
    const l = jest.fn();
    const off = onUnauthorized(l);
    api.defaults.adapter = respond(500);
    await expect(api.get("/x")).rejects.toBeDefined();
    expect(l).not.toHaveBeenCalled();
    off();
  });
});
