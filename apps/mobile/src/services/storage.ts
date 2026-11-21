import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

const TOKEN_KEY = "authToken";
const USER_KEY = "userData";

// SecureStore is unavailable on web: fall back to AsyncStorage (localStorage).
const isWeb = Platform.OS === "web";

async function getItem(key: string): Promise<string | null> {
  if (isWeb) return AsyncStorage.getItem(key);
  return SecureStore.getItemAsync(key);
}

async function setItem(key: string, value: string): Promise<void> {
  if (isWeb) return AsyncStorage.setItem(key, value);
  await SecureStore.setItemAsync(key, value);
}

async function removeItem(key: string): Promise<void> {
  if (isWeb) return AsyncStorage.removeItem(key);
  await SecureStore.deleteItemAsync(key);
}

export const storage = {
  getItem,
  setItem,
  removeItem,
  getToken: () => getItem(TOKEN_KEY),
  setToken: (token: string) => setItem(TOKEN_KEY, token),
  getUser: async <T = unknown>(): Promise<T | null> => {
    const raw = await getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  },
  setUser: (user: unknown) => setItem(USER_KEY, JSON.stringify(user)),
  clear: async () => {
    await removeItem(TOKEN_KEY);
    await removeItem(USER_KEY);
  },
};
