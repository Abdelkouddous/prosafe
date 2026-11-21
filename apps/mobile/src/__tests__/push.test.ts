jest.mock("expo-router", () => ({ router: { push: jest.fn() } }));
jest.mock("@/services/notificationApi", () => ({ registerDevice: jest.fn(), unregisterDevice: jest.fn() }));
jest.mock("@/services/storage", () => ({ storage: { getItem: jest.fn(), setItem: jest.fn(), removeItem: jest.fn() } }));
jest.mock("expo-constants", () => ({ __esModule: true, default: {} }));
jest.mock("expo-notifications", () => ({}));
import { router } from "expo-router";
import { routeForNotification } from "@/services/push";

const push = router.push as jest.Mock;
beforeEach(() => push.mockClear());

describe("routeForNotification", () => {
  it("conversationId -> conversation", () => {
    expect(routeForNotification("message", { conversationId: 4 })).toBe(true);
    expect(push).toHaveBeenCalledWith({ pathname: "/conversation/[id]", params: { id: "4" } });
  });
  it("incidentId -> incident detail", () => {
    expect(routeForNotification("incident", { incidentId: "12" })).toBe(true);
    expect(push).toHaveBeenCalledWith({ pathname: "/incident/[id]", params: { id: "12" } });
  });
  it("conversation wins over incident", () => {
    routeForNotification(null, { conversationId: 1, incidentId: 2 });
    expect(push).toHaveBeenCalledWith({ pathname: "/conversation/[id]", params: { id: "1" } });
  });
  it("ignores empty ids", () => {
    expect(routeForNotification("other", { conversationId: "", incidentId: null })).toBe(false);
  });
  it.each([
    ["training", "/(tabs)/trainings"],
    ["inventory", "/(extra)/stock"],
    ["maintenance", "/(extra)/stock"],
    ["emergency", "/(extra)/emergency"],
  ])("type %s -> %s", (type, path) => {
    expect(routeForNotification(type, {})).toBe(true);
    expect(push).toHaveBeenCalledWith(path);
  });
  it("uses data.type when type missing", () => {
    expect(routeForNotification(undefined, { type: "training" })).toBe(true);
    expect(push).toHaveBeenCalledWith("/(tabs)/trainings");
  });
  it("unknown -> false, no navigation", () => {
    expect(routeForNotification("weird", undefined)).toBe(false);
    expect(push).not.toHaveBeenCalled();
  });
});
