// src/lib/auth.ts
// Keep active session Bearer tokens strictly in JS memory rather than localStorage.
let memoryToken: string | null = null;

export const setToken = (token: string) => {
  memoryToken = token || null;
};

export const getToken = (): string | null => {
  return memoryToken;
};

export const removeToken = () => {
  memoryToken = null;
};

export const isAuthenticated = (): boolean => {
  return memoryToken !== null;
};

export const getAuthHeader = (): { Authorization: string } | Record<string, never> => {
  return memoryToken ? { Authorization: `Bearer ${memoryToken}` } : {};
};
