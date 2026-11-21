import { Platform } from "react-native";
import Constants from "expo-constants";
import { router } from "expo-router";
import { registerDevice, unregisterDevice } from "./notificationApi";
import { storage } from "./storage";

/**
 * Push notifications (native only). Every function is a no-op on web and
 * never throws: push must not break login/logout.
 */
const isNative = Platform.OS === "ios" || Platform.OS === "android";
const PUSH_TOKEN_KEY = "expoPushToken";

type NotificationsModule = typeof import("expo-notifications");
let Notifications: NotificationsModule | null = null;
if (isNative) {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  Notifications = require("expo-notifications");
}

let handlerConfigured = false;
let coldStartHandled = false;

export const configureNotificationHandler = () => {
  if (!Notifications || handlerConfigured) return;
  handlerConfigured = true;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
};

const setupAndroidChannels = async () => {
  if (!Notifications || Platform.OS !== "android") return;
  await Notifications.setNotificationChannelAsync("default", {
    name: "default",
    importance: Notifications.AndroidImportance.DEFAULT,
  });
  await Notifications.setNotificationChannelAsync("emergency", {
    name: "emergency",
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 500, 250, 500],
    lightColor: "#DC2626",
  });
};

/** Request permission, fetch the Expo token and register it with the backend. */
export const registerForPush = async (): Promise<void> => {
  if (!Notifications) return;
  try {
    await setupAndroidChannels();
    const Device = require("expo-device") as typeof import("expo-device");
    if (!Device.isDevice) return; // simulators have no push token

    const projectId: string | undefined =
      Constants.expoConfig?.extra?.eas?.projectId ??
      (Constants as any).easConfig?.projectId;
    if (!projectId) {
      console.warn("[push] No EAS projectId configured: push registration skipped");
      return;
    }

    let { status } = await Notifications.getPermissionsAsync();
    if (status !== "granted") {
      status = (await Notifications.requestPermissionsAsync()).status;
    }
    if (status !== "granted") return;

    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
    await registerDevice(token, Platform.OS);
    await storage.setItem(PUSH_TOKEN_KEY, token);
  } catch (e: any) {
    console.warn("[push] registration failed:", e?.message ?? "unknown error");
  }
};

/** Unregister this device. Must be called BEFORE the auth token is cleared. */
export const unregisterFromPush = async (): Promise<void> => {
  if (!isNative) return;
  try {
    const token = await storage.getItem(PUSH_TOKEN_KEY);
    if (!token) return;
    await unregisterDevice(token);
    await storage.removeItem(PUSH_TOKEN_KEY);
  } catch (e: any) {
    console.warn("[push] unregister failed:", e?.message ?? "unknown error");
  }
};

const openFromData = (data: Record<string, unknown> | undefined) => {
  const incidentId = data?.incidentId;
  if (incidentId !== undefined && incidentId !== null && incidentId !== "") {
    router.push({
      pathname: "/incident/[id]",
      params: { id: String(incidentId) },
    });
  } else {
    router.push("/(extra)/notifications");
  }
};

/** Listen to notification taps (incl. the one that cold-started the app). Returns cleanup. */
export const subscribeToNotificationTaps = (): (() => void) => {
  if (!Notifications) return () => {};
  const sub = Notifications.addNotificationResponseReceivedListener((resp) => {
    openFromData(resp.notification.request.content.data as any);
  });
  if (!coldStartHandled) {
    coldStartHandled = true;
    Notifications.getLastNotificationResponseAsync()
      .then((resp) => {
        if (resp) openFromData(resp.notification.request.content.data as any);
      })
      .catch(() => {});
  }
  return () => sub.remove();
};
