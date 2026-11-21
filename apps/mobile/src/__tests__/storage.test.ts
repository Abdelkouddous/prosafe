const loadStorage = (os: string) => {
  jest.resetModules();
  const secure = { getItemAsync: jest.fn().mockResolvedValue("sv"), setItemAsync: jest.fn(), deleteItemAsync: jest.fn() };
  const async = { getItem: jest.fn().mockResolvedValue("as"), setItem: jest.fn(), removeItem: jest.fn() };
  jest.doMock("expo-secure-store", () => secure);
  jest.doMock("@react-native-async-storage/async-storage", () => ({ __esModule: true, default: async }));
  jest.doMock("react-native", () => ({ Platform: { OS: os } }));
  const { storage } = require("@/services/storage");
  return { storage, secure, async };
};

describe("storage", () => {
  it("uses SecureStore on native", async () => {
    const { storage, secure, async } = loadStorage("android");
    expect(await storage.getToken()).toBe("sv");
    await storage.setToken("t");
    expect(secure.setItemAsync).toHaveBeenCalledWith("authToken", "t");
    expect(async.getItem).not.toHaveBeenCalled();
    expect(async.setItem).not.toHaveBeenCalled();
  });
  it("uses AsyncStorage on web", async () => {
    const { storage, secure, async } = loadStorage("web");
    expect(await storage.getToken()).toBe("as");
    await storage.setToken("t");
    expect(async.setItem).toHaveBeenCalledWith("authToken", "t");
    expect(secure.getItemAsync).not.toHaveBeenCalled();
  });
  it("getUser parses JSON and returns null on invalid/missing", async () => {
    const m = loadStorage("ios");
    m.secure.getItemAsync.mockResolvedValueOnce('{"a":1}');
    expect(await m.storage.getUser()).toEqual({ a: 1 });
    m.secure.getItemAsync.mockResolvedValueOnce("{bad");
    expect(await m.storage.getUser()).toBeNull();
    m.secure.getItemAsync.mockResolvedValueOnce(null);
    expect(await m.storage.getUser()).toBeNull();
  });
  it("clear removes token and user", async () => {
    const { storage, secure } = loadStorage("ios");
    await storage.clear();
    expect(secure.deleteItemAsync).toHaveBeenCalledWith("authToken");
    expect(secure.deleteItemAsync).toHaveBeenCalledWith("userData");
  });
});
