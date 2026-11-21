import api from "./api";

export interface UserProfile {
  id: number | string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  department?: string | null;
  zone?: string | null;
  roles?: string[];
}

export type ProfileUpdate = Partial<
  Pick<UserProfile, "firstName" | "lastName" | "phone" | "department" | "zone">
>;

export const fetchProfile = async (): Promise<UserProfile> => {
  const res = await api.get("/users/profile");
  return res.data;
};

export const updateProfile = async (
  body: ProfileUpdate
): Promise<UserProfile> => {
  const res = await api.patch("/users/profile", body);
  return res.data.user;
};

export const changePassword = async (
  currentPassword: string,
  newPassword: string
): Promise<void> => {
  await api.patch("/users/change-password", { currentPassword, newPassword });
};

export interface DirectoryUser {
  id: number;
  firstName?: string | null;
  lastName?: string | null;
  email: string;
  roles?: string[];
}

/** Managers only (admin / sst_manager): user picker. */
export const searchUsers = async (search: string): Promise<DirectoryUser[]> => {
  const res = await api.get("/users", { params: { search: search || undefined, limit: 20 } });
  const body = res.data as { data?: DirectoryUser[] } | DirectoryUser[];
  return Array.isArray(body) ? body : body.data ?? [];
};
